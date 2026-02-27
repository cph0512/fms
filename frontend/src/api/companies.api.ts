import client from './client';

export interface CreateCompanyRequest {
  company_name: string;
  short_name?: string;
  tax_id?: string;
  representative?: string;
  phone?: string;
  fax?: string;
  address?: string;
  email?: string;
  default_currency?: string;
  tax_rate?: number;
  fiscal_year_start?: number;
}

export interface UpdateCompanyRequest extends Partial<CreateCompanyRequest> {
  status?: 'ACTIVE' | 'INACTIVE';
}

export const companiesApi = {
  list: () => client.get('/companies'),
  getById: (id: string) => client.get(`/companies/${id}`),
  create: (data: CreateCompanyRequest) => client.post('/companies', data),
  update: (id: string, data: UpdateCompanyRequest) => client.put(`/companies/${id}`, data),
  switch: (id: string) => client.post(`/companies/${id}/switch`),
};
