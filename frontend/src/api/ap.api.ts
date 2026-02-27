import client from './client';

export interface CreateBillRequest {
  vendor_id: string;
  bill_date: string;
  due_date: string;
  subtotal: number;
  description?: string;
  notes?: string;
}

export interface UpdateBillRequest {
  vendor_id?: string;
  bill_date?: string;
  due_date?: string;
  subtotal?: number;
  description?: string;
  notes?: string;
}

export interface CreateApPaymentRequest {
  bill_id: string;
  payment_date: string;
  amount: number;
  payment_method?: 'BANK_TRANSFER' | 'CHECK' | 'CASH' | 'CREDIT_CARD' | 'OTHER';
  reference_no?: string;
  notes?: string;
}

export const apApi = {
  // Bills
  listBills: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    vendor_id?: string;
    from_date?: string;
    to_date?: string;
  }) => client.get('/ap/bills', { params }),

  getBillById: (id: string) => client.get(`/ap/bills/${id}`),

  createBill: (data: CreateBillRequest) => client.post('/ap/bills', data),

  updateBill: (id: string, data: UpdateBillRequest) =>
    client.put(`/ap/bills/${id}`, data),

  voidBill: (id: string, reason?: string) =>
    client.put(`/ap/bills/${id}/void`, { reason }),

  // Payments
  createPayment: (data: CreateApPaymentRequest) => client.post('/ap/payments', data),
};
