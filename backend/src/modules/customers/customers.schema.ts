import { z } from 'zod';

export const customerListSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});

export const createCustomerSchema = z.object({
  body: z.object({
    customer_name: z.string().min(1).max(200),
    short_name: z.string().max(50).optional(),
    tax_id: z.string().regex(/^\d{8}$/, 'Must be 8 digits').optional(),
    contact_person: z.string().max(100).optional(),
    phone: z.string().max(30).optional(),
    fax: z.string().max(30).optional(),
    email: z.string().email().max(255).optional(),
    address: z.string().optional(),
    payment_terms: z.number().int().min(0).max(365).optional(),
    credit_limit: z.number().min(0).optional(),
    notes: z.string().optional(),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    customer_name: z.string().min(1).max(200).optional(),
    short_name: z.string().max(50).nullable().optional(),
    tax_id: z.string().regex(/^\d{8}$/, 'Must be 8 digits').nullable().optional(),
    contact_person: z.string().max(100).nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
    fax: z.string().max(30).nullable().optional(),
    email: z.string().email().max(255).nullable().optional(),
    address: z.string().nullable().optional(),
    payment_terms: z.number().int().min(0).max(365).optional(),
    credit_limit: z.number().min(0).optional(),
    notes: z.string().nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
