import { HocuspocusProvider } from '@hocuspocus/provider';
import { Text } from '@mantine/core';
import { Link, RichTextEditor } from '@mantine/tiptap';
import { IconBold, IconItalic } from '@tabler/icons-react';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import { BubbleMenu, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type React from 'react';
import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { BaseCard } from '@/components/base_card';
import { clientConfig } from '@/config';

const BoldIcon = () => <IconBold size={16} stroke={3.5} />;
const ItalicIcon = () => <IconItalic size={16} stroke={3.5} />;

const colors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8'];
const names = [
  'Friendly Bear',
  'Happy Penguin',
  'Clever Fox',
  'Wise Owl',
  'Swift Deer',
  'Curious Cat',
  'Brave Lion',
  'Gentle Whale',
  'Playful Dolphin',
  'Elegant Swan',
  'Bold Eagle',
  'Calm Turtle',
  'Energetic Rabbit',
  'Mysterious Wolf',
  'Graceful Gazelle',
  'Cheerful Squirrel',
  'Noble Horse',
  'Cunning Raccoon',
  'Majestic Tiger',
  'Peaceful Panda',
  'Adventurous Otter',
  'Loyal Dog',
  'Independent Cat',
  'Social Butterfly',
  'Free Bird',
  'Deep Fish',
  'Strong Bull',
  'Quick Cheetah',
  'Silent Snake',
  'Bright Firefly',
];

const getRandomElement = (list: string[]) => list[Math.floor(Math.random() * list.length)];

type TiptapProps = {
  provider: HocuspocusProvider;
  name: string;
  color: string;
};

const Tiptap: React.FC<TiptapProps> = (props) => {
  const { provider, name, color } = props;

  const editor = useEditor({
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({ link: false }),
      Link,
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

  return (
    <RichTextEditor
      editor={editor}
      variant="default"
      h="100%"
      style={{
        flex: 1,
        minHeight: 0,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderWidth: 0,
        overflowY: 'scroll',
      }}
      styles={{
        root: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        },
        content: { flex: 1, minHeight: 0, overflow: 'hidden' },
      }}
    >
      {editor && (
        <BubbleMenu editor={editor}>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold icon={BoldIcon} />
            <RichTextEditor.Italic icon={ItalicIcon} />
            <RichTextEditor.Link />
          </RichTextEditor.ControlsGroup>
        </BubbleMenu>
      )}

      <RichTextEditor.Content />
    </RichTextEditor>
  );
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
