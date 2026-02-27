import client from './client';

export interface CreateInvoiceRequest {
  customer_id: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  description?: string;
  notes?: string;
}

export interface UpdateInvoiceRequest {
  customer_id?: string;
  invoice_date?: string;
  due_date?: string;
  subtotal?: number;
  description?: string;
  notes?: string;
}

export interface CreatePaymentRequest {
  invoice_id: string;
  payment_date: string;
  amount: number;
  payment_method?: 'BANK_TRANSFER' | 'CHECK' | 'CASH' | 'CREDIT_CARD' | 'OTHER';
  reference_no?: string;
  notes?: string;
}

export const arApi = {
  // Invoices
  listInvoices: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    customer_id?: string;
    from_date?: string;
    to_date?: string;
  }) => client.get('/ar/invoices', { params }),

  getInvoiceById: (id: string) => client.get(`/ar/invoices/${id}`),

  createInvoice: (data: CreateInvoiceRequest) => client.post('/ar/invoices', data),

  updateInvoice: (id: string, data: UpdateInvoiceRequest) =>
    client.put(`/ar/invoices/${id}`, data),

  voidInvoice: (id: string, reason?: string) =>
    client.put(`/ar/invoices/${id}/void`, { reason }),

  // Payments
  createPayment: (data: CreatePaymentRequest) => client.post('/ar/payments', data),
};
