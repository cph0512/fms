import { z } from 'zod';

export const billListSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID']).optional(),
    vendor_id: z.string().uuid().optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
  }),
});

export const createBillSchema = z.object({
  body: z.object({
    vendor_id: z.string().uuid(),
    bill_date: z.string(),
    due_date: z.string(),
    subtotal: z.number().min(0),
    currency: z.string().length(3).optional(),
    status: z.enum(['DRAFT', 'ISSUED']).optional(),
    description: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateBillSchema = z.object({
  body: z.object({
    vendor_id: z.string().uuid().optional(),
    bill_date: z.string().optional(),
    due_date: z.string().optional(),
    subtotal: z.number().min(0).optional(),
    status: z.enum(['DRAFT', 'ISSUED']).optional(),
    description: z.string().optional(),
    notes: z.string().nullable().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const voidBillSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
