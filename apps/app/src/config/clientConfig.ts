// biome-ignore-all lint/suspicious/noExplicitAny: need to type window
/**
 * DO NOT PUT SECRETS IN HERE.
 * These are UI configuration properties
 */

type Config = {
  trpcUrl: string;
  appAppUrl: string;
  stage: 'local' | 'dev' | 'prod' | 'staging' | string;
};

// cspell:disable
const localConfig: Config = {
  trpcUrl: 'http://localhost:7005/trpc',
  appAppUrl: 'http://localhost:7000',
  stage: 'local',
};
// cspell:enable

(window as any).x_client_config = (window as any).x_client_config ?? localConfig;
export const clientConfig = (window as any).x_client_config as Config;
