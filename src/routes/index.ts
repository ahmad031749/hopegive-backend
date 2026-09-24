import { Router } from "express";
import { authController }     from "../controllers/authController";
import { donationController } from "../controllers/donationController";
import { causeController }    from "../controllers/causeController";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { validate }           from "../middleware/validate";
import { authLimiter, donateLimiter } from "../middleware/rateLimiter";
import { registerSchema, loginSchema, donateSchema } from "./validators";

const router = Router();

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post("/auth/register", authLimiter, validate(registerSchema), authController.register);
router.post("/auth/login",    authLimiter, validate(loginSchema),    authController.login);
router.post("/auth/refresh",  authController.refresh);
router.post("/auth/logout",   authController.logout);

// ── Causes (public) ───────────────────────────────────────────────────────────
router.get("/causes", causeController.list);

// ── Donations ─────────────────────────────────────────────────────────────────
// optionalAuth: logged-in donors get their id attached, guests are fine too
router.post(
  "/donate",
  donateLimiter,
  optionalAuth,
  validate(donateSchema),
  donationController.donate
);

// Donor's own donation history (requires login)
router.get("/donations/me", requireAuth, donationController.myDonations);

export default router;
