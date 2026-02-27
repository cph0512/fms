import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { config } from '../../config/index.js';
import { AppError } from '../../shared/errors/AppError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, blacklistToken } from './token.service.js';

async function getUserPermissions(userId: string, companyId: string): Promise<string[]> {
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
  return Array.from(permissions);
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      user_companies: { include: { company: true } },
      user_company_roles: { include: { role: true } },
    },
  });

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }

  if (user.status === 'LOCKED') {
    if (user.locked_until && user.locked_until < new Date()) {
      await prisma.user.update({
        where: { user_id: user.user_id },
        data: { status: 'ACTIVE', failed_attempts: 0, locked_until: null },
      });
    } else {
      throw new AppError(423, 'ACCOUNT_LOCKED', 'Account is locked. Please try again later.');
    }
  }

  if (user.status === 'INACTIVE') {
    throw new AppError(401, 'ACCOUNT_INACTIVE', 'Account is inactive');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const newAttempts = user.failed_attempts + 1;
    const updateData: Record<string, unknown> = { failed_attempts: newAttempts };

    if (newAttempts >= config.lockoutThreshold) {
      updateData.status = 'LOCKED';
      updateData.locked_until = new Date(Date.now() + config.lockoutDurationMinutes * 60 * 1000);
    }

    await prisma.user.update({ where: { user_id: user.user_id }, data: updateData });
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }

  const defaultCompany = user.user_companies.find((uc) => uc.is_default) || user.user_companies[0];
  if (!defaultCompany) {
    throw new AppError(403, 'NO_COMPANY', 'User is not assigned to any company');
  }

  await prisma.user.update({
    where: { user_id: user.user_id },
    data: { failed_attempts: 0, last_login_at: new Date(), locked_until: null },
  });

  const companyId = defaultCompany.company_id;
  const permissions = await getUserPermissions(user.user_id, companyId);

  const accessToken = signAccessToken({ userId: user.user_id, companyId, username: user.username });
  const refreshToken = signRefreshToken({ userId: user.user_id });

  return {
    accessToken,
    refreshToken,
    user: {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      status: user.status,
    },
    company: defaultCompany.company,
    companies: user.user_companies.map((uc) => ({
      ...uc.company,
      is_default: uc.is_default,
    })),
    permissions,
  };
}

export async function logout(token: string) {
  blacklistToken(token);
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { user_id: payload.userId },
    include: { user_companies: true },
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new AppError(401, 'INVALID_TOKEN', 'User not found or inactive');
  }

  const defaultCompany = user.user_companies.find((uc) => uc.is_default) || user.user_companies[0];
  if (!defaultCompany) {
    throw new AppError(403, 'NO_COMPANY', 'User is not assigned to any company');
  }

  const companyId = defaultCompany.company_id;
  const permissions = await getUserPermissions(user.user_id, companyId);
  const accessToken = signAccessToken({ userId: user.user_id, companyId, username: user.username });

  return { accessToken, permissions };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { user_id: userId } });
  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    throw new AppError(401, 'INVALID_PASSWORD', 'Current password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);
  await prisma.user.update({
    where: { user_id: userId },
    data: { password_hash: hashedPassword },
  });
}
