import { Box, Loader, Modal, Stack, Text, Title, Transition } from '@mantine/core';
import { type FunctionComponent, useEffect, useState } from 'react';

type SlowLoaderProps = {
  isLoading: boolean;
  messages: Array<string>;
  /**
   * Estimated load time in milliseconds.
   */
  estimatedLoadTime: number;
};

/**
 * Use this when things take a while to load.
 */
export const SlowLoader: FunctionComponent<SlowLoaderProps> = (props) => {
  if (props.isLoading) {
    return <SlowLoaderContent {...props} />;
  }
  return null;
};

const SlowLoaderContent: FunctionComponent<SlowLoaderProps> = (props) => {
  const { messages, estimatedLoadTime } = props;
  const [showMessage, setShowMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowMessage((prev) => Math.min(prev + 1, messages.length - 1));
    }, estimatedLoadTime / messages.length);

    return () => clearInterval(interval);
  }, [estimatedLoadTime, messages.length]);

  return (
    <Modal
      opened={true}
      onClose={() => {}}
      closeOnClickOutside={false}
      withCloseButton={false}
      size="lg"
      keepMounted={false}
    >
      <Stack h={300} justify="center" align="center">
        <Loader size="md" type="bars" mt="auto" />
        <Box pos="relative" style={{ overflow: 'hidden' }} h={60} mt="xl">
          {messages.map((message, i) => (
            <Transition
              mounted={showMessage === i}
              transition="slide-up"
              duration={400}
              timingFunction="ease"
              enterDelay={350}
              key={message}
            >
              {(styles) => (
                <Title order={4} style={styles}>
                  {message}
                </Title>
              )}
            </Transition>
          ))}
        </Box>
        <Text variant="dimmed" mt="auto" size="xs">
          This may take a few moments, please keep your browser open.
        </Text>
      </Stack>
    </Modal>
  );
};
