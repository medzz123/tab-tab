import type { z } from 'zod/v4';

export type ZodEntity = z.ZodObject<z.ZodRawShape> | z.ZodSchema;
