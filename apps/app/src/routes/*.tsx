import { createFileRoute } from '@tanstack/react-router';
import { ErrorPage } from '@/components/ErrorPage';

export const Route = createFileRoute('/*')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ErrorPage code={404} />;
}
