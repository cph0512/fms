import { Request, Response, NextFunction } from 'express';
import * as customersService from './customers.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await customersService.listCustomers(req.user!.companyId, req.query as any);
    res.json(successResponse(result.customers, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function getByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await customersService.getCustomerById(req.params.id as string, req.user!.companyId);
    res.json(successResponse(customer));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await customersService.createCustomer(req.body, req.user!.companyId);
    res.status(201).json(successResponse(customer));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await customersService.updateCustomer(req.params.id as string, req.user!.companyId, req.body);
    res.json(successResponse(customer));
  } catch (err) {
    next(err);
  }
}
