import * as gcp from '@pulumi/gcp';
import type * as pulumi from '@pulumi/pulumi';

import { configuration } from '../configuration';
import { env, formatName } from '../utils';

const cors = [
  {
    maxAgeSeconds: 3_600,
    methods: ['GET', 'PUT'],
    origins: env({
      dev: ['http://localhost:7000'],
    }),
    responseHeaders: ['Content-Type'],
  },
];

export const createBucket = (input: {
  name: string;
  args?: Partial<gcp.storage.BucketArgs>;
  opts?: pulumi.CustomResourceOptions;
  /**
   * @default false
   */
  includeCors?: boolean;
}) => {
  const { name, args, opts, includeCors = false } = input;

  const options: gcp.storage.BucketArgs = {
    project: configuration.gcpProject,
    location: configuration.gcpRegion,
    publicAccessPrevention: 'enforced',
    uniformBucketLevelAccess: true,
  };

  if (includeCors) {
    options.cors = cors;
  }

  return new gcp.storage.Bucket(
    formatName(name),
    {
      ...options,
      ...args,
    },
    opts
  );
};
