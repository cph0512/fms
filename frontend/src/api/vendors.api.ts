import client from './client';

export interface CreateVendorRequest {
  vendor_name: string;
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

export interface UpdateVendorRequest extends Partial<CreateVendorRequest> {
  status?: 'ACTIVE' | 'INACTIVE';
}

export const vendorsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    client.get('/vendors', { params }),
  getById: (id: string) => client.get(`/vendors/${id}`),
  create: (data: CreateVendorRequest) => client.post('/vendors', data),
  update: (id: string, data: UpdateVendorRequest) => client.put(`/vendors/${id}`, data),
};
