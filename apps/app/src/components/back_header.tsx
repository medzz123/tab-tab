import { ActionIcon, Group, Stack, Text } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useCanGoBack, useRouter } from '@tanstack/react-router';
import type { FunctionComponent } from 'react';
import { Copy } from './copy_button';

type BackHeaderProps = {
  title: React.ReactNode;
  subTitle?: React.ReactNode;
  rightSection?: React.ReactNode;
};

export const BackHeader: FunctionComponent<BackHeaderProps> = (props) => {
  const { title, subTitle, rightSection } = props;

  const router = useRouter();
  const canGoBack = useCanGoBack();

  return (
    <Group justify="space-between" w="100%">
      <Group align="center">
        <ActionIcon
          size="lg"
          variant="light"
          disabled={!canGoBack}
          onClick={() => {
            router.history.back();
          }}
          data-cy="navigate-back"
        >
          <IconArrowLeft />
        </ActionIcon>
        <Stack pt={1} gap={3}>
          {typeof title === 'string' ? (
            <Text data-cy="title-name" size="xl" fw={700} lh={1}>
              {title}
            </Text>
          ) : (
            title
          )}

          {typeof subTitle === 'string' ? (
            <Group gap={4}>
              <Text c="dimmed" size="sm">
                {subTitle}
              </Text>
              <Copy value={subTitle} color="gray.7" />
            </Group>
          ) : (
            subTitle
          )}
        </Stack>
      </Group>
      {rightSection}
    </Group>
  );
};
