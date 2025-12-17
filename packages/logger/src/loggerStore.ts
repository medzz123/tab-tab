import { AsyncLocalStorage } from 'node:async_hooks';

export const storage = new AsyncLocalStorage<Map<string, string>>();

export const getLoggerTraceId = () => storage.getStore()?.get('traceId');
