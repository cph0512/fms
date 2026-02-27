import { Request, Response, NextFunction } from 'express';
import * as billsService from './ap-bills.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await billsService.listBills(req.user!.companyId, req.query as any);
    res.json(successResponse(result.bills, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function getByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await billsService.getBillById(req.params.id as string, req.user!.companyId);
    res.json(successResponse(bill));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await billsService.createBill(req.body, req.user!.companyId, req.user!.userId);
    res.status(201).json(successResponse(bill));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await billsService.updateBill(req.params.id as string, req.user!.companyId, req.body);
    res.json(successResponse(bill));
  } catch (err) {
    next(err);
  }
}

export async function voidHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await billsService.voidBill(req.params.id as string, req.user!.companyId);
    res.json(successResponse(bill));
  } catch (err) {
    next(err);
  }
}
