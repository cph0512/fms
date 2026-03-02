import { z } from 'zod';

export const journalListSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['DRAFT', 'POSTED', 'VOID']).optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
  }),
});

const journalLineSchema = z.object({
  account_id: z.string().uuid(),
  debit_amount: z.number().min(0).default(0),
  credit_amount: z.number().min(0).default(0),
  description: z.string().optional(),
});

export const createJournalEntrySchema = z.object({
  body: z.object({
    entry_date: z.string(),
    description: z.string().optional(),
    lines: z.array(journalLineSchema).min(2, 'At least 2 lines required'),
  }),
});

export const updateJournalEntrySchema = z.object({
  body: z.object({
    entry_date: z.string().optional(),
    description: z.string().nullable().optional(),
    lines: z.array(journalLineSchema).min(2).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const journalIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
