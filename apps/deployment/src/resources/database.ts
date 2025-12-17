import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';
import * as std from '@pulumi/std';

import { configuration } from '../configuration';
import { formatName, type KebabCase } from '../utils';
import type { Network } from './network';

export type DatabaseArgs = {
  name: string;
  databaseVersion: 'POSTGRES_15' | 'POSTGRES_16' | 'POSTGRES_17' | 'POSTGRES_18';
  availabilityType: 'ZONAL' | 'REGIONAL';
  deletionProtectionEnabled: boolean;
  diskSize: number;
  tier:
    | 'db-f1-micro'
    | 'db-g1-small'
    | 'db-custom-1-3840'
    | 'db-custom-1-7680'
    | 'db-custom-2-3840'
    | 'db-custom-2-7680'
    | 'db-custom-2-8192'
    | 'db-custom-4-15360';

  backupEnabled: boolean;
  insightEnabled: boolean;
  databaseFlags: gcp.types.input.sql.DatabaseInstanceSettingsDatabaseFlag[];

  privateNetwork: Network;
  authorizedNetworks: {
    name: KebabCase;
    value: string;
  }[];

  opts?: pulumi.ComponentResourceOptions;
};

export class Database extends pulumi.ComponentResource {
  public readonly instance: gcp.sql.DatabaseInstance;
  public readonly database: gcp.sql.Database;

  public readonly instanceName: pulumi.Output<string>;
  public readonly databaseName: pulumi.Output<string>;
  public readonly adminUsername: string;

  public readonly adminPassword: random.RandomPassword;
  public readonly adminPasswordSecret: gcp.secretmanager.Secret;
  public readonly adminPasswordSecretVersion: gcp.secretmanager.SecretVersion;

  public readonly migratorPassword: random.RandomPassword;
  public readonly migratorUser: gcp.sql.User;
  public readonly migratorPasswordSecret: gcp.secretmanager.Secret;
  public readonly migratorPasswordSecretVersion: gcp.secretmanager.SecretVersion;

  constructor(args: DatabaseArgs) {
    const name = formatName(args.name);

    super('base:Database', name, args.opts);

    const adminPassword = new random.RandomPassword(
      `${name}-admin-password`,
      {
        length: 32,
        special: false,
      },
      { parent: this }
    );

    const instance = new gcp.sql.DatabaseInstance(
      name,
      {
        name,
        project: configuration.gcpProject,
        region: configuration.gcpRegion,
        databaseVersion: args.databaseVersion,
        rootPassword: adminPassword.result,
        settings: {
          availabilityType: args.availabilityType,
          tier: args.tier,
          diskSize: args.diskSize,
          deletionProtectionEnabled: args.deletionProtectionEnabled,
          backupConfiguration: args.backupEnabled
            ? {
                backupRetentionSettings: {
                  retainedBackups: 7,
                },
              }
            : undefined,
          insightsConfig: args.insightEnabled
            ? {
                queryInsightsEnabled: true,
                queryPlansPerMinute: 5,
                queryStringLength: 4500,
                recordApplicationTags: true,
              }
            : undefined,
          databaseFlags: args.databaseFlags,
          ipConfiguration: {
            sslMode: 'ENCRYPTED_ONLY',
            ipv4Enabled: true,
            privateNetwork: args.privateNetwork.network.id,
            authorizedNetworks: args.authorizedNetworks.map((net) => ({
              name: net.name,
              value: net.value,
              expirationTime: '',
            })),
          },
        },
      },
      { parent: this, dependsOn: [args.privateNetwork.privateServicesConnection] }
    );

    const database = new gcp.sql.Database(
      `${name}-db`,
      {
        name: args.name,
        instance: instance.name,
        project: configuration.gcpProject,
      },
      { parent: this, dependsOn: [instance], protect: true }
    );

    const adminSecretName = `${name}-database-admin-password`;
    const adminPasswordSecret = new gcp.secretmanager.Secret(
      adminSecretName,
      {
        project: configuration.gcpProject,
        secretId: adminSecretName,
        replication: {
          auto: {},
        },
      },
      { parent: this }
    );

    const adminPasswordSecretVersion = new gcp.secretmanager.SecretVersion(
      `${adminSecretName}-version`,
      {
        secret: adminPasswordSecret.id,
        isSecretDataBase64: true,
        secretData: adminPassword.result.apply((value) =>
          std.base64encode({ input: value }).then((invoke) => invoke.result)
        ),
      },
      { parent: this }
    );

    const migratorPassword = new random.RandomPassword(
      `${name}-database-migrator-password`,
      {
        length: 32,
        special: false,
      },
      { parent: this }
    );

    const migratorUser = new gcp.sql.User(
      `${name}-migrator-user`,
      {
        name: 'migrator',
        instance: instance.name,
        password: migratorPassword.result,
        project: configuration.gcpProject,
      },
      { parent: this }
    );

    const migratorSecretName = `${name}-database-migrator`;
    const migratorPasswordSecret = new gcp.secretmanager.Secret(
      migratorSecretName,
      {
        project: configuration.gcpProject,
        secretId: migratorSecretName,
        replication: {
          auto: {},
        },
      },
      { parent: this }
    );

    const migratorPasswordSecretVersion = new gcp.secretmanager.SecretVersion(
      `${migratorSecretName}-version`,
      {
        secret: migratorPasswordSecret.id,
        isSecretDataBase64: true,
        secretData: migratorPassword.result.apply((value) =>
          std.base64encode({ input: value }).then((invoke) => invoke.result)
        ),
      },
      { parent: this }
    );

    this.instance = instance;
    this.database = database;

    this.instanceName = instance.name;
    this.databaseName = database.name;
    this.adminUsername = 'postgres';

    this.adminPassword = adminPassword;
    this.adminPasswordSecret = adminPasswordSecret;
    this.adminPasswordSecretVersion = adminPasswordSecretVersion;

    this.migratorPassword = migratorPassword;
    this.migratorUser = migratorUser;
    this.migratorPasswordSecret = migratorPasswordSecret;
    this.migratorPasswordSecretVersion = migratorPasswordSecretVersion;

    this.registerOutputs({
      instance: this.instance,
      database: this.database,
      instanceName: this.instanceName,
      databaseName: this.databaseName,
      adminUsername: this.adminUsername,
      adminPasswordSecretId: this.adminPasswordSecret.id,
      adminPasswordSecretVersionName: this.adminPasswordSecretVersion.name,
      migratorUserName: this.migratorUser.name,
      migratorPasswordSecretId: this.migratorPasswordSecret.id,
      migratorPasswordSecretVersionName: this.migratorPasswordSecretVersion.name,
    });
  }
}
