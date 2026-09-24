import { pool } from "../config/db";

export interface CauseRow {
  id: number;
  slug: string;
  title: string;
  description: string;
  goal_usd: string;
  raised_usd: string;
  created_at: string;
}

export const CauseRepository = {
  async list() {
    const { rows } = await pool.query<CauseRow>(
      `SELECT * FROM causes ORDER BY id`
    );
    return rows;
  },

  async findBySlug(slug: string) {
    const { rows } = await pool.query<CauseRow>(
      `SELECT * FROM causes WHERE slug=$1 LIMIT 1`,
      [slug]
    );
    return rows[0] ?? null;
  },

  async incrementRaised(id: number, amountUsd: number) {
    await pool.query(
      `UPDATE causes SET raised_usd = raised_usd + $2 WHERE id=$1`,
      [id, amountUsd]
    );
  },
};
