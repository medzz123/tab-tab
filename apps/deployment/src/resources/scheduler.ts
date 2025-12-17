import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

import { configuration } from '../configuration';
import { formatName } from '../utils';

type SchedulerArgs = {
  name: string;
  cron: pulumi.Input<string>;
  triggerUri: pulumi.Input<string>;
  serviceAccountEmail: pulumi.Input<string>;
  body?: pulumi.Input<Record<string, unknown>>;
  timezone?: pulumi.Input<string>;
  opts?: pulumi.ComponentResourceOptions;
};

export class Scheduler extends pulumi.ComponentResource {
  public readonly job: gcp.cloudscheduler.Job;

  constructor(args: SchedulerArgs) {
    const name = formatName(args.name);

    super('base:Scheduler', name, args.opts);

    const encodedBody = args.body
      ? pulumi.output(args.body).apply((b) => Buffer.from(JSON.stringify(b)).toString('base64'))
      : undefined;

    const job = new gcp.cloudscheduler.Job(
      name,
      {
        name,
        project: configuration.gcpProject,
        region: configuration.gcpRegion,
        schedule: args.cron,
        timeZone: args.timezone,
        httpTarget: {
          uri: args.triggerUri,
          httpMethod: 'POST',
          body: encodedBody,
          headers: {
            'Content-Type': 'application/json',
          },
          oauthToken: {
            serviceAccountEmail: args.serviceAccountEmail,
            scope: 'https://www.googleapis.com/auth/cloud-platform',
          },
        },
        retryConfig: {
          maxBackoffDuration: '3600s',
          maxDoublings: 5,
          maxRetryDuration: '0s',
          minBackoffDuration: '5s',
        },
      },
      {
        parent: this,
      }
    );

    this.job = job;

    this.registerOutputs({
      job: this.job,
    });
  }
}
