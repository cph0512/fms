import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
    display_name: z.string().min(1).max(100),
    company_id: z.string().uuid().optional(),
    role_ids: z.array(z.number().int().positive()).optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email().max(255).optional(),
    display_name: z.string().min(1).max(100).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    password: z.string().min(8).max(128).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const assignRolesSchema = z.object({
  body: z.object({
    company_id: z.string().uuid(),
    role_ids: z.array(z.number().int().positive()).min(1),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const userListSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).optional(),
  }),
});
