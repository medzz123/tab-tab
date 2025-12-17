import { HocuspocusProvider } from '@hocuspocus/provider';
import { Text } from '@mantine/core';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type React from 'react';
import { useEffect, useState } from 'react';
import * as Y from 'yjs';

import './home.styles.css';
import { BaseCard } from '@/components/base_card';
import { clientConfig } from '@/config';

const colors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8'];
const names = ['Jet', 'Spike', 'Faye', 'Ed', 'Ein', 'Some', 'Other', 'Name', 'Going', 'On'];
const getRandomElement = (list: string[]) => list[Math.floor(Math.random() * list.length)];

type TiptapProps = {
  provider: HocuspocusProvider;
  name: string;
  color: string;
};

const Tiptap: React.FC<TiptapProps> = (props) => {
  const { provider, name, color } = props;

  const editor = useEditor({
    extensions: [
      StarterKit.configure(),
      Collaboration.configure({
        document: provider.document,
      }),
      CollaborationCaret.configure({
        provider: provider,
        user: {
          name,
          color,
        },
      }),
    ],
  });

  return <EditorContent editor={editor} />;
};

export const Editor: React.FC = () => {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [status, setStatus] = useState('disconnected');

  const [name] = useState(() => getRandomElement(names));
  const [color] = useState(() => getRandomElement(colors));

  useEffect(() => {
    const ydoc = new Y.Doc();
    const newProvider = new HocuspocusProvider({
      url: clientConfig.wsUrl,
      name: 'default',
      document: ydoc,
      onStatus: ({ status }) => {
        setStatus(status);
      },
    });

    setProvider(newProvider);

    return () => newProvider.destroy();
  }, []);

  if (!provider)
    return (
      <BaseCard
        mih={400}
        flex={1}
        leftSection={name}
        rightSection={status}
        applyBackgroundColor
        bg={'yellow'}
      >
        <Text>Connecting</Text>
      </BaseCard>
    );

  return (
    <BaseCard
      padded={false}
      mih={400}
      miw={400}
      flex={1}
      leftSection={name}
      rightSection={status}
      // applyBackgroundColor
      color={status === 'connected' ? 'green' : 'red'}
    >
      <Tiptap provider={provider} name={name} color={color} />
    </BaseCard>
  );
};
