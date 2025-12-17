import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import React, { type PropsWithChildren } from 'react';

const MantineProviders: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <ModalsProvider>
      <Notifications position="top-right" />
      {children}
    </ModalsProvider>
  );
};

const Providers: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <React.StrictMode>
      <MantineProviders>{children}</MantineProviders>
    </React.StrictMode>
  );
};

export const AppShell: React.FC<PropsWithChildren> = ({ children }) => {
  return <Providers>{children}</Providers>;
};
