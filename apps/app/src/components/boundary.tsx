import { Button, Flex, Loader, Text } from '@mantine/core';
import { TRPCClientError } from '@trpc/client';
import type React from 'react';
import { Component, Suspense } from 'react';

type BoundaryOptions = {
  error?: (message?: string) => React.ReactNode;
  loader?: React.ReactNode;
};

type ErrorBoundaryProps = {
  children: React.ReactNode;
  errorComponent?: (message?: string) => React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: { message: string } | null;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    let message = 'Unknown error';
    if (error instanceof TRPCClientError) {
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    return {
      hasError: true,
      error: { message },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // Ignore, its just so it works
  }

  render() {
    if (this.state.hasError) {
      if (this.props.errorComponent) {
        return this.props.errorComponent(this.state.error?.message);
      }

      return (
        <Flex
          mih={200}
          miw={200}
          w="100%"
          h="100%"
          maw={500}
          style={{ flex: 1 }}
          direction="column"
          mx="auto"
          align="center"
          justify="center"
        >
          <Text fz={18} fw={700} ta="center" mb="md">
            {this.state.error?.message || 'An error occurred'}
          </Text>
          <Text ta="center" mb="sm" c="dimmed">
            Something went wrong. Please try again. If the issue persists, contact support.
          </Text>
          <Button
            mx="auto"
            variant="light"
            onClick={() => {
              window.location.reload();
            }}
          >
            Try again
          </Button>
        </Flex>
      );
    }
    return this.props.children;
  }
}

const DefaultLoadingComponent = () => (
  <Flex
    mih={200}
    miw={200}
    w="100%"
    h="100%"
    style={{ flex: 1 }}
    mx="auto"
    align="center"
    justify="center"
  >
    <Loader type="bars" />
  </Flex>
);

type BoundaryComponentProps<P> = {
  ComponentToWrap: React.ComponentType<P>;
  componentProps: P;
  options?: BoundaryOptions;
};

function BoundaryComponent<P>({
  ComponentToWrap,
  componentProps,
  options,
}: BoundaryComponentProps<P>) {
  const fallback = options?.loader ? options.loader : <DefaultLoadingComponent />;

  return (
    <ErrorBoundary errorComponent={options?.error}>
      <Suspense fallback={fallback}>
        {/* @ts-ignore */}
        <ComponentToWrap {...componentProps} />
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 *
 * Keeping gemini comments in here
 * so it explains how it makes it so fast refresh works
 *
 *  */
// It now returns a simple functional component that renders the stable `BoundaryComponent`.
// Add constraint ComponentProps extends object for better type safety with {...props}
export const boundary = <ComponentProps extends object>(
  ComponentToWrap: React.ComponentType<ComponentProps>,
  options?: BoundaryOptions
): React.FC<ComponentProps> => {
  // Explicitly type the return as a Functional Component

  // This is the component type that will be returned by the HOC.
  // Its definition is stable for a given ComponentToWrap/options combination.
  const BoundaryWrapper: React.FC<ComponentProps> = (props) => {
    // Render the stable BoundaryComponent, passing down the necessary config
    // (ComponentToWrap, options) and the props intended for the original component.
    return (
      <BoundaryComponent
        ComponentToWrap={ComponentToWrap}
        options={options}
        componentProps={props}
      />
    );
  };

  // --- DevTools Debugging Enhancement ---
  // Set a display name for better debugging in React DevTools.
  const displayName = ComponentToWrap.displayName || ComponentToWrap.name || 'Component';
  BoundaryWrapper.displayName = `Boundary(${displayName})`;

  return BoundaryWrapper;
};
