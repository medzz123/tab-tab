import { ActionIcon, Button, Group, Modal, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import { IconCamera, IconHistory, IconRefresh, IconTrash } from '@tabler/icons-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { clientConfig } from '@/config';

type Version = {
  id: string;
  name: string;
  timestamp: number;
};

type VersionHistoryProps = {
  documentName: string;
  onVersionLoad?: () => void;
};

export const VersionHistory: React.FC<VersionHistoryProps> = ({ documentName, onVersionLoad }) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [snapshotModalOpened, setSnapshotModalOpened] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');

  const loadVersions = useCallback(async () => {
    try {
      const response = await fetch(`${clientConfig.apiUrl}/api/versions/${documentName}`);
      const data = await response.json();
      setVersions(data.versions || []);
    } catch {}
  }, [documentName]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const createSnapshot = async () => {
    if (loading || !snapshotName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${clientConfig.apiUrl}/api/versions/${documentName}/snapshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: snapshotName.trim() }),
      });
      if (response.ok) {
        setSnapshotModalOpened(false);
        setSnapshotName('');
        await loadVersions();
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const removeAllSnapshots = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(`${clientConfig.apiUrl}/api/versions/${documentName}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadVersions();
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const applyVersion = async (versionId: string) => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${clientConfig.apiUrl}/api/versions/${documentName}/${versionId}/apply`,
        {
          method: 'POST',
        }
      );
      if (response.ok) {
        await loadVersions();
        if (onVersionLoad) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          onVersionLoad();
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="xs" p="xs">
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <IconHistory size={16} />
          <Text fw={600} fz="xs">
            History
          </Text>
        </Group>
        <Group gap="xs">
          <Tooltip label="Refresh">
            <ActionIcon size="sm" variant="light" onClick={loadVersions} disabled={loading}>
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Create snapshot">
            <ActionIcon
              size="sm"
              variant="light"
              onClick={() => setSnapshotModalOpened(true)}
              disabled={loading}
            >
              <IconCamera size={14} />
            </ActionIcon>
          </Tooltip>
          {versions.length > 0 && (
            <Tooltip label="Remove all snapshots">
              <ActionIcon
                size="sm"
                variant="light"
                color="red"
                onClick={removeAllSnapshots}
                disabled={loading}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {versions.length === 0 ? (
        <Text fz="xs" c="dimmed" ta="center" py="md">
          No snapshots yet
        </Text>
      ) : (
        <Stack gap={4} style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {versions.map((version) => (
            <Button
              key={version.id}
              size="xs"
              variant="subtle"
              fullWidth
              justify="flex-start"
              onClick={() => applyVersion(version.id)}
              disabled={loading}
              style={{ textAlign: 'left' }}
            >
              <Text fz="xs" truncate>
                {version.name}
              </Text>
            </Button>
          ))}
        </Stack>
      )}

      <Modal
        opened={snapshotModalOpened}
        onClose={() => {
          setSnapshotModalOpened(false);
          setSnapshotName('');
        }}
        title="Create Snapshot"
      >
        <Stack gap="md">
          <TextInput
            label="Snapshot Name"
            placeholder="Enter snapshot name"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && snapshotName.trim()) {
                createSnapshot();
              }
            }}
            autoFocus
          />
          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => {
                setSnapshotModalOpened(false);
                setSnapshotName('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={createSnapshot} loading={loading} disabled={!snapshotName.trim()}>
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};
