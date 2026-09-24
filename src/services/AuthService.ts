import bcrypt from "bcrypt";
import { DonorRepository } from "../repositories/DonorRepository";
import { signAccess, signRefresh } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";

const SALT_ROUNDS = 12;

export const AuthService = {
  async register(name: string, email: string, password: string) {
    const existing = await DonorRepository.findByEmail(email);
    if (existing) throw new ApiError(409, "Email already registered");

    const hash   = await bcrypt.hash(password, SALT_ROUNDS);
    const donor  = await DonorRepository.create(name, email, hash);
    return issueTokens(donor);
  },

  async login(email: string, password: string) {
    const donor = await DonorRepository.findByEmail(email);
    if (!donor || !donor.password_hash) throw new ApiError(401, "Invalid email or password");

    const ok = await bcrypt.compare(password, donor.password_hash);
    if (!ok) throw new ApiError(401, "Invalid email or password");

    return issueTokens(donor);
  },

  async refresh(token: string) {
    const row = await DonorRepository.findRefreshToken(token);
    if (!row || new Date(row.expires_at) < new Date()) {
      throw new ApiError(401, "Refresh token expired or not found");
    }
    const donor = await DonorRepository.findById(row.donor_id);
    if (!donor) throw new ApiError(401, "Donor not found");

    await DonorRepository.deleteRefreshToken(token);
    return issueTokens(donor);
  },

  async logout(token: string) {
    await DonorRepository.deleteRefreshToken(token);
  },
};

async function issueTokens(donor: { id: number; name: string; email: string }) {
  const payload = { id: donor.id, email: donor.email };
  const accessToken  = signAccess(payload);
  const refreshToken = signRefresh(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await DonorRepository.saveRefreshToken(donor.id, refreshToken, expiresAt);

  return {
    accessToken,
    refreshToken,
    donor: { id: donor.id, name: donor.name, email: donor.email },
  };
}
