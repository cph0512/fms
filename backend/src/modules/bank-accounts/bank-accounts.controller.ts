import { Request, Response, NextFunction } from 'express';
import * as bankAccountsService from './bank-accounts.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const result = await bankAccountsService.listBankAccounts(companyId, req.query as any);
    res.json(successResponse(result.bankAccounts, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function getByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const bankAccount = await bankAccountsService.getBankAccountById(req.params.id as string, companyId);
    res.json(successResponse(bankAccount));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const bankAccount = await bankAccountsService.createBankAccount(req.body, companyId);
    res.status(201).json(successResponse(bankAccount));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const bankAccount = await bankAccountsService.updateBankAccount(req.params.id as string, companyId, req.body);
    res.json(successResponse(bankAccount));
  } catch (err) {
    next(err);
  }
}
