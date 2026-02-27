import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { config } from '../../config/index.js';
import { AppError } from '../../shared/errors/AppError.js';
import { parsePagination, paginationMeta } from '../../shared/utils/pagination.js';
import { invalidatePermissionCache } from '../../middleware/authorize.js';

export async function listUsers(
  companyId: string,
  query: { page?: string; limit?: string; search?: string; status?: string }
) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Record<string, unknown> = {
    user_companies: { some: { company_id: companyId } },
  };

  if (query.search) {
    where.OR = [
      { username: { contains: query.search, mode: 'insensitive' } },
      { display_name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.status) {
    where.status = query.status;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: where as any,
      skip,
      take,
      orderBy: { created_at: 'desc' },
      select: {
        user_id: true,
        username: true,
        email: true,
        display_name: true,
        status: true,
        last_login_at: true,
        created_at: true,
        user_company_roles: {
          where: { company_id: companyId },
          include: { role: true },
        },
      },
    }),
    prisma.user.count({ where: where as any }),
  ]);

  return {
    users: users.map((u) => ({
      ...u,
      roles: u.user_company_roles.map((ucr) => ({
        role_id: ucr.role.role_id,
        role_name: ucr.role.role_name,
      })),
      user_company_roles: undefined,
    })),
    meta: paginationMeta(total, page, limit),
  };
}

export async function getUserById(userId: string, companyId: string) {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      username: true,
      email: true,
      display_name: true,
      status: true,
      last_login_at: true,
      created_at: true,
      updated_at: true,
      user_company_roles: {
        where: { company_id: companyId },
        include: { role: true },
      },
      user_companies: {
        where: { company_id: companyId },
      },
    },
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }

  return {
    ...user,
    roles: user.user_company_roles.map((ucr) => ({
      role_id: ucr.role.role_id,
      role_name: ucr.role.role_name,
    })),
    user_company_roles: undefined,
  };
}

export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  display_name: string;
  company_id?: string;
  role_ids?: number[];
}) {
  const hashedPassword = await bcrypt.hash(data.password, config.bcryptRounds);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      password_hash: hashedPassword,
      display_name: data.display_name,
    },
    select: {
      user_id: true,
      username: true,
      email: true,
      display_name: true,
      status: true,
      created_at: true,
    },
  });

  if (data.company_id) {
    await prisma.userCompany.create({
      data: {
        user_id: user.user_id,
        company_id: data.company_id,
        is_default: true,
      },
    });

    if (data.role_ids?.length) {
      await prisma.userCompanyRole.createMany({
        data: data.role_ids.map((role_id) => ({
          user_id: user.user_id,
          role_id,
          company_id: data.company_id!,
        })),
      });
    }
  }

  return user;
}

export async function updateUser(
  userId: string,
  data: { email?: string; display_name?: string; status?: string; password?: string }
) {
  const updateData: Record<string, unknown> = {};

  if (data.email) updateData.email = data.email;
  if (data.display_name) updateData.display_name = data.display_name;
  if (data.status) updateData.status = data.status;
  if (data.password) updateData.password_hash = await bcrypt.hash(data.password, config.bcryptRounds);

  const user = await prisma.user.update({
    where: { user_id: userId },
    data: updateData,
    select: {
      user_id: true,
      username: true,
      email: true,
      display_name: true,
      status: true,
      updated_at: true,
    },
  });

  return user;
}

export async function assignRoles(userId: string, companyId: string, roleIds: number[]) {
  // Verify user belongs to company
  const membership = await prisma.userCompany.findUnique({
    where: { user_id_company_id: { user_id: userId, company_id: companyId } },
  });

  if (!membership) {
    // Auto-add user to company
    await prisma.userCompany.create({
      data: { user_id: userId, company_id: companyId, is_default: false },
    });
  }

  // Replace all roles for this user in this company
  await prisma.userCompanyRole.deleteMany({
    where: { user_id: userId, company_id: companyId },
  });

  await prisma.userCompanyRole.createMany({
    data: roleIds.map((role_id) => ({
      user_id: userId,
      role_id,
      company_id: companyId,
    })),
  });

  invalidatePermissionCache(userId, companyId);

  const roles = await prisma.userCompanyRole.findMany({
    where: { user_id: userId, company_id: companyId },
    include: { role: true },
  });

  return roles.map((ucr) => ({
    role_id: ucr.role.role_id,
    role_name: ucr.role.role_name,
  }));
}

export async function getRoles() {
  return prisma.role.findMany({ orderBy: { role_id: 'asc' } });
}
