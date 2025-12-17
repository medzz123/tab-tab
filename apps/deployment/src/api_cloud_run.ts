import { apiEnvSchema } from '@template/env/api';

import { environment } from './configuration';
import { mainDatabase, mainDatabaseUsers } from './main_database';
import { network } from './networking';
import { CloudRun } from './resources/cloudrun';
import { secrets } from './secrets';
import { env, getServiceImage } from './utils';

export const apiService = new CloudRun({
  name: 'api',
  image: getServiceImage('api'),
  resources: {
    cpu: env({ dev: '1000m' }),
    memory: env({ dev: '512Mi' }),
  },
  scaling: {
    min: env({ dev: 0 }),
    max: 1,
  },
  vpc: {
    network,
    egressSettings: 'ALL_TRAFFIC',
  },
  allowUnauthenticated: true,
  schema: apiEnvSchema,
  schedulerAdmin: true,
  env: {
    buckets: {},
    variables: {
      ENVIRONMENT: environment.ENVIRONMENT,
    },
    secrets: {
      GEMINI_API_KEY: secrets.GEMINI_API_KET,
    },
    databaseConnections: {
      DATABASE_URL: { user: mainDatabaseUsers.users.apiService, database: mainDatabase },
    },
    topics: {},
  },
});
