import { z } from 'zod';

export const submitFormSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    submitter_name: z.string().min(1).max(100),
    customer_name: z.string().min(1).max(200),
    notes: z.string().optional(),
    rows: z.array(z.object({
      row_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      route_content: z.string().min(1).max(200),
      description: z.string().max(500).optional(),
      trips_count: z.number().int().positive().default(1),
      amount: z.number(),
    })).min(1),
  }),
});

export const listSubmissionsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['PENDING', 'IMPORTED', 'REJECTED']).optional(),
  }),
});

export const reviewSubmissionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(['IMPORTED', 'REJECTED']),
  }),
});
