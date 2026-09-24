import { Request, Response, NextFunction } from "express";
import { CauseRepository } from "../repositories/CauseRepository";

export const causeController = {
  /** GET /api/causes */
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const causes = await CauseRepository.list();
      res.json({ success: true, data: causes });
    } catch (err) {
      next(err);
    }
  },
};
