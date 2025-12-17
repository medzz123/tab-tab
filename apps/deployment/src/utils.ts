import type * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import type { EnvSchema } from '@template/env/create';
import type z from 'zod/v4';
import { configuration, type Stack } from './configuration';
import type { Database } from './resources/database';

export const formatName = (name: string) => {
  return `${configuration.stack}-${name}`;
};

export type PickEnv<T> = { [K in Stack]: T };

export const env = <T>(dataMap: PickEnv<T>): T => {
  const result = dataMap[configuration.stack];

  return result;
};

export function getServiceImage(serviceName: 'api'): string {
  /**
   * Dry run is used for previews when we haven't built the images yet
   */
  if (pulumi.runtime.isDryRun()) {
    return `europe-west2-docker.pkg.dev/${configuration.gcpProject}/base/placeholder:v1`;
  }

  const config = new pulumi.Config();
  const imageTag = config.require('imageTag');

  return `europe-west2-docker.pkg.dev/${configuration.gcpProject}/base/${serviceName}:${imageTag}`;
}

export type BucketPermission = 'read' | 'create' | 'read-create' | 'admin';

export const bucketPermissionToRoles = (permission: BucketPermission): readonly string[] => {
  switch (permission) {
    case 'read':
      return ['roles/storage.objectViewer'];
    case 'create':
      return ['roles/storage.objectCreator'];
    case 'read-create':
      return ['roles/storage.objectViewer', 'roles/storage.objectCreator'];
    case 'admin':
      return ['roles/storage.objectAdmin'];
  }
};

export type DatabaseAppUser = {
  user: gcp.sql.User;
  databaseUrlSecretId: pulumi.Output<string>;
  databaseUrlSecretVersionName: pulumi.Output<string>;
  databaseUrlSecretVersionNumber: pulumi.Output<string>;
  databaseUrlSecretVersion: gcp.secretmanager.SecretVersion;
};

export type EnvFor<T extends EnvSchema> = {
  variables: { [K in keyof z.input<T['variables']>]: pulumi.Input<z.input<T['variables']>[K]> };
  secrets: { [K in keyof z.input<T['secrets']>]: gcp.secretmanager.Secret };
  buckets: {
    [K in keyof z.input<T['buckets']>]: {
      bucket: gcp.storage.Bucket;
      permission: BucketPermission;
    };
  };
  databaseConnections: {
    [K in keyof z.input<T['databaseConnections']>]: {
      user: DatabaseAppUser;
      database: Database;
    };
  };
  topics: {
    [K in keyof z.input<T['topics']>]: {
      topic: gcp.pubsub.Topic;
    };
  };
};

export type KebabCase = `${Lowercase<string>}-${Lowercase<string>}` | Lowercase<string>;
