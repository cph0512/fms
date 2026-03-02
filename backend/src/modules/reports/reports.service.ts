import { prisma } from '../../config/database.js';

interface ReportRow {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  balance: number;
}

async function getAccountBalances(
  companyId: string,
  dateFilter: Record<string, unknown>
): Promise<ReportRow[]> {
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

  return accounts.map((acc) => {
    const sums = aggMap.get(acc.account_id);
    const totalDebit = Number(sums?.debit_amount ?? 0);
    const totalCredit = Number(sums?.credit_amount ?? 0);
    // ASSET & EXPENSE: debit-normal, others: credit-normal
    const balance = ['ASSET', 'EXPENSE'].includes(acc.account_type)
      ? totalDebit - totalCredit
      : totalCredit - totalDebit;

    return {
      account_id: acc.account_id,
      account_code: acc.account_code,
      account_name: acc.account_name,
      account_type: acc.account_type,
      balance,
    };
  }).filter((r) => r.balance !== 0);
}

export async function getBalanceSheet(companyId: string, query: { as_of_date?: string }) {
  const dateFilter = query.as_of_date
    ? { entry_date: { lte: new Date(query.as_of_date) } }
    : {};

  const rows = await getAccountBalances(companyId, dateFilter);

  const assets = rows.filter((r) => r.account_type === 'ASSET');
  const liabilities = rows.filter((r) => r.account_type === 'LIABILITY');
  const equity = rows.filter((r) => r.account_type === 'EQUITY');

  // Retained earnings = Revenue - Expense (not yet closed)
  const revenue = rows.filter((r) => r.account_type === 'REVENUE');
  const expense = rows.filter((r) => r.account_type === 'EXPENSE');
  const retainedEarnings =
    revenue.reduce((s, r) => s + r.balance, 0) - expense.reduce((s, r) => s + r.balance, 0);

  const totalAssets = assets.reduce((s, r) => s + r.balance, 0);
  const totalLiabilities = liabilities.reduce((s, r) => s + r.balance, 0);
  const totalEquity = equity.reduce((s, r) => s + r.balance, 0) + retainedEarnings;

  return {
    assets,
    liabilities,
    equity,
    retained_earnings: retainedEarnings,
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    total_equity: totalEquity,
    total_liabilities_and_equity: totalLiabilities + totalEquity,
  };
}

export async function getIncomeStatement(
  companyId: string,
  query: { from_date?: string; to_date?: string }
) {
  const dateFilter: Record<string, unknown> = {};
  if (query.from_date || query.to_date) {
    dateFilter.entry_date = {
      ...(query.from_date && { gte: new Date(query.from_date) }),
      ...(query.to_date && { lte: new Date(query.to_date) }),
    };
  }

  const rows = await getAccountBalances(companyId, dateFilter);

  const revenue = rows.filter((r) => r.account_type === 'REVENUE');
  const expenses = rows.filter((r) => r.account_type === 'EXPENSE');

  const totalRevenue = revenue.reduce((s, r) => s + r.balance, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r.balance, 0);
  const netIncome = totalRevenue - totalExpenses;

  return {
    revenue,
    expenses,
    total_revenue: totalRevenue,
    total_expenses: totalExpenses,
    net_income: netIncome,
  };
}
