import type React from 'react';
import { useState } from 'react';
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

export const Editor: React.FC = () => {
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
    setIsConnected(false);
    form.reset();
  };

  // Show connection form
  if (!isConnected) {
    return <ConnectionForm form={form} onConnect={handleConnect} />;
  }

  // Show connected room
  return (
    <CollaborationRoom
      userName={userName}
      userColor={userColor}
      roomName={roomName}
      onDisconnect={handleDisconnect}
    />
  );
};
