import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';

export async function getAccountLedger(
  accountId: string,
  companyId: string,
  query: { from_date?: string; to_date?: string }
) {
  const account = await prisma.account.findFirst({
    where: { account_id: accountId, company_id: companyId },
  });

  if (!account) {
    throw new AppError(404, 'NOT_FOUND', 'Account not found');
  }

  const where: Record<string, unknown> = {
    account_id: accountId,
    entry: { company_id: companyId, status: 'POSTED' },
  };

  if (query.from_date || query.to_date) {
    where.entry = {
      ...(where.entry as any),
      entry_date: {
        ...(query.from_date && { gte: new Date(query.from_date) }),
        ...(query.to_date && { lte: new Date(query.to_date) }),
      },
    };
  }

  const lines = await prisma.journalEntryLine.findMany({
    where: where as any,
    include: {
      entry: { select: { entry_number: true, entry_date: true, description: true } },
    },
    orderBy: { entry: { entry_date: 'asc' } },
  });

  // Calculate opening balance (all posted entries before from_date)
  let openingBalance = 0;
  if (query.from_date) {
    const priorLines = await prisma.journalEntryLine.findMany({
      where: {
        account_id: accountId,
        entry: {
          company_id: companyId,
          status: 'POSTED',
          entry_date: { lt: new Date(query.from_date) },
        },
      } as any,
    });
    for (const line of priorLines) {
      openingBalance += Number(line.debit_amount) - Number(line.credit_amount);
    }
  }

  // For LIABILITY, EQUITY, REVENUE accounts: credit increases balance
  const isDebitNormal = ['ASSET', 'EXPENSE'].includes(account.account_type);

  let runningBalance = openingBalance;
  const ledgerLines = lines.map((line) => {
    const debit = Number(line.debit_amount);
    const credit = Number(line.credit_amount);
    runningBalance += debit - credit;
    return {
      ...line,
      debit_amount: debit,
      credit_amount: credit,
      balance: runningBalance,
    };
  });

  return {
    account,
    opening_balance: openingBalance,
    closing_balance: runningBalance,
    is_debit_normal: isDebitNormal,
    lines: ledgerLines,
  };
}

export async function getTrialBalance(companyId: string, query: { as_of_date?: string }) {
  const dateFilter = query.as_of_date
    ? { entry_date: { lte: new Date(query.as_of_date) } }
    : {};

  const accounts = await prisma.account.findMany({
    where: { company_id: companyId, is_active: true },
    orderBy: { account_code: 'asc' },
  });

  const aggregations = await prisma.journalEntryLine.groupBy({
    by: ['account_id'],
    where: {
      entry: {
        company_id: companyId,
        status: 'POSTED',
        ...dateFilter,
      },
    } as any,
    _sum: {
      debit_amount: true,
      credit_amount: true,
    },
  });

  const aggMap = new Map(aggregations.map((a) => [a.account_id, a._sum]));

  const rows = accounts.map((acc) => {
    const sums = aggMap.get(acc.account_id);
    const totalDebit = Number(sums?.debit_amount ?? 0);
    const totalCredit = Number(sums?.credit_amount ?? 0);
    const balance = totalDebit - totalCredit;

    return {
      account_id: acc.account_id,
      account_code: acc.account_code,
      account_name: acc.account_name,
      account_type: acc.account_type,
      total_debit: totalDebit,
      total_credit: totalCredit,
      balance,
    };
  }).filter((r) => r.total_debit !== 0 || r.total_credit !== 0);

  const totalDebit = rows.reduce((sum, r) => sum + r.total_debit, 0);
  const totalCredit = rows.reduce((sum, r) => sum + r.total_credit, 0);

  return { rows, total_debit: totalDebit, total_credit: totalCredit };
}
