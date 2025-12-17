import pino from 'pino';
import { getLoggerTraceId } from './loggerStore';

const env = process.env.ENVIRONMENT;
const isLocal = env === 'local';

export const log = pino({
  level: 'info',
  serializers: {
    err: pino.stdSerializers.err,
  },
  transport: isLocal
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level(label) {
      return { level: label.toUpperCase() };
    },
  },
  mixin() {
    const traceId = getLoggerTraceId();
    return traceId ? { traceId } : {};
  },
});
