import { z } from 'zod';

export const budgetListSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    fiscal_year: z.string().optional(),
    status: z.enum(['DRAFT', 'APPROVED', 'CLOSED']).optional(),
  }),
});

const budgetLineSchema = z.object({
  account_id: z.string().uuid(),
  month_01: z.number().min(0).default(0),
  month_02: z.number().min(0).default(0),
  month_03: z.number().min(0).default(0),
  month_04: z.number().min(0).default(0),
  month_05: z.number().min(0).default(0),
  month_06: z.number().min(0).default(0),
  month_07: z.number().min(0).default(0),
  month_08: z.number().min(0).default(0),
  month_09: z.number().min(0).default(0),
  month_10: z.number().min(0).default(0),
  month_11: z.number().min(0).default(0),
  month_12: z.number().min(0).default(0),
});

export const createBudgetSchema = z.object({
  body: z.object({
    fiscal_year: z.number().int().min(2000).max(2099),
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    lines: z.array(budgetLineSchema).optional(),
  }),
});

export const updateBudgetSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().nullable().optional(),
    status: z.enum(['DRAFT', 'APPROVED', 'CLOSED']).optional(),
    lines: z.array(budgetLineSchema).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
