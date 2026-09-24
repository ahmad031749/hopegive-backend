import dotenv from "dotenv";
dotenv.config();

export const env = {
  port:             Number(process.env.PORT || 5000),
  nodeEnv:          process.env.NODE_ENV || "development",
  clientUrl:        process.env.CLIENT_URL || "http://localhost:5173",
  databaseUrl:      process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/hopebridge",
  jwtAccessSecret:  process.env.JWT_ACCESS_SECRET  || "dev_access",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh",
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES  || "15m",
  jwtRefreshExpires:process.env.JWT_REFRESH_EXPIRES || "7d",
  stripe: {
    secretKey:     process.env.STRIPE_SECRET_KEY      || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET  || "",
  },
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "HopeBridge <noreply@hopebridge.org>",
  },
};
