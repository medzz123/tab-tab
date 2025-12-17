import * as gcp from '@pulumi/gcp';
import type * as pulumi from '@pulumi/pulumi';
import * as std from '@pulumi/std';
import { configuration } from '../configuration';
import { formatName, type KebabCase } from '../utils';

type SecretDefinition = {
  name: KebabCase;
  defaultValue: string;
};

type SecretsInput = Record<string, SecretDefinition>;

type SecretsFrom<T extends SecretsInput> = {
  [K in keyof T]: gcp.secretmanager.Secret;
};

export const defineSecrets = <T extends SecretsInput>(input: {
  secrets: T;
  opts?: pulumi.CustomResourceOptions;
}): SecretsFrom<T> => {
  const out = {} as SecretsFrom<T>;

  (Object.entries(input.secrets) as [keyof T, T[keyof T]][]).forEach(([key, def]) => {
    const secretId = formatName(def.name);

    const secret = new gcp.secretmanager.Secret(
      secretId,
      {
        project: configuration.gcpProject,
        secretId,
        replication: { auto: {} },
      },
      input.opts
    );

    const placeholder = def.defaultValue;

    new gcp.secretmanager.SecretVersion(
      `${secretId}-placeholder-version`,
      {
        secret: secret.id,
        isSecretDataBase64: true,
        secretData: std.base64encode({ input: placeholder }).then((v) => v.result),
      },
      { parent: secret, dependsOn: [secret] }
    );

    out[key] = secret;
  });

  return out;
};
