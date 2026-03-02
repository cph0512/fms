import { Request, Response, NextFunction } from 'express';
import * as glService from './gl.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function ledgerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const result = await glService.getAccountLedger(req.params.accountId as string, companyId, req.query as any);
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function trialBalanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const result = await glService.getTrialBalance(companyId, req.query as any);
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}
