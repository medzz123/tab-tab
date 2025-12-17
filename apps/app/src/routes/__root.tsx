import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppShell } from '@/components/app_shell';

const RootLayout = () => (
  <AppShell>
    <Outlet />
  </AppShell>
);

export const Route = createRootRoute({ component: RootLayout });
