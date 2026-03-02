import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function summaryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const result = await dashboardService.getDashboardSummary(companyId);
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}
