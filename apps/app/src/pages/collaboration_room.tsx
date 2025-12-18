import { HocuspocusProvider } from '@hocuspocus/provider';
import { Avatar, Box, Button, Center, Group, Stack, Text } from '@mantine/core';
import { Link, RichTextEditor } from '@mantine/tiptap';
import { IconBold, IconItalic, IconLogout } from '@tabler/icons-react';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import { useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import type React from 'react';
import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { BaseCard } from '@/components/base_card';
import { clientConfig } from '@/config';

type ConnectedUser = {
  name: string;
  color: string;
};

type CollaborationRoomProps = {
  userName: string;
  userColor: string;
  roomName: string;
  onDisconnect: () => void;
};

const Tiptap: React.FC<{ provider: HocuspocusProvider; name: string; color: string }> = ({
  provider,
  name,
  color,
}) => {
  const editor = useEditor({
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({ link: false }),
      Link,
      Collaboration.configure({ document: provider.document }),
      CollaborationCaret.configure({ provider, user: { name, color } }),
    ],
  });

  return (
    <RichTextEditor
      editor={editor}
      styles={{
        root: { border: 'none' },
      }}
    >
      {editor && (
        <BubbleMenu editor={editor}>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold icon={() => <IconBold size={16} stroke={3.5} />} />
            <RichTextEditor.Italic icon={() => <IconItalic size={16} stroke={3.5} />} />
            <RichTextEditor.Link />
          </RichTextEditor.ControlsGroup>
        </BubbleMenu>
      )}
      <RichTextEditor.Content h={400} />
    </RichTextEditor>
  );
};

export const CollaborationRoom: React.FC<CollaborationRoomProps> = ({
  userName,
  userColor,
  roomName,
  onDisconnect,
}) => {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const newProvider = new HocuspocusProvider({
      url: clientConfig.wsUrl,
      name: roomName,
      document: ydoc,
      onAwarenessUpdate: ({ states }) => {
        const users: ConnectedUser[] = [];
        states.forEach((state) => {
          if (state.user?.name && state.user?.color) {
            users.push({ name: state.user.name, color: state.user.color });
          }
        });
        setConnectedUsers(users);
      },
    });

    newProvider.setAwarenessField('user', { name: userName, color: userColor });
    setProvider(newProvider);

    return () => newProvider.destroy();
  }, [roomName, userName, userColor]);

  const handleDisconnect = () => {
    provider?.destroy();
    setProvider(null);
    onDisconnect();
  };

  if (!provider) {
    return (
      <BaseCard mih={400} flex={1}>
        <Center h="100%">
          <Text ta="center" size="lg" fw={500}>
            Connecting to {roomName}...
          </Text>
        </Center>
      </BaseCard>
    );
  }

  return (
    <BaseCard
      padded={false}
      mih={400}
      miw={600}
      flex={1}
      leftSection={roomName}
      rightSection={
        <Button
          size="compact-xs"
          variant="light"
          color="red"
          leftSection={<IconLogout size={14} />}
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      }
    >
      <Group wrap="nowrap" gap={0} h="100%" align="flex-start">
        <Box h={400} w="100%" flex={1} bg="blue.0">
          <Tiptap provider={provider} name={userName} color={userColor} />
        </Box>
        <Box h={400} style={{ borderLeft: '1px solid var(--mantine-color-gray-3)' }} w={150} p="xs">
          <Text fw={600} fz="xs" mb="xs">
            Connected Users ({connectedUsers.length})
          </Text>
          <Stack>
            {connectedUsers.map((user) => (
              <Group key={user.name} gap="xs" p={0}>
                <Avatar size="xs" style={{ backgroundColor: user.color }} radius="xl">
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Text fz="xs" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </Text>
              </Group>
            ))}
          </Stack>
        </Box>
      </Group>
    </BaseCard>
  );
};
