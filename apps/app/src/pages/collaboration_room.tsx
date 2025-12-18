import type { HocuspocusProvider } from '@hocuspocus/provider';
import { Avatar, Box, Button, Group, Stack, Text } from '@mantine/core';
import { Link, RichTextEditor } from '@mantine/tiptap';
import { IconBold, IconItalic, IconLogout } from '@tabler/icons-react';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import { useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import type React from 'react';
import { useEffect } from 'react';
import { BaseCard } from '@/components/base_card';
import classes from './editor.module.css';

const BoldIcon = () => <IconBold size={16} stroke={3.5} />;
const ItalicIcon = () => <IconItalic size={16} stroke={3.5} />;

type ConnectedUser = {
  name: string;
  color: string;
};

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

  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom.closest('.mantine-RichTextEditor-content');
    if (editorElement) {
      editorElement.classList.add(classes.tiptap);
    }

    // Update caret border color CSS variable when carets are rendered
    const updateCaretColors = () => {
      if (!editorElement) return;

      // Find all carets and match them with their labels
      const carets = editorElement.querySelectorAll('.collaboration-carets__caret');
      carets?.forEach((caret) => {
        const computedStyle = window.getComputedStyle(caret);
        const borderColor = computedStyle.borderLeftColor;

        // Label is typically a child of the caret element
        const label = caret.querySelector('.collaboration-carets__label') as HTMLElement;
        if (label) {
          label.style.setProperty('--caret-border-color', borderColor);
        }
      });
    };

    // Initial update
    updateCaretColors();

    // Watch for new carets being added
    const observer = new MutationObserver(updateCaretColors);
    if (editorElement) {
      observer.observe(editorElement, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      if (editorElement) {
        editorElement.classList.remove(classes.tiptap);
      }
      observer.disconnect();
    };
  }, [editor]);

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

type CollaborationRoomProps = {
  provider: HocuspocusProvider;
  userName: string;
  userColor: string;
  roomName: string;
  connectedUsers: ConnectedUser[];
  onDisconnect: () => void;
};

export const CollaborationRoom: React.FC<CollaborationRoomProps> = (props) => {
  const { provider, userName, userColor, roomName, connectedUsers, onDisconnect } = props;

  return (
    <BaseCard
      padded={false}
      mih={400}
      miw={600}
      flex={1}
      leftSection={userName}
      rightSection={
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            {roomName}
          </Text>
          <Button
            size="xs"
            variant="light"
            color="red"
            leftSection={<IconLogout size={14} />}
            onClick={onDisconnect}
            radius="md"
          >
            Disconnect
          </Button>
        </Group>
      }
      applyBackgroundColor
      bg={'violet'}
    >
      <Group wrap="nowrap" gap={0} h="100%">
        <Box w={400} mih={400} flex={1}>
          <Tiptap provider={provider} name={userName} color={userColor} />
        </Box>
        <Box
          w={200}
          mih={400}
          p="md"
          style={{
            borderLeft: '1px solid var(--mantine-color-gray-3)',
            background:
              'linear-gradient(180deg, rgba(149, 141, 241, 0.05) 0%, rgba(249, 129, 129, 0.05) 100%)',
          }}
        >
          <Stack gap="xs">
            <Text fw={600} size="sm" c="dimmed">
              Connected Users ({connectedUsers.length})
            </Text>

            <Stack gap="xs">
              {connectedUsers.map((user, index) => (
                <Group
                  key={index}
                  gap="xs"
                  p="xs"
                  style={{
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    transition: 'all 0.2s ease',
                    border: `1px solid ${user.color}20`,
                  }}
                >
                  <Avatar
                    size="sm"
                    style={{
                      backgroundColor: user.color,
                      color: 'white',
                      fontWeight: 'bold',
                      boxShadow: `0 2px 8px ${user.color}40`,
                    }}
                    radius="xl"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Text size="xs" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Stack>
        </Box>
      </Group>
    </BaseCard>
  );
};
