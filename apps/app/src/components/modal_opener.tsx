import {
  ActionIcon,
  type ActionIconProps,
  Button,
  type ButtonProps,
  Menu,
  type MenuItemProps,
  Modal,
  type ModalProps,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { type Icon, IconEdit, type IconProps } from '@tabler/icons-react';
import { Fragment, type FunctionComponent } from 'react';

type ModalOpenerProps = {
  children: (onClose: () => void) => React.ReactNode;
  iconSize?: number | string;
  label?: string | React.ReactNode;
  title?: string;
  modalProps?: Omit<ModalProps, 'opened' | 'onClose'>;
  buttonProps?: ButtonProps;
  actionIconProps?: ActionIconProps;
  menuItemProps?: MenuItemProps;
  icon?: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>;
  targetType?: 'button' | 'icon' | 'menu-item';
  target?: (open: () => void) => React.ReactNode;
  onClick?: () => void;
};

export const ModalOpener: FunctionComponent<ModalOpenerProps> = (props) => {
  const {
    children,
    modalProps,
    iconSize = 14,
    label,
    title,
    buttonProps,
    actionIconProps,
    menuItemProps,
    target,
    icon,
    targetType = 'button',
    onClick,
  } = props;

  const [opened, handlers] = useDisclosure();

  const Icon = icon;

  return (
    <Fragment>
      {target ? (
        target(handlers.open)
      ) : targetType === 'button' ? (
        <Button
          size="xs"
          variant="light"
          onClick={(event) => {
            event.stopPropagation();
            handlers.open();
            onClick?.();
          }}
          {...buttonProps}
        >
          {label ?? 'Open'}
        </Button>
      ) : targetType === 'icon' ? (
        <ActionIcon
          size="xs"
          variant="light"
          color="blue"
          onClick={(event) => {
            event.stopPropagation();
            handlers.open();
            onClick?.();
          }}
          {...actionIconProps}
        >
          {Icon ? <Icon size={iconSize} /> : <IconEdit size={iconSize} />}
        </ActionIcon>
      ) : (
        <Menu.Item
          onClick={() => {
            handlers.open();
            onClick?.();
          }}
          {...menuItemProps}
        >
          {label ?? 'Open'}
        </Menu.Item>
      )}

      <Modal
        size="lg"
        opened={opened}
        onClose={handlers.close}
        title={title ?? label}
        {...modalProps}
      >
        {opened && children(handlers.close)}
      </Modal>
    </Fragment>
  );
};
