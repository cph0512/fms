import { z } from 'zod';

export const invoiceListSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID']).optional(),
    customer_id: z.string().uuid().optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
  }),
});

export const createInvoiceSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid(),
    invoice_date: z.string(),
    due_date: z.string(),
    subtotal: z.number().min(0),
    currency: z.string().length(3).optional(),
    status: z.enum(['DRAFT', 'ISSUED']).optional(),
    description: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateInvoiceSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid().optional(),
    invoice_date: z.string().optional(),
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

export const voidInvoiceSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
