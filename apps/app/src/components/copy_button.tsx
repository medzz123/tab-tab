import {
  ActionIcon,
  CopyButton,
  type MantineColor,
  type MantineSize,
  Tooltip,
} from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import type { FunctionComponent } from 'react';

type CopyProps = {
  value?: string;
  color?: MantineColor;
  size?: MantineSize | (string & {}) | number;
  disabled?: boolean;
};

export const Copy: FunctionComponent<CopyProps> = (props) => {
  const { value, color = 'black', size = 16, disabled = false } = props;

  if (!value) {
    return null;
  }

  return (
    <CopyButton value={value} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
          <ActionIcon
            variant="transparent"
            color={copied ? 'teal' : color}
            size={size}
            onClick={copy}
            disabled={disabled}
          >
            {copied ? <IconCheck size={size} /> : <IconCopy size={size} />}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  );
};
