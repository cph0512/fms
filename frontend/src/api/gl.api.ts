import client from './client';

export const glApi = {
  getAccountLedger: (accountId: string, params?: { from_date?: string; to_date?: string }) =>
    client.get(`/gl/ledger/${accountId}`, { params }),
  getTrialBalance: (params?: { as_of_date?: string }) =>
    client.get('/gl/trial-balance', { params }),
};
