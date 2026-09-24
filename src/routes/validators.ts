import { z } from "zod";

export const registerSchema = z.object({
  name:     z.string().min(2).max(120),
  email:    z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const donateSchema = z.object({
  paymentMethodId: z.string().min(1, "paymentMethodId is required"),
  amountUsd:       z.number().positive().min(1),
  currency:        z.enum(["USD", "PKR", "EUR"]).default("USD"),
  causeSlug:       z.enum(["nutrition", "education", "shelter", "general"]).default("general"),
  frequency:       z.enum(["once", "monthly", "annual"]).default("once"),
  donorName:       z.string().min(1).max(160),
  donorEmail:      z.string().email(),
});
