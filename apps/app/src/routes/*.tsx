import { createFileRoute } from '@tanstack/react-router';
import { ErrorPage } from '@/components/error_page';

export const Route = createFileRoute('/*')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ErrorPage code={404} />;
}
