import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/spotlight/styles.css';
import './global-styles.css';
import './theme/style.css';

import { MantineProvider } from '@mantine/core';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { routeTree } from './routeTree.gen';
import { shadcnCssVariableResolver } from './theme/css_variable_resolver';
import { shadcnTheme } from './theme/theme';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <MantineProvider theme={shadcnTheme} cssVariablesResolver={shadcnCssVariableResolver}>
      <RouterProvider router={router} />
    </MantineProvider>
  </StrictMode>
);
