import { Button, Container, Group, Text, Title } from '@mantine/core';

import classes from './error_page.module.css';

type ErrorPageProps = {
  code: 403 | 404 | 500;
  message?: string;
  title?: string;
};

export const ErrorPage: React.FC<ErrorPageProps> = ({ code, message, title }) => {
  const computed = {
    403: {
      title: 'Access Denied',
      message:
        "Sorry, you don't have permission to view this page. If you believe this is an error, please check with your administrator or support team.",
    },
    404: {
      title: 'Page Not Found',
      message:
        "We can't seem to find the page you're looking for. It might have been removed, had its name changed, or is temporarily unavailable. Please check the URL or head back to the home page.",
    },
    500: {
      title: 'Oops! Something Went Wrong',
      message:
        "An unexpected error has occurred on our end. We're working to fix this as quickly as possible. Please try refreshing the page or come back later.",
    },
  }[code];

  return (
    <div className={classes.root}>
      <Container maw={800}>
        <div data-cy="error-code" className={classes.label}>
          {code}
        </div>
        <Title data-cy="error-title" mb="md" className={classes.title}>
          {title || computed.title}
        </Title>
        <Text size="md" ta="center" c="dimmed" mb="md">
          {message || computed.message}, ask help!
        </Text>

        <Group justify="center" wrap="nowrap">
          <Button
            variant="light"
            onClick={() => {
              const url = new URL(window.location.href);
              /**
               * By adding a new query param to our url
               * we force the browser to discard cache, and request
               * a brand new page from the server.
               */
              url.searchParams.set('reloadTime', Date.now().toString());
              window.location.href = url.toString();
            }}
          >
            Reload
          </Button>

          <Button
            variant="light"
            onClick={() => {
              const url = new URL(window.location.origin);
              url.pathname = '/';
              url.searchParams.set('reloadTime', Date.now().toString());
              window.location.href = url.toString();
            }}
          >
            Home
          </Button>
        </Group>
      </Container>
    </div>
  );
};
