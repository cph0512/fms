import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';
import { parsePagination, paginationMeta } from '../../shared/utils/pagination.js';

export async function listAccounts(
  companyId: string,
  query: { page?: string; limit?: string; search?: string; account_type?: string; is_active?: string }
) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Record<string, unknown> = { company_id: companyId };

  if (query.search) {
    where.OR = [
      { account_code: { contains: query.search, mode: 'insensitive' } },
      { account_name: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.account_type) {
    where.account_type = query.account_type;
  }

  if (query.is_active !== undefined) {
    where.is_active = query.is_active === 'true';
  }

  const [accounts, total] = await Promise.all([
    prisma.account.findMany({
      where: where as any,
      skip,
      take,
      orderBy: { account_code: 'asc' },
      include: { parent: { select: { account_id: true, account_code: true, account_name: true } } },
    }),
    prisma.account.count({ where: where as any }),
  ]);

  return { accounts, meta: paginationMeta(total, page, limit) };
}

export async function getAccountTree(companyId: string) {
  const accounts = await prisma.account.findMany({
    where: { company_id: companyId },
    orderBy: { account_code: 'asc' },
  });

  // Build tree structure
  const map = new Map<string, any>();
  const roots: any[] = [];

  for (const acc of accounts) {
    map.set(acc.account_id, { ...acc, children: [] });
  }

  for (const acc of accounts) {
    const node = map.get(acc.account_id);
    if (acc.parent_account_id && map.has(acc.parent_account_id)) {
      map.get(acc.parent_account_id).children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function getAccountById(accountId: string, companyId: string) {
  const account = await prisma.account.findFirst({
    where: { account_id: accountId, company_id: companyId },
    include: {
      parent: { select: { account_id: true, account_code: true, account_name: true } },
      children: { select: { account_id: true, account_code: true, account_name: true }, orderBy: { account_code: 'asc' } },
    },
  });

  if (!account) {
    throw new AppError(404, 'NOT_FOUND', 'Account not found');
  }

  return account;
}

export async function createAccount(
  data: {
    account_code: string;
    account_name: string;
    account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    parent_account_id?: string;
    description?: string;
    is_active?: boolean;
  },
  companyId: string
) {
  // Check duplicate code
  const existing = await prisma.account.findFirst({
    where: { company_id: companyId, account_code: data.account_code },
  });
  if (existing) {
    throw new AppError(409, 'DUPLICATE', 'Account code already exists');
  }

  let level = 1;
  if (data.parent_account_id) {
    const parent = await prisma.account.findFirst({
      where: { account_id: data.parent_account_id, company_id: companyId },
    });
    if (!parent) {
      throw new AppError(404, 'NOT_FOUND', 'Parent account not found');
    }
    level = parent.level + 1;
  }

  return prisma.account.create({
    data: {
      account_code: data.account_code,
      account_name: data.account_name,
      account_type: data.account_type,
      parent_account_id: data.parent_account_id,
      description: data.description,
      is_active: data.is_active ?? true,
      level,
      company_id: companyId,
    },
  });
}

export async function updateAccount(
  accountId: string,
  companyId: string,
  data: Record<string, unknown>
) {
  const existing = await prisma.account.findFirst({
    where: { account_id: accountId, company_id: companyId },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Account not found');
  }

  // Recalculate level if parent changed
  if (data.parent_account_id !== undefined) {
    if (data.parent_account_id === null) {
      data.level = 1;
    } else {
      const parent = await prisma.account.findFirst({
        where: { account_id: data.parent_account_id as string, company_id: companyId },
      });
      if (!parent) {
        throw new AppError(404, 'NOT_FOUND', 'Parent account not found');
      }
      data.level = parent.level + 1;
    }
  }

  return prisma.account.update({
    where: { account_id: accountId },
    data: data as any,
  });
}
