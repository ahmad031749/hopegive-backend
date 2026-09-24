import { Request, Response, NextFunction } from "express";
import { verifyAccess } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";

export interface AuthRequest extends Request {
  donorId?: number;
  donorEmail?: string;
}

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const payload = verifyAccess(header.slice(7));
    req.donorId    = payload.id;
    req.donorEmail = payload.email;
  } catch {
    // token invalid — proceed as guest
  }
  next();
};

export const requireAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new ApiError(401, "Not authenticated");
  try {
    const payload = verifyAccess(header.slice(7));
    req.donorId    = payload.id;
    req.donorEmail = payload.email;
    next();
  } catch {
    throw new ApiError(401, "Token expired or invalid");
  }
};
