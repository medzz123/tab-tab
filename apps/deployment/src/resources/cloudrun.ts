import * as gcp from '@pulumi/gcp';
import type { ServiceArgs } from '@pulumi/gcp/cloudrunv2';
import * as pulumi from '@pulumi/pulumi';
import type { EnvSchema } from '@template/env/create';

import { configuration } from '../configuration';
import { bucketPermissionToRoles, type EnvFor, formatName } from '../utils';
import type { Network } from './network';

export class CloudRun<T extends EnvSchema | null> extends pulumi.ComponentResource {
  public readonly cloudrun: gcp.cloudrunv2.Service;
  public readonly serviceAccount: gcp.serviceaccount.Account;
  public readonly serviceAccountEmail: pulumi.Output<string>;
  public readonly url: pulumi.Output<string>;
  public readonly domainMapping?: gcp.cloudrun.DomainMapping;

  constructor(input: {
    name: string;
    image: string;
    schema: T;
    env: T extends EnvSchema ? EnvFor<T> : null;
    resources: {
      cpu: '1000m' | '2000m' | '4000m' | '6000m' | '8000m';
      memory: '256Mi' | '512Mi' | '1Gi' | '2Gi' | '4Gi' | '8Gi' | '16Gi' | '32Gi';
    };
    maxInstanceRequestConcurrency?: number;
    timeout?: string;
    scaling?: { min?: number; max?: number };
    startArguments?: pulumi.Input<pulumi.Input<string>[]>;
    schedulerAdmin?: boolean;
    vpc: {
      network: Network;
      egressSettings: pulumi.Input<'ALL_TRAFFIC' | 'PRIVATE_RANGES_ONLY'>;
    } | null;

    opts?: pulumi.ComponentResourceOptions;

    startupProbe?: {
      initialDelaySeconds: number;
      timeoutSeconds: number;
      periodSeconds: number;
      failureThreshold: number;
      tcpSocket: {
        port: number;
      };
    };

    allowUnauthenticated?: boolean;

    customDomain?: string;
  }) {
    const name = formatName(input.name);
    super('base:CloudRun', name, input.opts);

    const serviceAccount = new gcp.serviceaccount.Account(
      name,
      {
        accountId: name,
        displayName: `${name} service account`,
        project: configuration.gcpProject,
      },
      { parent: this }
    );

    const secretAccessor = new gcp.projects.IAMMember(
      `${name}-secretmanager.secretAccessor`,
      {
        project: configuration.gcpProject,
        role: 'roles/secretmanager.secretAccessor',
        member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
      },
      { dependsOn: [serviceAccount], parent: this }
    );

    const cloudSqlClient = new gcp.projects.IAMMember(
      `${name}-cloudsql.client`,
      {
        project: configuration.gcpProject,
        role: 'roles/cloudsql.client',
        member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
      },
      { dependsOn: [serviceAccount], parent: this }
    );

    const bucketIamMembers: gcp.storage.BucketIAMMember[] = [];

    if (input.env) {
      Object.entries(input.env.buckets).forEach(([bucketKey, bucketConfig]) => {
        const roles = bucketPermissionToRoles(bucketConfig.permission);
        roles.forEach((role) => {
          const iamMember = new gcp.storage.BucketIAMMember(
            `${name}-${bucketKey}-${role.split('/').pop() ?? 'role'}`,
            {
              bucket: bucketConfig.bucket.name,
              role,
              member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
            },
            { parent: this, dependsOn: [serviceAccount] }
          );
          bucketIamMembers.push(iamMember);
        });
      });
    }

    const resolvedVariables = input.env
      ? Object.entries(input.env.variables).map(([key, value]) => ({
          name: key,
          value: value as string,
        }))
      : [];

    const resolvedBuckets = input.env
      ? Object.entries(input.env.buckets).map(([key, value]) => ({
          name: key,
          value: value.bucket.name,
        }))
      : [];

    const resolvedTopics = input.env
      ? Object.entries(input.env.topics).map(([key, value]) => ({
          name: key,
          value: value.topic.name,
        }))
      : [];

    const resolvedSecrets = input.env
      ? Object.entries(input.env.secrets).map(([key, secret]) => ({
          name: key,
          valueSource: {
            secretKeyRef: {
              secret: secret.secretId,
              version: 'latest',
            },
          },
        }))
      : [];

    const resolvedDatabases = input.env
      ? Object.entries(input.env.databaseConnections).map(([key, dbUser]) => ({
          name: key,
          valueSource: {
            secretKeyRef: {
              secret: dbUser.user.databaseUrlSecretId,
              version: 'latest',
            },
          },
        }))
      : [];

    const containerEnv: gcp.types.input.cloudrunv2.ServiceTemplateContainerEnv[] = [
      { name: 'NODE_ENV', value: 'production' },
      ...resolvedVariables,
      ...resolvedSecrets,
      ...resolvedDatabases,
      ...resolvedBuckets,
      ...resolvedTopics,
    ];

    const volumeMounts: gcp.types.input.cloudrunv2.ServiceTemplateContainerVolumeMount[] =
      input.env?.databaseConnections && Object.values(input.env.databaseConnections).length > 0
        ? [
            {
              name: 'cloudsql',
              mountPath: '/cloudsql',
            },
          ]
        : [];

    const container: gcp.types.input.cloudrunv2.ServiceTemplateContainer = {
      image: input.image,
      resources: {
        limits: {
          cpu: input.resources.cpu,
          memory: input.resources.memory,
        },
      },
      envs: containerEnv,
      args: input.startArguments,
      startupProbe: input.startupProbe,
      volumeMounts: volumeMounts.length > 0 ? volumeMounts : undefined,
    };

    const volumes: gcp.types.input.cloudrunv2.ServiceTemplateVolume[] =
      input.env?.databaseConnections && Object.values(input.env.databaseConnections).length > 0
        ? [
            {
              name: 'cloudsql',
              cloudSqlInstance: {
                instances: Object.values(input.env.databaseConnections).map(
                  (db) => db.database.instance.connectionName
                ),
              },
            },
          ]
        : [];

    const template: ServiceArgs['template'] = {
      serviceAccount: serviceAccount.email,
      maxInstanceRequestConcurrency: input.maxInstanceRequestConcurrency
        ? input.maxInstanceRequestConcurrency
        : 20,
      timeout: input.timeout ? input.timeout : '300s',
      scaling: {
        minInstanceCount: input.scaling?.min ? input.scaling.min : 0,
        maxInstanceCount: input.scaling?.max ? input.scaling.max : 5,
      },
      containers: [container],
      volumes: volumes.length > 0 ? volumes : undefined,
      vpcAccess: input.vpc
        ? {
            connector: input.vpc.network.connector.id,
            egress: input.vpc.egressSettings,
          }
        : undefined,
    };

    const dbSecretVersions = input.env
      ? Object.values(input.env.databaseConnections).map(
          (dbUser) => dbUser.user.databaseUrlSecretVersion
        )
      : [];

    const tokenCreator = new gcp.serviceaccount.IAMMember(
      `${name}-token-creator`,
      {
        serviceAccountId: serviceAccount.name,
        role: 'roles/iam.serviceAccountTokenCreator',
        member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
      },
      { parent: this, dependsOn: [serviceAccount] }
    );

    const dependsOn: pulumi.Input<pulumi.Resource>[] = [
      serviceAccount,
      secretAccessor,
      cloudSqlClient,
      tokenCreator,
      ...bucketIamMembers,
      ...dbSecretVersions,
    ];

    if (input.schedulerAdmin) {
      dependsOn.push(
        new gcp.projects.IAMMember(
          `${name}-cloudscheduler.admin`,
          {
            project: configuration.gcpProject,
            role: 'roles/cloudscheduler.admin',
            member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
          },
          { parent: this, dependsOn: [serviceAccount] }
        )
      );
    }

    if (input.env && Object.entries(input.env.topics).length > 0) {
      Object.entries(input.env.topics).forEach(([key, value]) => {
        const topic = value.topic;

        const publisher = new gcp.pubsub.TopicIAMMember(
          `${name}-${key}-pubsub.publisher`,
          {
            project: configuration.gcpProject,
            topic: topic.name,
            role: 'roles/pubsub.publisher',
            member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
          },
          { parent: this, dependsOn: [serviceAccount, topic] }
        );
        dependsOn.push(publisher);

        const viewer = new gcp.pubsub.TopicIAMMember(
          `${name}-${key}-pubsub.viewer`,
          {
            project: configuration.gcpProject,
            topic: topic.name,
            role: 'roles/pubsub.viewer',
            member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
          },
          { parent: this, dependsOn: [serviceAccount, topic] }
        );
        dependsOn.push(viewer);
      });
    }

    const cloudrun = new gcp.cloudrunv2.Service(
      name,
      {
        location: configuration.gcpRegion,
        template,
        name,
      },
      {
        dependsOn,
        parent: this,
      }
    );

    if (input.allowUnauthenticated) {
      new gcp.cloudrunv2.ServiceIamMember(
        `${name}-public-invoker`,
        {
          project: cloudrun.project,
          location: cloudrun.location,
          name: cloudrun.name,
          role: 'roles/run.invoker',
          member: 'allUsers',
        },
        { parent: this, dependsOn: [cloudrun] }
      );
    }

    if (input.customDomain) {
      this.domainMapping = new gcp.cloudrun.DomainMapping(
        `${name}-domain-mapping`,
        {
          location: configuration.gcpRegion,
          name: input.customDomain,
          metadata: { namespace: configuration.gcpProject },
          spec: {
            routeName: cloudrun.name,
          },
        },
        { parent: this, dependsOn: [cloudrun] }
      );
    }

    this.cloudrun = cloudrun;
    this.serviceAccount = serviceAccount;
    this.serviceAccountEmail = serviceAccount.email;
    this.url = cloudrun.uri;

    this.registerOutputs({
      cloudrun: this.cloudrun,
      serviceAccount,
      serviceAccountEmail: this.serviceAccountEmail,
      url: this.url,
      domainMapping: this.domainMapping,
    });
  }
}
