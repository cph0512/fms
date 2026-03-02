import { Request, Response, NextFunction } from 'express';
import * as routesService from './delivery-routes.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await routesService.listRoutes(req.user!.companyId, req.query as any);
    res.json(successResponse(result.routes, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function getByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const route = await routesService.getRouteById(req.params.id as string, req.user!.companyId);
    res.json(successResponse(route));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const route = await routesService.createRoute(req.body, req.user!.companyId);
    res.status(201).json(successResponse(route));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const route = await routesService.updateRoute(req.params.id as string, req.user!.companyId, req.body);
    res.json(successResponse(route));
  } catch (err) {
    next(err);
  }
}

export async function batchCreateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await routesService.batchCreateRoutes(req.body.routes, req.user!.companyId);
    res.status(201).json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function getByCustomerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const routes = await routesService.getRoutesByCustomer(req.params.customerId as string, req.user!.companyId);
    res.json(successResponse(routes));
  } catch (err) {
    next(err);
  }
}
