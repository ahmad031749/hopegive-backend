import { pool } from "../config/db";

export interface DonorRow {
  id: number;
  name: string;
  email: string;
  password_hash: string | null;
  created_at: string;
}

export const DonorRepository = {
  async findByEmail(email: string) {
    const { rows } = await pool.query<DonorRow>(
      `SELECT * FROM donors WHERE email=$1 LIMIT 1`,
      [email]
    );
    return rows[0] ?? null;
  },

  async findById(id: number) {
    const { rows } = await pool.query<DonorRow>(
      `SELECT * FROM donors WHERE id=$1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async create(name: string, email: string, passwordHash: string | null = null) {
    const { rows } = await pool.query<DonorRow>(
      `INSERT INTO donors (name, email, password_hash) VALUES ($1,$2,$3) RETURNING *`,
      [name, email, passwordHash]
    );
    return rows[0];
  },

  async saveRefreshToken(donorId: number, token: string, expiresAt: Date) {
    await pool.query(
      `INSERT INTO refresh_tokens (donor_id, token, expires_at) VALUES ($1,$2,$3)`,
      [donorId, token, expiresAt]
    );
  },

  async deleteRefreshToken(token: string) {
    await pool.query(`DELETE FROM refresh_tokens WHERE token=$1`, [token]);
  },

  async findRefreshToken(token: string) {
    const { rows } = await pool.query<{ donor_id: number; expires_at: string }>(
      `SELECT donor_id, expires_at FROM refresh_tokens WHERE token=$1 LIMIT 1`,
      [token]
    );
    return rows[0] ?? null;
  },
};
