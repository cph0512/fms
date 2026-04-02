import { Request, Response, NextFunction } from 'express';
import * as formService from './form-submissions.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function submitHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await formService.submitForm(req.body);
    res.status(201).json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await formService.listSubmissions(req.user!.companyId, req.query as any);
    res.json(successResponse(result.data, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function getByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await formService.getSubmissionById(req.params.id as string, req.user!.companyId);
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function reviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await formService.reviewSubmission(
      req.params.id as string,
      req.user!.companyId,
      req.user!.userId,
      req.body.status
    );
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}
