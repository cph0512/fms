import { Request, Response, NextFunction } from 'express';
import * as journalService from './journal.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const result = await journalService.listEntries(companyId, req.query as any);
    res.json(successResponse(result.entries, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function getByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const entry = await journalService.getEntryById(req.params.id as string, companyId);
    res.json(successResponse(entry));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId, userId } = req.user!;
    const entry = await journalService.createEntry(req.body, companyId, userId);
    res.status(201).json(successResponse(entry));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const entry = await journalService.updateEntry(req.params.id as string, companyId, req.body);
    res.json(successResponse(entry));
  } catch (err) {
    next(err);
  }
}

export async function postHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const entry = await journalService.postEntry(req.params.id as string, companyId);
    res.json(successResponse(entry));
  } catch (err) {
    next(err);
  }
}

export async function voidHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.user!;
    const entry = await journalService.voidEntry(req.params.id as string, companyId);
    res.json(successResponse(entry));
  } catch (err) {
    next(err);
  }
}
