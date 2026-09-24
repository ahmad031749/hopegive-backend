import { Request, Response, NextFunction } from "express";
import { DonationService } from "../services/DonationService";
import { DonationRepository } from "../repositories/DonationRepository";
import { AuthRequest } from "../middleware/auth";
import { env } from "../config/env";

export const donationController = {
  /** POST /api/donate */
  async donate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        paymentMethodId,
        amountUsd,
        currency = "USD",
        causeSlug = "general",
        frequency = "once",
        donorName,
        donorEmail,
      } = req.body;

      const donation = await DonationService.donate({
        paymentMethodId,
        amountUsd: Number(amountUsd),
        currency,
        causeSlug,
        frequency,
        donorName,
        donorEmail,
        donorId: req.donorId ?? null,
      });

      res.status(201).json({ success: true, data: donation });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/donations/me  (requires auth) */
  async myDonations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const donations = await DonationRepository.findByDonor(req.donorId!);
      res.json({ success: true, data: donations });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/stripe/webhook  — raw body, no JSON parse */
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const sig = req.headers["stripe-signature"] as string;
      const result = await DonationService.handleWebhook(req.body as Buffer, sig);
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Webhook error";
      res.status(400).json({ success: false, message });
    }
  },
};
