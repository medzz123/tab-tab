import { apiEnvSchema } from '@tab-tab/env/api';
import { createEnv } from '@tab-tab/env/create';

export const env = createEnv({
  schema: apiEnvSchema,
  env: process.env,
});
