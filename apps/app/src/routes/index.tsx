import { Center, Group, Stack } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { Editor } from '@/pages/editor';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <Stack mih="100vh" h="100%">
      <Center m="auto" h="100%" w="100%" p="md">
        <Group maw={1200}>
          <Editor />
        </Group>
      </Center>
    </Stack>
  );
}
