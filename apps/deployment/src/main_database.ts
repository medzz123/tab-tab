import { network } from './networking';
import { Database } from './resources/database';
import { DatabasePermissions } from './resources/database_permissions';
import { DatabaseUsers } from './resources/database_users';
import { env } from './utils';

const MAIN_DB_NAME = 'main';

export const mainDatabase = new Database({
  name: MAIN_DB_NAME,
  databaseVersion: 'POSTGRES_15',

  availabilityType: env({ dev: 'ZONAL' }),

  deletionProtectionEnabled: true,

  diskSize: env({ dev: 10 }),

  tier: 'db-f1-micro',

  backupEnabled: true,

  insightEnabled: true,

  privateNetwork: network,

  authorizedNetworks: env({
    dev: [{ name: 'all', value: '0.0.0.0/0', expirationTime: '' }],
  } as const),

  databaseFlags: [
    {
      name: 'log_connections',
      value: 'on',
    },
    {
      name: 'log_disconnections',
      value: 'on',
    },
    {
      name: 'log_min_duration_statement',
      value: '500',
    },
    {
      name: 'log_lock_waits',
      value: 'on',
    },
    {
      name: 'deadlock_timeout',
      value: '1000',
    },
    {
      name: 'log_temp_files',
      value: '1000',
    },
    {
      name: 'log_timezone',
      value: 'UTC',
    },
    {
      name: 'log_statement',
      value: 'ddl',
    },
  ],

  opts: {
    protect: true,
    dependsOn: [network.privateServicesConnection],
  },
});

export const mainDatabaseUsers = new DatabaseUsers({
  name: MAIN_DB_NAME,
  instance: mainDatabase.instance,
  databaseName: mainDatabase.databaseName,
  connectionLimit: 20,
  users: {
    apiService: 'api',
    eventsApi: 'events-api',
    cronRunner: 'cron-runner',
    servicerReport: 'servicer-report',
  },
});

export const mainDatabasePermissions = new DatabasePermissions({
  name: 'main-permissions',
  database: mainDatabase,
  appUsers: {
    apiService: {
      user: mainDatabaseUsers.users.apiService,
      privileges: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    },
  },
  opts: {
    dependsOn: [mainDatabaseUsers],
  },
});
