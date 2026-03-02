import client from './client';

export const budgetsApi = {
  list: (params?: { page?: number; limit?: number; fiscal_year?: number; status?: string }) =>
    client.get('/budgets', { params }),
  getById: (id: string) => client.get(`/budgets/${id}`),
  create: (data: any) => client.post('/budgets', data),
  update: (id: string, data: any) => client.put(`/budgets/${id}`, data),
  getVsActual: (id: string) => client.get(`/budgets/${id}/vs-actual`),
};
