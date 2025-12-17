import { ActionIcon, type ActionIconProps } from '@mantine/core';
import { IconLink } from '@tabler/icons-react';
import type { LinkProps } from '@tanstack/react-router';
import type { FunctionComponent } from 'react';
import { TLink } from './t_link';

type InternalLinkProps = LinkProps & ActionIconProps;

export const InternalLink: FunctionComponent<InternalLinkProps> = (props) => {
  return (
    <ActionIcon variant="light" size={16} component={TLink} {...props}>
      <IconLink size={16} />
    </ActionIcon>
  );
};
