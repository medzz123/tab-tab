import {
  Button,
  type ButtonVariant,
  type MantineColor,
  type MantineRadius,
  type MantineSize,
} from '@mantine/core';
import type { Icon, IconProps } from '@tabler/icons-react';
import type React from 'react';

type CommonPropsBase = {
  size?: MantineSize | `compact-${MantineSize}`;
  radius?: MantineRadius;
  selectedVariant?: ButtonVariant;
  unselectedVariant?: ButtonVariant;
  color?: MantineColor;
};

type StringDataBase<T extends readonly string[]> = {
  data: T;
  value: T[number] | null | undefined;
};

type ObjectItem<T extends string> = {
  label: string;
  value: T;
  icon?: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>;
  iconSize?: string | number;
  color?: MantineColor;
};

type ObjectDataBase<T extends readonly ObjectItem<string>[]> = {
  data: T;
  value: T[number]['value'] | null | undefined;
};

type WithDeselect<T> = {
  allowDeselect?: true;
  onChange?: (value: T | null) => void;
};

type WithoutDeselect<T> = {
  allowDeselect: false;
  onChange?: (value: T) => void;
};

type DeselectBehavior<T> = WithDeselect<T> | WithoutDeselect<T>;

type StringData<T extends readonly string[]> = CommonPropsBase &
  StringDataBase<T> &
  DeselectBehavior<T[number]>;

type ObjectData<T extends readonly ObjectItem<string>[]> = CommonPropsBase &
  ObjectDataBase<T> &
  DeselectBehavior<T[number]['value']>;

type TButtonGroupProps<T extends readonly string[] | readonly ObjectItem<string>[]> =
  T extends readonly string[]
    ? StringData<T>
    : ObjectData<Extract<T, readonly ObjectItem<string>[]>>;

export function TButtonGroup<T extends readonly string[] | readonly ObjectItem<string>[]>(
  props: TButtonGroupProps<T>
): React.JSX.Element {
  const {
    data,
    value,
    size = 'compact-xs',
    radius = 'md',
    color,
    selectedVariant = 'filled',
    unselectedVariant = 'default',
    onChange,
    allowDeselect = true,
  } = props;

  return (
    <Button.Group
      styles={{
        group: {
          borderRadius: 4,
        },
      }}
    >
      {data.map((item) => {
        const itemValue = typeof item === 'string' ? item : item.value;

        return (
          <Button
            radius={radius}
            variant={value === itemValue ? selectedVariant : unselectedVariant}
            size={size}
            key={`button-group-${itemValue}`}
            color={typeof item !== 'string' ? (item.color ?? color) : color}
            leftSection={
              typeof item !== 'string' ? (
                item.icon ? (
                  <item.icon size={item.iconSize ?? 14} />
                ) : undefined
              ) : undefined
            }
            onClick={() => {
              const isSelected = value === itemValue;
              const nextValue = allowDeselect && isSelected ? null : itemValue;
              // Think its fine
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              onChange?.(nextValue!);
            }}
            styles={{
              section: {
                paddingTop: 2,
                marginInlineEnd: 2,
              },
              label: {
                lineHeight: 1,
              },
            }}
          >
            {typeof item === 'string' ? item : item.label}
          </Button>
        );
      })}
    </Button.Group>
  );
}
