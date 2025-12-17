import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';
import * as std from '@pulumi/std';

import { configuration } from '../configuration';
import { type DatabaseAppUser, formatName, type KebabCase } from '../utils';

type AppUserFlags = Record<string, KebabCase>;

type DatabaseUsersArgs<Users extends AppUserFlags> = {
  instance: pulumi.Input<gcp.sql.DatabaseInstance>;
  databaseName: pulumi.Input<string>;
  connectionLimit: pulumi.Input<number>;
  users: Users;
  opts?: pulumi.ComponentResourceOptions;
  name: string;
};

export class DatabaseUsers<Users extends AppUserFlags> extends pulumi.ComponentResource {
  public readonly users: { [K in keyof Users]: DatabaseAppUser } = {} as {
    [K in keyof Users]: DatabaseAppUser;
  };

  constructor(args: DatabaseUsersArgs<Users>) {
    const baseName = formatName(args.name);

    super('base:DatabaseUsers', baseName, args.opts);

    const instance = pulumi.output(args.instance);

    Object.entries(args.users).forEach(([key, value]) => {
      const base = `${baseName}-${value}-database-user`;

      const password = new random.RandomPassword(
        `${base}-password`,
        {
          length: 32,
          special: false,
        },
        { parent: this }
      );

      const sqlUser = new gcp.sql.User(
        base,
        {
          instance: instance.name,
          name: value,
          type: 'BUILT_IN',
          password: password.result,
        },
        { parent: this }
      );

      const secretName = `${base}-database-url`;

      const dbUrlSecret = new gcp.secretmanager.Secret(
        secretName,
        {
          project: configuration.gcpProject,
          secretId: secretName,
          replication: {
            auto: {},
          },
        },
        { parent: this }
      );

      const databaseUrl = pulumi
        .all([
          sqlUser.name,
          password.result,
          instance.connectionName,
          args.databaseName,
          args.connectionLimit,
        ])
        .apply(([username, pass, connectionName, dbName, connectionLimit]) => {
          return `postgresql://${username}:${pass}@/${dbName}?host=/cloudsql/${connectionName}&connection_limit=${connectionLimit}`;
        });

      const dbUrlSecretVersion = new gcp.secretmanager.SecretVersion(
        `${secretName}-version`,
        {
          secret: dbUrlSecret.id,
          isSecretDataBase64: true,
          secretData: databaseUrl.apply((url) =>
            std
              .base64encode({
                input: url,
              })
              .then((invoke) => invoke.result)
          ),
        },
        { parent: this }
      );

      (this.users as any)[key] = {
        user: sqlUser,
        databaseUrlSecretId: dbUrlSecret.secretId,
        databaseUrlSecretVersionName: dbUrlSecretVersion.name,
        databaseUrlSecretVersionNumber: dbUrlSecretVersion.version,
        databaseUrlSecretVersion: dbUrlSecretVersion,
      };
    });

    this.registerOutputs({
      users: this.users,
    });
  }
}
