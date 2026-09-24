import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const signAccess = (payload: object) =>
  jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpires } as jwt.SignOptions);

export const signRefresh = (payload: object) =>
  jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpires } as jwt.SignOptions);

export const verifyAccess = (token: string) =>
  jwt.verify(token, env.jwtAccessSecret) as jwt.JwtPayload;

export const verifyRefresh = (token: string) =>
  jwt.verify(token, env.jwtRefreshSecret) as jwt.JwtPayload;
