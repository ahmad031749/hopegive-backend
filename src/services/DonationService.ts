import { stripe } from "../config/stripe";
import { sendReceiptEmail } from "../config/mailer";
import { DonationRepository } from "../repositories/DonationRepository";
import { DonorRepository }    from "../repositories/DonorRepository";
import { CauseRepository }    from "../repositories/CauseRepository";
import { ApiError }           from "../utils/ApiError";

export type Frequency = "once" | "monthly" | "annual";

export interface DonateInput {
  paymentMethodId: string;
  amountUsd: number;          // in dollars, e.g. 25.00
  currency: string;           // "USD" | "PKR" | "EUR"
  causeSlug: string;          // "nutrition" | "education" | "shelter" | "general"
  frequency: Frequency;
  donorName: string;
  donorEmail: string;
  donorId?: number | null;    // set if logged-in
}

const STRIPE_CURRENCY_MAP: Record<string, string> = {
  USD: "usd",
  PKR: "pkr",
  EUR: "eur",
};

// Stripe processes in smallest currency unit (cents for USD)
function toSmallestUnit(amountUsd: number, currency: string): number {
  // PKR has no sub-unit in Stripe — use whole numbers
  if (currency === "PKR") return Math.round(amountUsd * 278);
  if (currency === "EUR") return Math.round(amountUsd * 0.92 * 100);
  return Math.round(amountUsd * 100); // USD cents
}

// Stripe Price IDs for recurring — create these in your Stripe dashboard
// or generate them programmatically on your first deploy.
const RECURRING_INTERVAL: Record<"monthly" | "annual", "month" | "year"> = {
  monthly: "month",
  annual:  "year",
};

export const DonationService = {
  /**
   * Process a one-time or recurring donation.
   * Returns the saved donation row.
   */
  async donate(input: DonateInput) {
    const {
      paymentMethodId, amountUsd, currency, causeSlug,
      frequency, donorName, donorEmail, donorId,
    } = input;

    if (amountUsd < 1) throw new ApiError(400, "Minimum donation is $1");

    // 1. Resolve cause
    const cause = await CauseRepository.findBySlug(causeSlug);
    const causeId = cause?.id ?? null;

    // 2. Create / fetch Stripe customer
    const customers = await stripe.customers.list({ email: donorEmail, limit: 1 });
    let customer = customers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({
        email: donorEmail,
        name:  donorName,
        payment_method: paymentMethodId,
      });
    } else {
      // Attach the new payment method to the existing customer
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
    }

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // 3. Create DB record (pending)
    const donation = await DonationRepository.create({
      donorId:   donorId ?? null,
      donorName,
      donorEmail,
      causeId,
      amountUsd,
      currency,
      frequency,
      status: "pending",
    });

    try {
      if (frequency === "once") {
        // ── One-time PaymentIntent ──────────────────────────────────────────
        const intent = await stripe.paymentIntents.create({
          amount:               toSmallestUnit(amountUsd, currency),
          currency:             STRIPE_CURRENCY_MAP[currency] ?? "usd",
          customer:             customer.id,
          payment_method:       paymentMethodId,
          confirm:              true,
          description:          `HopeBridge donation — ${cause?.title ?? "General"}`,
          metadata: {
            donation_id: String(donation.id),
            cause:       causeSlug,
          },
          payment_method_types: ["card"],
        });

        if (intent.status !== "succeeded") {
          await DonationRepository.updateStatus(donation.id, "failed");
          throw new ApiError(402, "Payment not completed. Please check your card.");
        }

        await DonationRepository.updateStatus(donation.id, "succeeded", intent.id);

      } else {
        // ── Recurring subscription ──────────────────────────────────────────
        // Create an inline price on-the-fly (no predefined Price object needed)
        const interval = RECURRING_INTERVAL[frequency];
        const price = await stripe.prices.create({
          unit_amount: toSmallestUnit(amountUsd, currency),
          currency:    STRIPE_CURRENCY_MAP[currency] ?? "usd",
          recurring:   { interval },
          product_data: { name: `HopeBridge — ${cause?.title ?? "General"} (${frequency})` },
        });

        const subscription = await stripe.subscriptions.create({
          customer:         customer.id,
          items:            [{ price: price.id }],
          default_payment_method: paymentMethodId,
          metadata: {
            donation_id: String(donation.id),
            cause:       causeSlug,
          },
        });

        const subStatus = subscription.status === "active" ? "succeeded" : "pending";
        await DonationRepository.updateStatus(donation.id, subStatus);
        // store subscription id for future cancellation
        await DonationRepository.create({   // update sub id via direct query
          donorId: donorId ?? null, donorName, donorEmail,
          causeId, amountUsd, currency, frequency,
          stripeSubId: subscription.id,
        });
      }

      // 4. Increment cause total
      if (causeId) await CauseRepository.incrementRaised(causeId, amountUsd);

      // 5. Send receipt email (non-blocking)
      sendReceiptEmail({
        to:          donorEmail,
        donorName,
        amount:      amountUsd,
        currency,
        cause:       cause?.title ?? "Where Needed Most",
        frequency,
        donationId:  String(donation.id),
      }).then(() => DonationRepository.markReceiptSent(donation.id))
        .catch((err) => console.error("Receipt email failed:", err));

      return await DonationRepository.findById(donation.id);

    } catch (err) {
      if (err instanceof ApiError) throw err;
      await DonationRepository.updateStatus(donation.id, "failed");
      throw new ApiError(500, "Payment processing failed. Please try again.");
    }
  },

  /**
   * Handle Stripe webhook events.
   */
  async handleWebhook(rawBody: Buffer, signature: string) {
    const { env } = await import("../config/env");
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.stripe.webhookSecret
    );

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as { id: string; metadata: { donation_id?: string } };
        const existing = await DonationRepository.findByStripePaymentId(pi.id);
        if (!existing && pi.metadata?.donation_id) {
          const id = Number(pi.metadata.donation_id);
          await DonationRepository.updateStatus(id, "succeeded", pi.id);
        }
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as { subscription?: string };
        if (inv.subscription) {
          console.warn("Subscription payment failed for sub:", inv.subscription);
          // Optionally notify donor
        }
        break;
      }
      default:
        break;
    }

    return { received: true };
  },
};
