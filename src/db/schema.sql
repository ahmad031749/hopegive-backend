-- HopeBridge database schema

CREATE TABLE IF NOT EXISTS donors (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(160) NOT NULL,
  email        VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(200),                    -- nullable for guest donors
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         SERIAL PRIMARY KEY,
  donor_id   INT REFERENCES donors(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Causes: nutrition | education | shelter | general
CREATE TABLE IF NOT EXISTS causes (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(60) UNIQUE NOT NULL,
  title       VARCHAR(160) NOT NULL,
  description TEXT,
  goal_usd    NUMERIC(12,2) NOT NULL DEFAULT 100000,
  raised_usd  NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donations (
  id                 SERIAL PRIMARY KEY,
  donor_id           INT REFERENCES donors(id) ON DELETE SET NULL,
  donor_name         VARCHAR(160) NOT NULL,
  donor_email        VARCHAR(200) NOT NULL,
  cause_id           INT REFERENCES causes(id) ON DELETE SET NULL,
  amount_usd         NUMERIC(10,2) NOT NULL CHECK (amount_usd > 0),
  currency           VARCHAR(5)  NOT NULL DEFAULT 'USD',
  frequency          VARCHAR(20) NOT NULL DEFAULT 'once',  -- once | monthly | annual
  stripe_payment_id  TEXT,                                 -- PaymentIntent id
  stripe_customer_id TEXT,                                 -- Stripe Customer (for subscriptions)
  stripe_sub_id      TEXT,                                 -- Stripe Subscription id (recurring)
  status             VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | succeeded | failed | refunded
  receipt_sent       BOOLEAN NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donations_donor  ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_cause  ON donations(cause_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
