import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';
import { parsePagination, paginationMeta } from '../../shared/utils/pagination.js';

export async function listBankAccounts(
  companyId: string,
  query: { page?: string; limit?: string; search?: string; is_active?: string }
) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Record<string, unknown> = { company_id: companyId };

  if (query.search) {
    where.OR = [
      { account_name: { contains: query.search, mode: 'insensitive' } },
      { bank_name: { contains: query.search, mode: 'insensitive' } },
      { account_number: { contains: query.search } },
    ];
  }

  if (query.is_active !== undefined) {
    where.is_active = query.is_active === 'true';
  }

  const [bankAccounts, total] = await Promise.all([
    prisma.bankAccount.findMany({
      where: where as any,
      skip,
      take,
      orderBy: { created_at: 'desc' },
    }),
    prisma.bankAccount.count({ where: where as any }),
  ]);

  return { bankAccounts, meta: paginationMeta(total, page, limit) };
}

export async function getBankAccountById(bankAccountId: string, companyId: string) {
  const bankAccount = await prisma.bankAccount.findFirst({
    where: { bank_account_id: bankAccountId, company_id: companyId },
  });

  if (!bankAccount) {
    throw new AppError(404, 'NOT_FOUND', 'Bank account not found');
  }

  return bankAccount;
}

export async function createBankAccount(
  data: {
    account_name: string;
    bank_name: string;
    branch_name?: string;
    account_number: string;
    currency?: string;
    opening_balance?: number;
    notes?: string;
  },
  companyId: string
) {
  const existing = await prisma.bankAccount.findFirst({
    where: { company_id: companyId, account_number: data.account_number },
  });
  if (existing) {
    throw new AppError(409, 'DUPLICATE', 'Account number already exists');
  }

  return prisma.bankAccount.create({
    data: {
      account_name: data.account_name,
      bank_name: data.bank_name,
      branch_name: data.branch_name,
      account_number: data.account_number,
      currency: data.currency ?? 'TWD',
      opening_balance: data.opening_balance ?? 0,
      current_balance: data.opening_balance ?? 0,
      notes: data.notes,
      company_id: companyId,
    },
  });
}

export async function updateBankAccount(
  bankAccountId: string,
  companyId: string,
  data: Record<string, unknown>
) {
  const existing = await prisma.bankAccount.findFirst({
    where: { bank_account_id: bankAccountId, company_id: companyId },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Bank account not found');
  }

  return prisma.bankAccount.update({
    where: { bank_account_id: bankAccountId },
    data: data as any,
  });
}
