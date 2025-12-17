import { type ComboboxItem, Select, type SelectProps } from '@mantine/core';
import type React from 'react';

type LimitedData = (string | ComboboxItem)[] | Readonly<(string | ComboboxItem)[]>;

type ExtractStringValues<T extends LimitedData> = T extends Array<infer U>
  ? U extends ComboboxItem
    ? U['value']
    : U
  : never;

type TSelectProps<DataType extends LimitedData> = Omit<
  SelectProps,
  'data' | 'onChange' | 'value' | 'defaultValue'
> & {
  data: DataType;
  onChange: (value: ExtractStringValues<DataType> | null) => void;
  value?: ExtractStringValues<DataType> | undefined;
  defaultValue?: ExtractStringValues<DataType>;
};

export const TSelect = <TData extends LimitedData>(
  props: TSelectProps<TData>
): React.JSX.Element => {
  const { ...rest } = props;

  // @ts-expect-error We are forcing types here to make it a typed component
  return <Select {...rest} />;
};
