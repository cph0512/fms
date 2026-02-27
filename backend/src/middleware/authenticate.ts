import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, isBlacklisted } from '../modules/auth/token.service.js';
import { AppError } from '../shared/errors/AppError.js';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'NO_TOKEN', 'Access token is required');
    }

    const token = authHeader.substring(7);
    if (isBlacklisted(token)) {
      throw new AppError(401, 'TOKEN_REVOKED', 'Token has been revoked');
    }

    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      companyId: payload.companyId,
      username: payload.username,
    };

    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    next(new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token'));
  }
}
