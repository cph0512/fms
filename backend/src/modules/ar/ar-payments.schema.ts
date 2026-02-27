import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    invoice_id: z.string().uuid(),
    payment_date: z.string(),
    amount: z.number().positive(),
    payment_method: z.enum(['BANK_TRANSFER', 'CHECK', 'CASH', 'CREDIT_CARD', 'OTHER']).optional(),
    reference_no: z.string().max(50).optional(),
    notes: z.string().optional(),
  }),
});
