import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { storage } from './loggerStore';

export const loggerContextMiddleware: RequestHandler = (_req, _res, next) => {
  const traceId = randomUUID();
  const store = new Map<string, string>([['traceId', traceId]]);
  storage.run(store, next);
};
