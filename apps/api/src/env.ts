import { apiEnvSchema } from '@template/env/api';
import { createEnv } from '@template/env/create';

export const env = createEnv({
  schema: apiEnvSchema,
  env: process.env,
});
