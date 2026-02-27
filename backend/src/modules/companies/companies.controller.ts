import { Request, Response, NextFunction } from 'express';
import * as companiesService from './companies.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const companies = await companiesService.listCompanies(req.user!.userId);
    res.json(successResponse(companies));
  } catch (err) {
    next(err);
  }
}

export async function getByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await companiesService.getCompanyById(req.params.id as string);
    res.json(successResponse(company));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await companiesService.createCompany(req.body, req.user!.userId);
    res.status(201).json(successResponse(company));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await companiesService.updateCompany(req.params.id as string, req.body);
    res.json(successResponse(company));
  } catch (err) {
    next(err);
  }
}

export async function switchHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await companiesService.switchCompany(
      req.user!.userId,
      req.params.id as string,
      req.user!.username
    );
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}
