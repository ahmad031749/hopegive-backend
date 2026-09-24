import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export const notFound = (_req: Request, res: Response) =>
  res.status(404).json({ success: false, message: "Route not found" });

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const status  = err instanceof ApiError ? err.statusCode : 500;
  const message = err instanceof ApiError
    ? err.message
    : env.nodeEnv === "production" ? "Internal server error" : err.message;
  if (status === 500) console.error(err);
  res.status(status).json({ success: false, message });
};
