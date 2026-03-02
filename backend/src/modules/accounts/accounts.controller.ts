import { Request, Response, NextFunction } from 'express';
import * as accountsService from './accounts.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const result = await accountsService.listAccounts(companyId, req.query as any);
    res.json(successResponse(result.accounts, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function treeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const tree = await accountsService.getAccountTree(companyId);
    res.json(successResponse(tree));
  } catch (err) {
    next(err);
  }
}

export async function getByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const account = await accountsService.getAccountById(req.params.id as string, companyId);
    res.json(successResponse(account));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const account = await accountsService.createAccount(req.body, companyId);
    res.status(201).json(successResponse(account));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const account = await accountsService.updateAccount(req.params.id as string, companyId, req.body);
    res.json(successResponse(account));
  } catch (err) {
    next(err);
  }
}
