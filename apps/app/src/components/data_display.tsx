import type {
  BoxProps,
  FlexProps,
  MantineColor,
  MantineSize,
  MantineSpacing,
  StyleProp,
  TextProps,
} from '@mantine/core';
import { Box, Flex, Group, Text } from '@mantine/core';
import { IconMaximize } from '@tabler/icons-react';
import { isValidElement } from 'react';
import { Copy } from './copy_button';
import { ModalOpener } from './modal_opener';

export type DataDisplayProps = {
  label: string | React.ReactNode;
  c?: MantineColor;
  expand?: boolean;
  size?: MantineSize;
  textProps?: TextProps;
  value?: string | number | null | React.ReactNode;
  description?: string | React.ReactNode;
  copy?: boolean;
  actions?: React.ReactNode;
  labelActions?: React.ReactNode;
  multiline?: boolean;
  stretch?: boolean;
  stack?: boolean;
  valueContainerProps?: BoxProps;
  dataCy?: string;
  fw?: StyleProp<React.CSSProperties['fontWeight']>;
  maxTextWidth?: number;
  leftValueSection?: React.ReactNode;
  mb?: MantineSpacing;
} & FlexProps;

export const DataDisplay: React.FC<DataDisplayProps> = (props) => {
  const {
    actions,
    c,
    label,
    labelActions,
    size = 'sm',
    value = '',
    stack = true,
    expand = false,
    copy = false,
    multiline = false,
    description,
    stretch = true,
    valueContainerProps,
    maxTextWidth,
    dataCy,
    fw = 500,
    textProps,
    mb = 'xs',
    leftValueSection,
    ...rest
  } = props;

  const valueIsStringOrNumber = typeof value === 'string' || typeof value === 'number';

  const isElement = isValidElement(value);
  const labelIsElement = isValidElement(label);

  return (
    <Flex
      direction={stack ? 'column' : 'row'}
      align={stack ? undefined : multiline ? 'flex-start' : 'center'}
      justify={stretch ? 'space-between' : undefined}
      mb={mb}
      {...rest}
    >
      <Group mb={1} gap={4} mr={labelIsElement ? 8 : undefined}>
        {labelIsElement ? (
          label
        ) : (
          <Text fz={size} c={c || 'dimmed'}>
            {label}
          </Text>
        )}
        <Group>{labelActions}</Group>
      </Group>

      <Box
        h={multiline ? undefined : 18}
        display="flex"
        style={{ alignItems: 'center' }}
        {...valueContainerProps}
      >
        {isElement ? (
          value
        ) : (
          <Group gap={4} align="top" wrap="nowrap" maw="100%">
            {leftValueSection}
            <Text
              data-cy={
                dataCy ||
                `${typeof label === 'string' ? label.toLowerCase().split(' ').join('-') : 'node-label'}`
              }
              c={c}
              fz={size}
              lh={1.3}
              fw={fw}
              title={value ? String(value) : undefined}
              maw={maxTextWidth}
              truncate={!multiline}
              {...textProps}
            >
              {value}
            </Text>
            <Group gap={4} wrap="nowrap">
              {copy && <Copy value={valueIsStringOrNumber ? String(value) : ''} />}{' '}
              {expand && (
                <ModalOpener
                  targetType="icon"
                  icon={IconMaximize}
                  actionIconProps={{ size: 'xs', color: 'dark' }}
                >
                  {(_) => (
                    <Text>{valueIsStringOrNumber ? String(value) : JSON.stringify(value)}</Text>
                  )}
                </ModalOpener>
              )}{' '}
              {actions}
            </Group>
          </Group>
        )}
      </Box>

      {description &&
        // eslint-disable-next-line react/jsx-no-useless-fragment
        (typeof description === 'string' ? (
          <Text mt={2} fz="xs" c="dimmed">
            {description}
          </Text>
        ) : (
          description
        ))}
    </Flex>
  );
};
