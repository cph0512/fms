import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.listUsers(req.user!.companyId, req.query as any);
    res.json(successResponse(result.users, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function getByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(req.params.id as string, req.user!.companyId);
    res.json(successResponse(user));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = {
      ...req.body,
      company_id: req.body.company_id || req.user!.companyId,
    };
    const user = await usersService.createUser(data);
    res.status(201).json(successResponse(user));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUser(req.params.id as string, req.body);
    res.json(successResponse(user));
  } catch (err) {
    next(err);
  }
}

export async function assignRolesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const roles = await usersService.assignRoles(req.params.id as string, req.body.company_id, req.body.role_ids);
    res.json(successResponse(roles));
  } catch (err) {
    next(err);
  }
}

export async function rolesHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const roles = await usersService.getRoles();
    res.json(successResponse(roles));
  } catch (err) {
    next(err);
  }
}
