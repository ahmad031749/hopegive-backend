import { pool } from "../config/db";

export interface DonationRow {
  id: number;
  donor_id: number | null;
  donor_name: string;
  donor_email: string;
  cause_id: number | null;
  cause_slug: string | null;
  cause_title: string | null;
  amount_usd: string;
  currency: string;
  frequency: string;
  stripe_payment_id: string | null;
  stripe_sub_id: string | null;
  status: string;
  receipt_sent: boolean;
  created_at: string;
}

export const DonationRepository = {
  async create(data: {
    donorId: number | null;
    donorName: string;
    donorEmail: string;
    causeId: number | null;
    amountUsd: number;
    currency: string;
    frequency: string;
    stripePaymentId?: string;
    stripeSubId?: string;
    status?: string;
  }) {
    const { rows } = await pool.query<DonationRow>(
      `INSERT INTO donations
         (donor_id, donor_name, donor_email, cause_id, amount_usd, currency,
          frequency, stripe_payment_id, stripe_sub_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        data.donorId,
        data.donorName,
        data.donorEmail,
        data.causeId,
        data.amountUsd,
        data.currency,
        data.frequency,
        data.stripePaymentId ?? null,
        data.stripeSubId ?? null,
        data.status ?? "pending",
      ]
    );
    return rows[0];
  },

  async updateStatus(id: number, status: string, stripePaymentId?: string) {
    const { rows } = await pool.query<DonationRow>(
      `UPDATE donations
       SET status=$2, stripe_payment_id=COALESCE($3, stripe_payment_id)
       WHERE id=$1 RETURNING *`,
      [id, status, stripePaymentId ?? null]
    );
    return rows[0];
  },

  async markReceiptSent(id: number) {
    await pool.query(`UPDATE donations SET receipt_sent=true WHERE id=$1`, [id]);
  },

  async findById(id: number) {
    const { rows } = await pool.query<DonationRow>(
      `SELECT d.*, c.slug AS cause_slug, c.title AS cause_title
       FROM donations d LEFT JOIN causes c ON c.id=d.cause_id
       WHERE d.id=$1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async findByDonor(donorId: number) {
    const { rows } = await pool.query<DonationRow>(
      `SELECT d.*, c.slug AS cause_slug, c.title AS cause_title
       FROM donations d LEFT JOIN causes c ON c.id=d.cause_id
       WHERE d.donor_id=$1 ORDER BY d.created_at DESC`,
      [donorId]
    );
    return rows;
  },

  async findByStripePaymentId(stripePaymentId: string) {
    const { rows } = await pool.query<DonationRow>(
      `SELECT * FROM donations WHERE stripe_payment_id=$1 LIMIT 1`,
      [stripePaymentId]
    );
    return rows[0] ?? null;
  },
};
