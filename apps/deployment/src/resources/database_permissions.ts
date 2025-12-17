import * as postgresql from '@pulumi/postgresql';
import * as pulumi from '@pulumi/pulumi';
import { type DatabaseAppUser, formatName } from '../utils';
import type { Database } from './database';

type PermissionsArgs = {
  name: string;
  database: Database;
  appUsers: Record<
    string,
    {
      user: DatabaseAppUser;
      privileges: ('SELECT' | 'INSERT' | 'UPDATE' | 'DELETE')[];
    }
  >;
  opts?: pulumi.ComponentResourceOptions;
};

export class DatabasePermissions extends pulumi.ComponentResource {
  constructor(args: PermissionsArgs) {
    const name = formatName(args.name);
    super('base:DatabasePermissions', name, args.opts);

    const postgresProvider = new postgresql.Provider(
      name,
      {
        host: args.database.instance.ipAddresses.apply((address) => {
          const publicAddress = (address ?? []).find((address) => address.type === 'PRIMARY');
          if (!publicAddress) throw new Error('no PUBLIC ip');
          return publicAddress.ipAddress;
        }),
        port: 5432,
        username: args.database.migratorUser.name,
        password: args.database.migratorPassword.result,
        database: args.database.databaseName,
        superuser: false,
        sslmode: 'require',
      },
      { parent: this }
    );

    const schemaGrant = new postgresql.Grant(
      `${name}-migrator-schema`,
      {
        database: args.database.databaseName,
        role: args.database.migratorUser.name,
        schema: 'public',
        objectType: 'schema',
        privileges: ['CREATE', 'USAGE'],
      },
      { parent: this, provider: postgresProvider }
    );

    new postgresql.Grant(
      `${name}-migrator-tables`,
      {
        database: args.database.databaseName,
        role: args.database.migratorUser.name,
        schema: 'public',
        objectType: 'table',
        privileges: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'],
      },
      { parent: this, provider: postgresProvider }
    );

    Object.entries(args.appUsers).forEach(([key, dbUser]) => {
      new postgresql.DefaultPrivileges(
        `${name}-${key}-rw`,
        {
          database: args.database.databaseName,
          role: dbUser.user.user.name,
          schema: 'public',
          owner: args.database.migratorUser.name,
          objectType: 'table',
          privileges: dbUser.privileges,
        },
        { parent: this, provider: postgresProvider }
      );

      if (dbUser.privileges.includes('INSERT')) {
        new postgresql.DefaultPrivileges(
          `${name}-${key}-seq`,
          {
            database: args.database.databaseName,
            role: dbUser.user.user.name,
            schema: 'public',
            owner: args.database.migratorUser.name,
            objectType: 'sequence',
            privileges: ['USAGE', 'UPDATE'],
          },
          { parent: this, provider: postgresProvider }
        );
      }

      new postgresql.Grant(
        `${name}-${key}-tables-existing`,
        {
          database: args.database.databaseName,
          role: dbUser.user.user.name,
          schema: 'public',
          objectType: 'table',
          privileges: dbUser.privileges,
        },
        { parent: this, provider: postgresProvider, dependsOn: [schemaGrant] }
      );

      if (dbUser.privileges.includes('INSERT')) {
        new postgresql.Grant(
          `${name}-${key}-seq-existing`,
          {
            database: args.database.databaseName,
            role: dbUser.user.user.name,
            schema: 'public',
            objectType: 'sequence',
            privileges: ['USAGE', 'UPDATE'],
          },
          { parent: this, provider: postgresProvider }
        );
      }

      new postgresql.Grant(
        `${name}-${key}-usage`,
        {
          database: args.database.databaseName,
          role: dbUser.user.user.name,
          schema: 'public',
          objectType: 'schema',
          privileges: ['USAGE'],
        },
        { parent: this, provider: postgresProvider, dependsOn: [schemaGrant] }
      );
    });
  }
}
