import express from "express";
import helmet  from "helmet";
import cors    from "cors";
import routes  from "./routes";
import { donationController } from "./controllers/donationController";
import { globalLimiter }      from "./middleware/rateLimiter";
import { notFound, errorHandler } from "./middleware/error";
import { env } from "./config/env";

const app = express();

// Security headers
app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(globalLimiter);

// ── Stripe webhook MUST use raw body — register BEFORE express.json() ─────────
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  donationController.webhook
);

// JSON body parser for all other routes
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok", service: "hopebridge-api" }));

// API routes
app.use("/api", routes);

// 404 & error handlers (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
