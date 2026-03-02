import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';
import { parsePagination, paginationMeta } from '../../shared/utils/pagination.js';

export async function listBudgets(
  companyId: string,
  query: { page?: string; limit?: string; fiscal_year?: string; status?: string }
) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Record<string, unknown> = { company_id: companyId };
  if (query.fiscal_year) where.fiscal_year = parseInt(query.fiscal_year, 10);
  if (query.status) where.status = query.status;

  const [budgets, total] = await Promise.all([
    prisma.budget.findMany({
      where: where as any,
      skip,
      take,
      orderBy: [{ fiscal_year: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { lines: true } } },
    }),
    prisma.budget.count({ where: where as any }),
  ]);

  return { budgets, meta: paginationMeta(total, page, limit) };
}

export async function getBudgetById(budgetId: string, companyId: string) {
  const budget = await prisma.budget.findFirst({
    where: { budget_id: budgetId, company_id: companyId },
    include: {
      lines: {
        include: { account: { select: { account_id: true, account_code: true, account_name: true, account_type: true } } },
        orderBy: { account: { account_code: 'asc' } },
      },
    },
  });

  if (!budget) {
    throw new AppError(404, 'NOT_FOUND', 'Budget not found');
  }

  return budget;
}

export async function createBudget(
  data: {
    fiscal_year: number;
    name: string;
    description?: string;
    lines?: Array<{
      account_id: string;
      month_01?: number; month_02?: number; month_03?: number; month_04?: number;
      month_05?: number; month_06?: number; month_07?: number; month_08?: number;
      month_09?: number; month_10?: number; month_11?: number; month_12?: number;
    }>;
  },
  companyId: string,
  userId: string
) {
  return prisma.budget.create({
    data: {
      fiscal_year: data.fiscal_year,
      name: data.name,
      description: data.description,
      company_id: companyId,
      created_by: userId,
      ...(data.lines && {
        lines: {
          create: data.lines.map((line) => ({
            account_id: line.account_id,
            month_01: line.month_01 ?? 0, month_02: line.month_02 ?? 0,
            month_03: line.month_03 ?? 0, month_04: line.month_04 ?? 0,
            month_05: line.month_05 ?? 0, month_06: line.month_06 ?? 0,
            month_07: line.month_07 ?? 0, month_08: line.month_08 ?? 0,
            month_09: line.month_09 ?? 0, month_10: line.month_10 ?? 0,
            month_11: line.month_11 ?? 0, month_12: line.month_12 ?? 0,
          })),
        },
      }),
    },
    include: {
      lines: {
        include: { account: { select: { account_code: true, account_name: true } } },
      },
    },
  });
}

export async function updateBudget(
  budgetId: string,
  companyId: string,
  data: {
    name?: string;
    description?: string | null;
    status?: string;
    lines?: Array<{
      account_id: string;
      month_01?: number; month_02?: number; month_03?: number; month_04?: number;
      month_05?: number; month_06?: number; month_07?: number; month_08?: number;
      month_09?: number; month_10?: number; month_11?: number; month_12?: number;
    }>;
  }
) {
  const existing = await prisma.budget.findFirst({
    where: { budget_id: budgetId, company_id: companyId },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Budget not found');
  }

  return prisma.$transaction(async (tx) => {
    if (data.lines) {
      await tx.budgetLine.deleteMany({ where: { budget_id: budgetId } });
      await tx.budgetLine.createMany({
        data: data.lines.map((line) => ({
          budget_id: budgetId,
          account_id: line.account_id,
          month_01: line.month_01 ?? 0, month_02: line.month_02 ?? 0,
          month_03: line.month_03 ?? 0, month_04: line.month_04 ?? 0,
          month_05: line.month_05 ?? 0, month_06: line.month_06 ?? 0,
          month_07: line.month_07 ?? 0, month_08: line.month_08 ?? 0,
          month_09: line.month_09 ?? 0, month_10: line.month_10 ?? 0,
          month_11: line.month_11 ?? 0, month_12: line.month_12 ?? 0,
        })),
      });
    }

    const { lines: _, ...updateData } = data;
    return tx.budget.update({
      where: { budget_id: budgetId },
      data: updateData as any,
      include: {
        lines: {
          include: { account: { select: { account_code: true, account_name: true } } },
        },
      },
    });
  });
}

export async function getBudgetVsActual(budgetId: string, companyId: string) {
  const budget = await getBudgetById(budgetId, companyId);

  // Get actual amounts from journal entries for the fiscal year
  const startDate = new Date(budget.fiscal_year, 0, 1);
  const endDate = new Date(budget.fiscal_year, 11, 31);

  const actuals = await prisma.journalEntryLine.groupBy({
    by: ['account_id'],
    where: {
      entry: {
        company_id: companyId,
        status: 'POSTED',
        entry_date: { gte: startDate, lte: endDate },
      },
    } as any,
    _sum: { debit_amount: true, credit_amount: true },
  });

  const actualMap = new Map(actuals.map((a) => [a.account_id, {
    debit: Number(a._sum.debit_amount ?? 0),
    credit: Number(a._sum.credit_amount ?? 0),
  }]));

  const comparison = budget.lines.map((line: any) => {
    const budgetTotal = Number(line.month_01) + Number(line.month_02) + Number(line.month_03) +
      Number(line.month_04) + Number(line.month_05) + Number(line.month_06) +
      Number(line.month_07) + Number(line.month_08) + Number(line.month_09) +
      Number(line.month_10) + Number(line.month_11) + Number(line.month_12);

    const actual = actualMap.get(line.account_id);
    const isExpense = ['EXPENSE'].includes(line.account?.account_type);
    const actualTotal = actual
      ? (isExpense ? actual.debit - actual.credit : actual.credit - actual.debit)
      : 0;

    return {
      account_id: line.account_id,
      account_code: line.account?.account_code,
      account_name: line.account?.account_name,
      budget_amount: budgetTotal,
      actual_amount: actualTotal,
      variance: budgetTotal - actualTotal,
      variance_pct: budgetTotal > 0 ? Math.round((actualTotal / budgetTotal) * 100) : 0,
    };
  });

  return { budget: { budget_id: budget.budget_id, fiscal_year: budget.fiscal_year, name: budget.name }, comparison };
}
