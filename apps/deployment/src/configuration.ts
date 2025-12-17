import * as pulumi from '@pulumi/pulumi';
import { z } from 'zod/v4';

const stackName = pulumi.getStack();
const rootConfig = new pulumi.Config();
const gcpConfig = new pulumi.Config('gcp');

export const stackSchema = z.enum(['dev']);

export type Stack = z.infer<typeof stackSchema>;

const configurationSchema = z.object({
  stack: stackSchema,
  gcpProject: z.string().min(1),
  gcpProjectNumber: z.string().min(1),
  gcpRegion: z.string().min(1),
  imageTag: z.string().min(1),
});

const configurationResult = configurationSchema.safeParse({
  stack: stackName,
  gcpProject: gcpConfig.require('project'),
  gcpProjectNumber: rootConfig.require('projectNumber'),
  gcpRegion: gcpConfig.require('region'),
  imageTag: rootConfig.require('imageTag'),
});

if (!configurationResult.success) {
  throw new Error(`Invalid deployment config: ${z.prettifyError(configurationResult.error)}`);
}

export const sharedEnvironmentSchema = z.object({
  ENVIRONMENT: z.enum(['development', 'local']),
  CORS_ORIGIN: z.string(),
  APP_URL: z.string(),
  APP_API_URL: z.string(),
});

const baseConfig = new pulumi.Config('base');

const shape = sharedEnvironmentSchema.shape;

const loaded: Record<string, string | undefined> = {};

for (const key of Object.keys(shape)) {
  loaded[key] = baseConfig.get(key);
}

const environmentResult = sharedEnvironmentSchema.safeParse(loaded);

if (!environmentResult.success) {
  throw new Error(`Invalid config: ${z.prettifyError(environmentResult.error)}`);
}

export const environment = environmentResult.data;

export const configuration = configurationResult.data;
