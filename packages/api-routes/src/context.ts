import type { PrismaClient } from '@template/db';
import type { ApiEnvSchema } from '@template/env/api';
import { initTRPC, type TRPCError } from '@trpc/server';
import type * as trpcExpress from '@trpc/server/adapters/express';
import { ZodError, z } from 'zod/v4';

type CreateContextOptions = {
  trpcOptions: trpcExpress.CreateExpressContextOptions;
  context: {
    env: ApiEnvSchema;
    db: PrismaClient;
  };
};

export const createContext = (options: CreateContextOptions) => {
  const { trpcOptions, context } = options;

  const userAgent = trpcOptions.req.headers['user-agent'];

  return {
    headers: trpcOptions.req.headers,
    userAgent,
    context,
  };
};

type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.context<Context>().create({
  errorFormatter(opts) {
    const { shape, error } = opts;

    const isInputValidationError = error.code === 'BAD_REQUEST' && error.cause instanceof ZodError;

    const getErrorMessage = (error: TRPCError) => {
      const isInputValidationError =
        error.code === 'BAD_REQUEST' && error.cause instanceof ZodError;

      if (!isInputValidationError) {
        return error.message;
      }

      return z.prettifyError(error.cause);
    };

    const message = getErrorMessage(error);

    return {
      ...shape,
      message,
      data: {
        ...shape.data,
        inputValidationError: isInputValidationError ? error.cause.flatten() : null,
      },
    };
  },
});

export const contextMiddleware = t.middleware(async ({ ctx, next, path, type, getRawInput }) => {
  const requestStartTime = process.hrtime();
  const rawInput = await getRawInput();

  const xForwardedFor = ctx.headers['x-forwarded-for']
    ? String(ctx.headers['x-forwarded-for'])
    : undefined;
  const cfConnectingIp = ctx.headers['cf-connecting-ip']
    ? String(ctx.headers['cf-connecting-ip'])
    : undefined;

  const requestIpAddress = cfConnectingIp || xForwardedFor;

  const router = path.split('.')[0];

  const result = await next({ ctx });

  const [durationSeconds, durationNanoseconds] = process.hrtime(requestStartTime);

  // biome-ignore lint/suspicious/noConsole: <Will use logger later>
  console.log({ requestIpAddress, router, durationNanoseconds, durationSeconds, rawInput, type });

  return result;
});
