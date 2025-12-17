import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

import { configuration } from '../configuration';
import { formatName } from '../utils';

const projectInfo = gcp.organizations.getProject({
  projectId: configuration.gcpProject,
});

export class PubSub extends pulumi.ComponentResource {
  public readonly topic: gcp.pubsub.Topic;
  public readonly subscription: gcp.pubsub.Subscription;
  public readonly archiveSubscription: gcp.pubsub.Subscription;
  public readonly dlqTopic: gcp.pubsub.Topic;
  public readonly dlqSubscription: gcp.pubsub.Subscription;

  constructor(input: {
    name: string;
    endpoint: pulumi.Input<string>;
    serviceAccountEmail: pulumi.Input<string>;
    serviceAccountId: pulumi.Input<string>;
    cloudRunServiceName: pulumi.Input<string>;
    bucket: gcp.storage.Bucket;
    maxDeliveryAttempts?: number;
    ackDeadlineSeconds?: number;
    opts?: pulumi.ComponentResourceOptions;
  }) {
    const name = formatName(input.name);

    super('base:PubSub', name, input.opts);

    const topic = new gcp.pubsub.Topic(
      name,
      {
        name,
        project: configuration.gcpProject,
      },
      { parent: this }
    );

    const dlqName = `${name}-dlq`;
    const dlqTopic = new gcp.pubsub.Topic(
      dlqName,
      {
        name: dlqName,
        project: configuration.gcpProject,
      },
      { parent: this }
    );

    const subscription = new gcp.pubsub.Subscription(
      name,
      {
        project: configuration.gcpProject,
        name,
        topic: topic.name,
        ackDeadlineSeconds: input.ackDeadlineSeconds ?? 50,
        expirationPolicy: { ttl: '' },
        pushConfig: {
          pushEndpoint: input.endpoint,
          oidcToken: {
            serviceAccountEmail: input.serviceAccountEmail,
          },
        },
        retryPolicy: {
          minimumBackoff: '10s',
          maximumBackoff: '600s',
        },
        deadLetterPolicy: {
          deadLetterTopic: dlqTopic.id,
          maxDeliveryAttempts: input.maxDeliveryAttempts ?? 5,
        },
      },
      { parent: this }
    );

    const archiveSubscription = new gcp.pubsub.Subscription(
      `${name}-archive`,
      {
        project: configuration.gcpProject,
        name: `${name}-archive`,
        topic: topic.name,
        ackDeadlineSeconds: 300,
        expirationPolicy: { ttl: '' },
        cloudStorageConfig: {
          bucket: input.bucket.name,
          filenamePrefix: `${name}/ingress/`,
        },
      },
      { parent: this }
    );

    const dlqSubscription = new gcp.pubsub.Subscription(
      dlqName,
      {
        project: configuration.gcpProject,
        name: dlqName,
        topic: dlqTopic.id,
        ackDeadlineSeconds: 300,
        expirationPolicy: { ttl: '' },
        cloudStorageConfig: {
          bucket: input.bucket.name,
          filenamePrefix: `${name}/dlq/`,
        },
      },
      { parent: this }
    );

    const pubsubServiceAccount = projectInfo.then(
      (p) => `serviceAccount:service-${p.number}@gcp-sa-pubsub.iam.gserviceaccount.com`
    );

    const bucketObjectAdmin = new gcp.storage.BucketIAMMember(
      `${name}-bucket-object-admin`,
      {
        bucket: input.bucket.name,
        role: 'roles/storage.objectAdmin',
        member: pubsubServiceAccount,
      },
      {
        parent: this,
        dependsOn: [input.bucket],
      }
    );

    const bucketLegacyReader = new gcp.storage.BucketIAMMember(
      `${name}-bucket-legacy-reader`,
      {
        bucket: input.bucket.name,
        role: 'roles/storage.legacyBucketReader',
        member: pubsubServiceAccount,
      },
      {
        parent: this,
        dependsOn: [input.bucket],
      }
    );

    const bucketObjectCreator = new gcp.storage.BucketIAMMember(
      `${name}-bucket-object-creator`,
      {
        bucket: input.bucket.name,
        role: 'roles/storage.objectCreator',
        member: pubsubServiceAccount,
      },
      {
        parent: this,
        dependsOn: [input.bucket],
      }
    );

    const dlqPublisher = new gcp.pubsub.TopicIAMMember(
      `${name}-dlq-publisher`,
      {
        project: configuration.gcpProject,
        topic: dlqTopic.name,
        role: 'roles/pubsub.publisher',
        member: pubsubServiceAccount,
      },
      {
        parent: this,
        dependsOn: [dlqTopic],
      }
    );

    const subscriberBinding = new gcp.pubsub.SubscriptionIAMBinding(
      `${name}-subscriber-binding`,
      {
        project: configuration.gcpProject,
        subscription: subscription.name,
        role: 'roles/pubsub.subscriber',
        members: projectInfo.then((p) => [
          `serviceAccount:service-${p.number}@gcp-sa-pubsub.iam.gserviceaccount.com`,
        ]),
      },
      {
        parent: this,
        dependsOn: [subscription],
      }
    );

    const runInvoker = new gcp.cloudrunv2.ServiceIamMember(
      `${name}-run-invoker`,
      {
        name: input.cloudRunServiceName,
        location: configuration.gcpRegion,
        project: configuration.gcpProject,
        role: 'roles/run.invoker',
        member: pulumi.interpolate`serviceAccount:${input.serviceAccountEmail}`,
      },
      {
        parent: this,
        dependsOn: [subscription],
      }
    );

    const tokenCreator = new gcp.serviceaccount.IAMMember(
      `${name}-token-creator`,
      {
        serviceAccountId: input.serviceAccountId,
        role: 'roles/iam.serviceAccountTokenCreator',
        member: pubsubServiceAccount,
      },
      {
        parent: this,
        dependsOn: [
          bucketObjectAdmin,
          bucketLegacyReader,
          bucketObjectCreator,
          dlqPublisher,
          subscriberBinding,
          runInvoker,
        ],
      }
    );

    this.topic = topic;
    this.subscription = subscription;
    this.archiveSubscription = archiveSubscription;
    this.dlqTopic = dlqTopic;
    this.dlqSubscription = dlqSubscription;

    this.registerOutputs({
      topic: this.topic,
      subscription: this.subscription,
      archiveSubscription: this.archiveSubscription,
      dlqTopic: this.dlqTopic,
      dlqSubscription: this.dlqSubscription,
      bucketIam: {
        bucketObjectAdmin,
        bucketLegacyReader,
        bucketObjectCreator,
      },
      pubsubIam: {
        dlqPublisher,
        subscriberBinding,
        runInvoker,
        tokenCreator,
      },
    });
  }
}
