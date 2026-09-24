import Stripe from "stripe";
import { env } from "./env";

if (!env.stripe.secretKey) {
  console.warn("⚠️  STRIPE_SECRET_KEY not set — payments will fail in production.");
}

export const stripe = new Stripe(env.stripe.secretKey, {
  apiVersion: "2024-06-20",
});
