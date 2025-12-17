import {
  Box,
  type BoxProps,
  Card,
  type CardProps,
  Group,
  type MantineColor,
  Text,
  useMantineTheme,
} from '@mantine/core';
import type { Icon, IconProps } from '@tabler/icons-react';
import { hexAlpha } from '@template/utils/hexAlpha';
import { useMemo } from 'react';

type BaseCardProps = {
  leftSection?: string | React.ReactNode;
  leftIcon?: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>;
  leftIconSize?: number;

  color?: MantineColor;
  applyBackgroundColor?: boolean;
  withInnerBorders?: boolean;

  outerBorderRadius?: number;

  rightSection?: React.ReactNode;
  children?: React.ReactNode;
  padded?: boolean;
  headerPadded?: boolean;
  truncate?: boolean;
  headerProps?: BoxProps;
  footer?: React.ReactNode;
  footerPadded?: boolean;
  footerProps?: BoxProps;
  childrenContainerProps?: BoxProps;
  fullHeight?: boolean;
  leftIndicator?: boolean;

  borders?: {
    left?: boolean;
    right?: boolean;
    top?: boolean;
    bottom?: boolean;
  };
} & CardProps;

export const BaseCard: React.FC<BaseCardProps> = (props) => {
  const {
    leftSection,
    rightSection,
    children,
    color: _color,
    leftIcon,
    leftIconSize = 16,
    headerPadded = true,
    withInnerBorders = true,
    footerPadded = true,
    padded = true,
    fullHeight = false,
    applyBackgroundColor = false,
    footer,
    footerProps,
    truncate,
    headerProps,
    childrenContainerProps,
    leftIndicator,
    outerBorderRadius = 8,
    borders,
    ...rest
  } = props;

  const mantineTheme = useMantineTheme();
  const mantineColors = mantineTheme.colors;

  const color = useMemo(() => {
    if (!_color) return undefined;

    const [colorName, position = '5'] = _color.split('.');

    if (!colorName) return _color;

    const colors = mantineColors[colorName];

    if (!colors) return _color;

    return colors[Number(position)] ?? _color;
  }, [mantineColors, _color]);

  const selectedColor = useMemo(() => {
    if (!_color) return undefined;

    const [colorName] = _color.split('.');

    if (!colorName) return undefined;

    const colors = mantineColors[colorName];

    if (!colors) return undefined;

    return colors ?? undefined;
  }, [mantineColors, _color]);

  const hasHeader = !!leftSection || !!rightSection;

  const LeftIcon = leftIcon;

  return (
    <Card
      withBorder
      style={{
        borderRadius: outerBorderRadius,
        borderLeft: leftIndicator
          ? `6px solid ${color ?? 'black'}`
          : borders?.left
            ? '1px solid var(--mantine-color-gray-3)'
            : undefined,
        borderRight: borders?.right ? '1px solid var(--mantine-color-gray-3)' : undefined,
        borderTop: borders?.top ? '1px solid var(--mantine-color-gray-3)' : undefined,
        borderBottom: borders?.bottom ? '1px solid var(--mantine-color-gray-3)' : undefined,
      }}
      p={0}
      h={fullHeight ? '100%' : undefined}
      bg={
        selectedColor && applyBackgroundColor ? `${hexAlpha(selectedColor['3'], 0.1)}` : undefined
      }
      {...rest}
    >
      {hasHeader && (
        <Box
          h={36}
          mih={36}
          mah={36}
          px={8}
          p={headerPadded ? 'xs' : 0}
          style={{
            borderBottom: withInnerBorders ? '1px solid var(--mantine-color-gray-3)' : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
          {...headerProps}
        >
          <Group wrap="nowrap" gap={4}>
            {LeftIcon ? <LeftIcon size={leftIconSize} color={color} /> : null}
            {typeof leftSection === 'string' ? (
              <Text truncate={truncate} lh={1} fw={700} fz="xs" c={color}>
                {leftSection}
              </Text>
            ) : (
              leftSection
            )}
          </Group>
          {typeof rightSection === 'string' ? (
            <Text truncate={truncate} lh={1} fw={700} fz="xs" c={color}>
              {rightSection}
            </Text>
          ) : (
            rightSection
          )}
        </Box>
      )}

      <Box
        p={padded ? 'sm' : 0}
        h={
          fullHeight
            ? `calc(100% - ${hasHeader ? '36' : '0'}px - ${footer ? '36' : '0'}px)`
            : undefined
        }
        {...childrenContainerProps}
      >
        {children}
      </Box>

      {footer && (
        <Box
          h={36}
          mih={36}
          mah={36}
          px={8}
          p={footerPadded ? 'xs' : 0}
          style={{
            borderTop: withInnerBorders ? '1px solid var(--mantine-color-gray-3)' : undefined,
            display: 'flex',
            alignItems: 'center',
          }}
          {...footerProps}
        >
          {footer}
        </Box>
      )}
    </Card>
  );
};
