import { Request, Response, NextFunction } from 'express';
import * as budgetsService from './budgets.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const result = await budgetsService.listBudgets(companyId, req.query as any);
    res.json(successResponse(result.budgets, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function getByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const budget = await budgetsService.getBudgetById(req.params.id as string, companyId);
    res.json(successResponse(budget));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId, userId } = req.user!;
    const budget = await budgetsService.createBudget(req.body, companyId, userId);
    res.status(201).json(successResponse(budget));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const budget = await budgetsService.updateBudget(req.params.id as string, companyId, req.body);
    res.json(successResponse(budget));
  } catch (err) {
    next(err);
  }
}

export async function vsActualHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const result = await budgetsService.getBudgetVsActual(req.params.id as string, companyId);
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}
