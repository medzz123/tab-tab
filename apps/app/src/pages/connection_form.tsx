import { Box, Button, Center, Paper, Stack, Text, Title } from '@mantine/core';
import type React from 'react';
import { z } from 'zod/v4';
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
    <Center
      h="100%"
      style={{
        minHeight: '400px',
        background:
          'linear-gradient(135deg, rgba(149, 141, 241, 0.05) 0%, rgba(249, 129, 129, 0.05) 50%, rgba(250, 245, 148, 0.05) 100%)',
      }}
    >
      <Paper
        p="xl"
        radius="lg"
        withBorder
        shadow="xl"
        style={{
          width: '100%',
          maxWidth: '500px',
          background:
            'linear-gradient(135deg, rgba(149, 141, 241, 0.15) 0%, rgba(249, 129, 129, 0.15) 100%)',
          borderColor: 'var(--mantine-color-gray-3)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
        }}
      >
        <Stack gap="lg">
          <Box ta="center">
            <Title order={2} c="violet" mb="xs" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              Join Collaboration Room
            </Title>
            <Text c="dimmed" size="sm">
              Enter your details to start collaborating
            </Text>
          </Box>

          <form
            onSubmit={(e) => {
              e.preventDefault();
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
              <Button
                type="submit"
                fullWidth
                size="md"
                radius="md"
                variant="gradient"
                gradient={{ from: 'violet', to: 'pink', deg: 135 }}
                style={{
                  transition: 'all 0.2s ease',
                }}
                styles={{
                  root: {
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(149, 141, 241, 0.4)',
                    },
                  },
                }}
              >
                Connect to Room
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Center>
  );
};
