import { Box, Button, Center, Stack, Title } from '@mantine/core';
import type React from 'react';
import { z } from 'zod/v4';
import { BaseCard } from '@/components/base_card';
import { FormInput } from '@/components/form_input';
import type { TypedForm } from '@/utils/use_form';

export const connectionSchema = z.object({
  roomName: z.string().min(1, 'Room name is required'),
  userName: z.string().min(1, 'User name is required'),
});

type ConnectionFormProps = {
  form: TypedForm<typeof connectionSchema>;
  onConnect: () => void;
};

export const ConnectionForm: React.FC<ConnectionFormProps> = (props) => {
  const { form, onConnect } = props;

  return (
    <Center h="100%" mih={400}>
      <BaseCard
        p="xl"
        radius="lg"
        withBorder
        shadow="xl"
        w="100%"
        miw={400}
        maw={500}
        style={{
          background:
            'linear-gradient(135deg, rgba(149, 141, 241, 0.15) 0%, rgba(249, 129, 129, 0.15) 100%)',
          borderColor: 'var(--mantine-color-gray-3)',
        }}
      >
        <Stack gap="lg">
          <Box ta="center">
            <Title order={1} c="blue" mb="xs">
              Join
            </Title>
          </Box>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              onConnect();
            }}
          >
            <Stack gap="md">
              <FormInput
                controller={form.controller('roomName')}
                inputType="text"
                placeholder="Enter room name"
              />
              <FormInput
                controller={form.controller('userName')}
                inputType="text"
                placeholder="Enter your name"
              />
              <Button type="submit" fullWidth size="md" radius="md" variant="gradient">
                Connect
              </Button>
            </Stack>
          </form>
        </Stack>
      </BaseCard>
    </Center>
  );
};
