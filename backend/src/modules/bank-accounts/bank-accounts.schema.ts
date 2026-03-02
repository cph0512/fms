import { z } from 'zod';

export const bankAccountListSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    is_active: z.enum(['true', 'false']).optional(),
  }),
});

export const createBankAccountSchema = z.object({
  body: z.object({
    account_name: z.string().min(1).max(200),
    bank_name: z.string().min(1).max(100),
    branch_name: z.string().max(100).optional(),
    account_number: z.string().min(1).max(50),
    currency: z.string().length(3).optional(),
    opening_balance: z.number().optional(),
    notes: z.string().optional(),
  }),
});

export const updateBankAccountSchema = z.object({
  body: z.object({
    account_name: z.string().min(1).max(200).optional(),
    bank_name: z.string().min(1).max(100).optional(),
    branch_name: z.string().max(100).nullable().optional(),
    account_number: z.string().min(1).max(50).optional(),
    currency: z.string().length(3).optional(),
    opening_balance: z.number().optional(),
    current_balance: z.number().optional(),
    is_active: z.boolean().optional(),
    notes: z.string().nullable().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
