import { z } from 'zod/v4';
import type { EnvSchema } from './createEnv';

export const apiEnvSchema = {
  variables: z.object({
    ENVIRONMENT: z.enum(['local', 'development', 'staging', 'production']),
  }),

  secrets: z.object({
    GEMINI_API_KEY: z.string(),
  }),
  injected: z.object({
    PORT: z.string().transform((value) => {
      const port = parseInt(value);
      if (isNaN(port)) throw new Error(`Invalid port: ${value}`);
      return port;
    }),
  }),
  databaseConnections: z.object({
    DATABASE_URL: z.string(),
  }),
  buckets: z.object({}),
  topics: z.object({}),
} satisfies EnvSchema;

export type ApiEnvSchema = z.infer<typeof apiEnvSchema.secrets> &
  z.infer<typeof apiEnvSchema.variables> &
  z.infer<typeof apiEnvSchema.buckets> &
  z.infer<typeof apiEnvSchema.databaseConnections>;
