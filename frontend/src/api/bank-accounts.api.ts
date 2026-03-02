import client from './client';

export interface CreateBankAccountRequest {
  account_name: string;
  bank_name: string;
  branch_name?: string;
  account_number: string;
  currency?: string;
  opening_balance?: number;
  notes?: string;
}

export interface UpdateBankAccountRequest {
  account_name?: string;
  bank_name?: string;
  branch_name?: string | null;
  account_number?: string;
  currency?: string;
  opening_balance?: number;
  current_balance?: number;
  is_active?: boolean;
  notes?: string | null;
}

export const bankAccountsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; is_active?: string }) =>
    client.get('/bank-accounts', { params }),
  getById: (id: string) => client.get(`/bank-accounts/${id}`),
  create: (data: CreateBankAccountRequest) => client.post('/bank-accounts', data),
  update: (id: string, data: UpdateBankAccountRequest) => client.put(`/bank-accounts/${id}`, data),
};
