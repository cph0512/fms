import { Request, Response, NextFunction } from 'express';
import * as paymentsService from './ar-payments.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await paymentsService.createPayment(req.body, req.user!.companyId, req.user!.userId);
    res.status(201).json(successResponse(payment));
  } catch (err) {
    next(err);
  }
}
