import { HocuspocusProvider } from '@hocuspocus/provider';
import { Center, Stack, Text } from '@mantine/core';
import type React from 'react';
import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { BaseCard } from '@/components/base_card';
import { clientConfig } from '@/config';
import { useForm } from '@/utils/use_form';
import { CollaborationRoom } from './collaboration_room';
import { ConnectionForm, connectionSchema } from './connection_form';

const colors = [
  '#958DF1',
  '#F98181',
  '#FBBC88',
  '#FAF594',
  '#70CFF8',
  '#9AE6B4',
  '#F6AD55',
  '#FC8181',
  '#68D391',
  '#63B3ED',
];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

type ConnectedUser = {
  name: string;
  color: string;
};

export const Editor: React.FC = () => {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [status, setStatus] = useState('disconnected');
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userColor, setUserColor] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');

  const form = useForm(connectionSchema, {
    initial: {
      roomName: '',
      userName: '',
    },
  });

  const handleConnect = () => {
    if (!form.isValid()) {
      form.validate();
      return;
    }

    const { roomName: room, userName: name } = form.values;
    const color = getRandomColor();

    setRoomName(room);
    setUserName(name);
    setUserColor(color);
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    if (provider) {
      provider.destroy();
      setProvider(null);
    }
    setIsConnected(false);
    setConnectedUsers([]);
    setStatus('disconnected');
    form.reset();
  };

  useEffect(() => {
    if (!isConnected || !userName || !roomName) return;

    const ydoc = new Y.Doc();
    const newProvider = new HocuspocusProvider({
      url: clientConfig.wsUrl,
      name: roomName,
      document: ydoc,
      onStatus: ({ status }) => {
        setStatus(status);
      },
      onAwarenessUpdate: ({ states }) => {
        const users: ConnectedUser[] = [];
        states.forEach((state) => {
          if (state.user?.name && state.user?.color) {
            users.push({
              name: state.user.name,
              color: state.user.color,
            });
          }
        });
        setConnectedUsers(users);
      },
    });

    // Set awareness field with user info
    newProvider.setAwarenessField('user', {
      name: userName,
      color: userColor,
    });

    setProvider(newProvider);

    return () => {
      newProvider.destroy();
    };
  }, [isConnected, userName, roomName, userColor]);

  // Show connection form
  if (!isConnected) {
    return <ConnectionForm form={form} onConnect={handleConnect} />;
  }

  // Show connecting state
  if (!provider) {
    return (
      <BaseCard
        mih={400}
        flex={1}
        leftSection={userName}
        rightSection={status}
        applyBackgroundColor
        bg={'violet'}
      >
        <Center h="100%">
          <Stack gap="md" align="center">
            <Text size="lg" fw={500}>
              Connecting to {roomName}...
            </Text>
            <Text size="sm" c="dimmed">
              Please wait
            </Text>
          </Stack>
        </Center>
      </BaseCard>
    );
  }

  // Show connected room
  return (
    <CollaborationRoom
      provider={provider}
      userName={userName}
      userColor={userColor}
      roomName={roomName}
      connectedUsers={connectedUsers}
      onDisconnect={handleDisconnect}
    />
  );
};
