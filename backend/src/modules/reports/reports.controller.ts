import { Request, Response, NextFunction } from 'express';
import * as reportsService from './reports.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function balanceSheetHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const result = await reportsService.getBalanceSheet(companyId, req.query as any);
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function incomeStatementHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const result = await reportsService.getIncomeStatement(companyId, req.query as any);
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}
