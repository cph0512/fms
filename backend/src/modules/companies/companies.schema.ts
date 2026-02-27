import { z } from 'zod';

export const createCompanySchema = z.object({
  body: z.object({
    company_name: z.string().min(1).max(200),
    short_name: z.string().max(50).optional(),
    tax_id: z.string().regex(/^\d{8}$/, 'Must be exactly 8 digits').optional(),
    representative: z.string().max(50).optional(),
    phone: z.string().max(20).optional(),
    fax: z.string().max(20).optional(),
    address: z.string().optional(),
    email: z.string().email().max(100).optional(),
    default_currency: z.string().length(3).default('TWD'),
    tax_rate: z.number().min(0).max(100).default(5),
    fiscal_year_start: z.number().int().min(1).max(12).default(1),
  }),
});

export const updateCompanySchema = z.object({
  body: z.object({
    company_name: z.string().min(1).max(200).optional(),
    short_name: z.string().max(50).optional(),
    tax_id: z.string().regex(/^\d{8}$/, 'Must be exactly 8 digits').optional(),
    representative: z.string().max(50).optional(),
    phone: z.string().max(20).optional(),
    fax: z.string().max(20).optional(),
    address: z.string().optional(),
    email: z.string().email().max(100).optional(),
    default_currency: z.string().length(3).optional(),
    tax_rate: z.number().min(0).max(100).optional(),
    fiscal_year_start: z.number().int().min(1).max(12).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const switchCompanySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
