import { ActionIcon, Button, Group, Stack, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconChevronLeft, IconChevronRight, IconHistory } from '@tabler/icons-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { clientConfig } from '@/config';

type VersionStatus = {
  canGoBack: boolean;
  canGoForward: boolean;
  currentIndex: number;
  totalVersions: number;
};

type VersionHistoryProps = {
  documentName: string;
  onVersionLoad?: () => void;
};

export const VersionHistory: React.FC<VersionHistoryProps> = ({ documentName, onVersionLoad }) => {
  const [status, setStatus] = useState<VersionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch(`${clientConfig.apiUrl}/api/versions/${documentName}/status`);
      const data = await response.json();
      setStatus(data);
    } catch {}
  }, [documentName]);

  const goBack = async () => {
    if (!status?.canGoBack || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`${clientConfig.apiUrl}/api/versions/${documentName}/back`, {
        method: 'POST',
      });
      if (response.ok) {
        await loadStatus();
        if (onVersionLoad) {
          onVersionLoad();
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const goForward = async () => {
    if (!status?.canGoForward || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`${clientConfig.apiUrl}/api/versions/${documentName}/forward`, {
        method: 'POST',
      });
      if (response.ok) {
        await loadStatus();
        if (onVersionLoad) {
          onVersionLoad();
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const commit = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(`${clientConfig.apiUrl}/api/versions/${documentName}/commit`, {
        method: 'POST',
      });
      if (response.ok) {
        await loadStatus();
        if (onVersionLoad) {
          onVersionLoad();
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 2000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  const isViewingOldVersion = status && status.currentIndex < status.totalVersions - 1;

  return (
    <Stack gap="xs" p="xs">
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <IconHistory size={16} />
          <Text fw={600} fz="xs">
            History
          </Text>
        </Group>
      </Group>

      <Group gap="xs">
        <Tooltip label="Previous snapshot">
          <ActionIcon
            size="sm"
            variant="light"
            onClick={goBack}
            disabled={!status?.canGoBack || loading}
          >
            <IconChevronLeft size={14} />
          </ActionIcon>
        </Tooltip>

        <Text fz="xs" c="dimmed" style={{ flex: 1, textAlign: 'center' }}>
          {status ? `${status.currentIndex + 1} / ${status.totalVersions || 1}` : '-'}
        </Text>

        <Tooltip label="Next snapshot">
          <ActionIcon
            size="sm"
            variant="light"
            onClick={goForward}
            disabled={!status?.canGoForward || loading}
          >
            <IconChevronRight size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {isViewingOldVersion && (
        <Button
          size="xs"
          variant="filled"
          fullWidth
          leftSection={<IconCheck size={14} />}
          onClick={commit}
          disabled={loading}
        >
          Commit as Latest
        </Button>
      )}
    </Stack>
  );
};
