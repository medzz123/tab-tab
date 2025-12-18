import type React from 'react';
import { useEffect, useState } from 'react';
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

const SESSION_STORAGE_KEYS = {
  ROOM_NAME: 'editor_room_name',
  USER_NAME: 'editor_user_name',
  USER_COLOR: 'editor_user_color',
};

export const Editor: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [userColor, setUserColor] = useState<string>('');

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

    const color = getRandomColor();

    sessionStorage.setItem(SESSION_STORAGE_KEYS.ROOM_NAME, form.values.roomName);
    sessionStorage.setItem(SESSION_STORAGE_KEYS.USER_NAME, form.values.userName);
    sessionStorage.setItem(SESSION_STORAGE_KEYS.USER_COLOR, color);
    setUserColor(color);
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.ROOM_NAME);
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.USER_NAME);
    form.reset();
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: no-need
  useEffect(() => {
    if (
      sessionStorage.getItem(SESSION_STORAGE_KEYS.ROOM_NAME) &&
      sessionStorage.getItem(SESSION_STORAGE_KEYS.USER_NAME)
    ) {
      form.setValues({
        roomName: sessionStorage.getItem(SESSION_STORAGE_KEYS.ROOM_NAME) || '',
        userName: sessionStorage.getItem(SESSION_STORAGE_KEYS.USER_NAME) || '',
      });
      setUserColor(sessionStorage.getItem(SESSION_STORAGE_KEYS.USER_COLOR) || '');
      setIsConnected(true);
    }
  }, []);

  if (!isConnected) {
    return <ConnectionForm form={form} onConnect={handleConnect} />;
  }

  return (
    <CollaborationRoom
      userName={form.values.userName}
      userColor={userColor}
      roomName={form.values.roomName}
      onDisconnect={handleDisconnect}
    />
  );
};
