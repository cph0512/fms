import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AppError } from '../shared/errors/AppError.js';

const permissionCache = new Map<string, { permissions: string[]; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadPermissions(userId: string, companyId: string): Promise<string[]> {
  const cacheKey = `${userId}:${companyId}`;
  const cached = permissionCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.permissions;
  }

  const roles = await prisma.userCompanyRole.findMany({
    where: { user_id: userId, company_id: companyId },
    include: {
      role: {
        include: {
          role_permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();
  for (const ucr of roles) {
    for (const rp of ucr.role.role_permissions) {
      permissions.add(rp.permission.permission_code);
    }
  }

  const result = Array.from(permissions);
  permissionCache.set(cacheKey, { permissions: result, expires: Date.now() + CACHE_TTL });
  return result;
}

export function invalidatePermissionCache(userId: string, companyId: string) {
  permissionCache.delete(`${userId}:${companyId}`);
}

export function authorize(...requiredPermissions: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'NOT_AUTHENTICATED', 'Authentication required');
      }

      const userPermissions = await loadPermissions(req.user.userId, req.user.companyId);

      const hasPermission = requiredPermissions.every((rp) => userPermissions.includes(rp));
      if (!hasPermission) {
        throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
