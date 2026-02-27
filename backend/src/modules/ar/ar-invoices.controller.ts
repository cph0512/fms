import { Request, Response, NextFunction } from 'express';
import * as invoicesService from './ar-invoices.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await invoicesService.listInvoices(req.user!.companyId, req.query as any);
    res.json(successResponse(result.invoices, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function getByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await invoicesService.getInvoiceById(req.params.id as string, req.user!.companyId);
    res.json(successResponse(invoice));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await invoicesService.createInvoice(req.body, req.user!.companyId, req.user!.userId);
    res.status(201).json(successResponse(invoice));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await invoicesService.updateInvoice(req.params.id as string, req.user!.companyId, req.body);
    res.json(successResponse(invoice));
  } catch (err) {
    next(err);
  }
}

export async function voidHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await invoicesService.voidInvoice(req.params.id as string, req.user!.companyId);
    res.json(successResponse(invoice));
  } catch (err) {
    next(err);
  }
}
