import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError.js';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { errorResponse } from '../shared/utils/response.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.code, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
    res.status(400).json(errorResponse('VALIDATION_ERROR', 'Validation failed', details));
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[]) || [];
      res.status(409).json(errorResponse('DUPLICATE', `Duplicate value for: ${fields.join(', ')}`));
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json(errorResponse('NOT_FOUND', 'Record not found'));
      return;
    }
  }

  console.error('Unhandled error:', err);
  res.status(500).json(errorResponse('INTERNAL_ERROR', 'Internal server error'));
}
