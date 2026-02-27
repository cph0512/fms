import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        companyId: string;
        username: string;
      };
    }
  }
}
