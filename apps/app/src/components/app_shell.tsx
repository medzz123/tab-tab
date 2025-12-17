import { ModalsProvider } from '@mantine/modals';
import { Notifications, notifications } from '@mantine/notifications';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import React, { type PropsWithChildren, useState } from 'react';

import { trpc, useTrpc } from '../trpc';

const MantineProviders: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <ModalsProvider>
      <Notifications position="top-right" />
      {children}
    </ModalsProvider>
  );
};

const Providers: React.FC<PropsWithChildren> = ({ children }) => {
  const trpcClient = useTrpc();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onSuccess: () => {
            queryClient.invalidateQueries();
          },
        }),
        defaultOptions: {
          queries: {
            // intentional disabled retries, as it's very rare that a retry ever works in our app.
            // instead retrying the request multiple times just causes a delay in showing the user
            // that the request failed.
            retry: false,
          },
          mutations: {
            onError: (error) => {
              if (error instanceof TRPCClientError) {
                const deniedByPolicy = error.message.includes('denied by policy');

                notifications.show({
                  title: deniedByPolicy ? 'Action Failed' : error.message,
                  message: deniedByPolicy
                    ? 'You do not have permission to perform this action, contact your administrator.'
                    : undefined,
                  autoClose: false,
                  withBorder: true,
                  color: 'red',
                });
              }
            },
          },
        },
      })
  );

  return (
    <React.StrictMode>
      <MantineProviders>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </trpc.Provider>
      </MantineProviders>
    </React.StrictMode>
  );
};

export const AppShell: React.FC<PropsWithChildren> = ({ children }) => {
  return <Providers>{children}</Providers>;
};
