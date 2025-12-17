import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { useState } from 'react';

/**
 * We import the generated type from dist instead of the source.
 * This avoids pnpm + workspace resolution overhead and keeps TS from trying to infer the entire dependency graph.
 * It makes type-checking faster.
 * Vite ignores this at runtime since it's a type-only import, so the build still works.
 */
import type { Router } from '../../../packages/api-routes/dist/router';

import { clientConfig } from './config';

export type MainAPI = inferRouterOutputs<Router>;

export const trpc = createTRPCReact<Router>({});

export const useTrpc = () => {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) => opts.direction === 'down' && opts.result instanceof Error,
        }),

        httpBatchLink({
          url: clientConfig.trpcUrl,
        }),
      ],
    })
  );
  return trpcClient;
};
