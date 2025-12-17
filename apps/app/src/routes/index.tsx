import { Center, Text } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <Center>
      <Text>Hello there</Text>
    </Center>
  );
}
