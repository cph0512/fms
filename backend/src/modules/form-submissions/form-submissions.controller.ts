import { Request, Response, NextFunction } from 'express';
import * as formService from './form-submissions.service.js';
import { successResponse } from '../../shared/utils/response.js';
import { signFormToken, verifyFormToken } from '../../shared/utils/form-token.js';
import { AppError } from '../../shared/errors/AppError.js';

export async function submitHandler(req: Request, res: Response, next: NextFunction) {
  try {
    let companyId: string;
    try {
      companyId = verifyFormToken(req.body.token);
    } catch {
      throw new AppError(400, 'INVALID_TOKEN', 'Invalid or expired form token');
    }

    const result = await formService.submitForm({
      company_id: companyId,
      submitter_name: req.body.submitter_name,
      customer_name: req.body.customer_name,
      notes: req.body.notes,
      rows: req.body.rows,
    });
    res.status(201).json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function generateTokenHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const token = signFormToken(req.user!.companyId);
    res.json(successResponse({ token }));
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
