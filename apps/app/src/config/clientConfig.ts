// biome-ignore-all lint/suspicious/noExplicitAny: need to type window
/**
 * DO NOT PUT SECRETS IN HERE.
 * These are UI configuration properties
 */

type Config = {
  apiUrl: string;
  wsUrl: string;
  appAppUrl: string;
  stage: 'local' | 'dev' | 'prod' | 'staging' | string;
};

// cspell:disable
const localConfig: Config = {
  apiUrl: 'http://localhost:7001',
  wsUrl: 'ws://localhost:7001/collaboration',
  appAppUrl: 'http://localhost:7000',
  stage: 'local',
};
// cspell:enable

(window as any).x_client_config = (window as any).x_client_config ?? localConfig;
export const clientConfig = (window as any).x_client_config as Config;
