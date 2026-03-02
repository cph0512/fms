import client from './client';

export const reportsApi = {
  getBalanceSheet: (params?: { as_of_date?: string }) =>
    client.get('/reports/balance-sheet', { params }),
  getIncomeStatement: (params?: { from_date?: string; to_date?: string }) =>
    client.get('/reports/income-statement', { params }),
};
