import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().regex(objectIdRegex).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().regex(objectIdRegex).nullable().optional(),
});
