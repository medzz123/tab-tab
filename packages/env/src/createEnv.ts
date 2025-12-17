import { z } from 'zod/v4';

export type EnvSchema = {
  variables: z.ZodObject<Record<string, z.ZodTypeAny>>;
  secrets: z.ZodObject<Record<string, z.ZodTypeAny>>;
  databaseConnections: z.ZodObject<Record<string, z.ZodTypeAny>>;
  buckets: z.ZodObject<Record<string, z.ZodTypeAny>>;
  injected: z.ZodObject<Record<string, z.ZodTypeAny>>;
  topics: z.ZodObject<Record<string, z.ZodTypeAny>>;
};

export type InferEnv<T extends EnvSchema> = z.infer<T['variables']> &
  z.infer<T['secrets']> &
  z.infer<T['topics']> &
  z.infer<T['databaseConnections']> &
  z.infer<T['buckets']> &
  z.infer<T['injected']>;

export const createEnv = <T extends EnvSchema>(options: {
  schema: T;
  env: NodeJS.ProcessEnv;
}): InferEnv<T> => {
  const { schema: schemas, env } = options;
  const variablesResult = schemas.variables.safeParse(env);
  const secretsResult = schemas.secrets.safeParse(env);
  const topicsResult = schemas.topics.safeParse(env);
  const injectedResult = schemas.injected.safeParse(env);
  const bucketsResult = schemas.buckets.safeParse(env);

  if (
    !variablesResult.success ||
    !secretsResult.success ||
    !topicsResult.success ||
    !injectedResult.success ||
    !bucketsResult.success
  ) {
    const errors: Record<string, unknown> = {};

    if (!variablesResult.success) {
      errors.variables = z.prettifyError(variablesResult.error);
    }

    if (!secretsResult.success) {
      errors.secrets = z.prettifyError(secretsResult.error);
    }

    if (!topicsResult.success) {
      errors.topics = z.prettifyError(topicsResult.error);
    }

    if (!injectedResult.success) {
      errors.injected = z.prettifyError(injectedResult.error);
    }

    if (!bucketsResult.success) {
      errors.buckets = z.prettifyError(bucketsResult.error);
    }

    // biome-ignore lint/suspicious/noConsole: Don't want to import logger for this
    console.error('ERROR: Invalid environment variables', errors);
    process.exit(1);
  }

  return {
    ...variablesResult.data,
    ...secretsResult.data,
    ...topicsResult.data,
    ...injectedResult.data,
    ...bucketsResult.data,
  } as InferEnv<T>;
};
