import { z } from 'zod';

export const accountListSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    account_type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
    is_active: z.enum(['true', 'false']).optional(),
  }),
});

export const createAccountSchema = z.object({
  body: z.object({
    account_code: z.string().min(1).max(20),
    account_name: z.string().min(1).max(200),
    account_type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
    parent_account_id: z.string().uuid().optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateAccountSchema = z.object({
  body: z.object({
    account_name: z.string().min(1).max(200).optional(),
    account_type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
    parent_account_id: z.string().uuid().nullable().optional(),
    description: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const importConfirmSchema = z.object({
  body: z.object({
    accounts: z.array(
      z.object({
        account_code: z.string().min(1).max(20),
        account_name: z.string().min(1).max(200),
        account_type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
        parent_code: z.string().optional(),
        description: z.string().optional(),
      })
    ).min(1),
  }),
});
