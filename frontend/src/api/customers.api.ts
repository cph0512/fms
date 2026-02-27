import client from './client';

export interface CreateCustomerRequest {
  customer_name: string;
  short_name?: string;
  tax_id?: string;
  contact_person?: string;
  phone?: string;
  fax?: string;
  email?: string;
  address?: string;
  payment_terms?: number;
  credit_limit?: number;
  notes?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  status?: 'ACTIVE' | 'INACTIVE';
}

export const customersApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    client.get('/customers', { params }),
  getById: (id: string) => client.get(`/customers/${id}`),
  create: (data: CreateCustomerRequest) => client.post('/customers', data),
  update: (id: string, data: UpdateCustomerRequest) => client.put(`/customers/${id}`, data),
};
