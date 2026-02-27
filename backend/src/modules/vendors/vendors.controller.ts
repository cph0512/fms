import { Request, Response, NextFunction } from 'express';
import * as vendorsService from './vendors.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await vendorsService.listVendors(req.user!.companyId, req.query as any);
    res.json(successResponse(result.vendors, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function getByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const vendor = await vendorsService.getVendorById(req.params.id as string, req.user!.companyId);
    res.json(successResponse(vendor));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const vendor = await vendorsService.createVendor(req.body, req.user!.companyId);
    res.status(201).json(successResponse(vendor));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const vendor = await vendorsService.updateVendor(req.params.id as string, req.user!.companyId, req.body);
    res.json(successResponse(vendor));
  } catch (err) {
    next(err);
  }
}
