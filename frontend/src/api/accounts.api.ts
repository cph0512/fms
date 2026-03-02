import client from './client';

export interface CreateAccountRequest {
  account_code: string;
  account_name: string;
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  parent_account_id?: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateAccountRequest {
  account_name?: string;
  account_type?: string;
  parent_account_id?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export const accountsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; account_type?: string; is_active?: string }) =>
    client.get('/accounts', { params }),
  tree: () => client.get('/accounts/tree'),
  getById: (id: string) => client.get(`/accounts/${id}`),
  create: (data: CreateAccountRequest) => client.post('/accounts', data),
  update: (id: string, data: UpdateAccountRequest) => client.put(`/accounts/${id}`, data),
};
