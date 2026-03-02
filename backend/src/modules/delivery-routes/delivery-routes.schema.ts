import { z } from 'zod';

export const listRoutesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    customer_id: z.string().uuid().optional(),
    content_type: z.string().optional(),
    search: z.string().optional(),
    is_active: z.enum(['true', 'false']).optional(),
  }),
});

export const createRouteSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid(),
    origin: z.string().min(1).max(50),
    route_name: z.string().min(1).max(200),
    content_type: z.string().min(1).max(50),
    standard_price: z.number().positive(),
    notes: z.string().optional(),
  }),
});

export const updateRouteSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    customer_id: z.string().uuid().optional(),
    origin: z.string().min(1).max(50).optional(),
    route_name: z.string().min(1).max(200).optional(),
    content_type: z.string().min(1).max(50).optional(),
    standard_price: z.number().positive().optional(),
    notes: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
  }),
});

export const batchCreateSchema = z.object({
  body: z.object({
    routes: z.array(
      z.object({
        customer_id: z.string().uuid(),
        origin: z.string().min(1).max(50),
        route_name: z.string().min(1).max(200),
        content_type: z.string().min(1).max(50),
        standard_price: z.number().positive(),
        notes: z.string().optional(),
      })
    ).min(1),
  }),
});
