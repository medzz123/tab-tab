import { type ComboboxItem, MultiSelect, type MultiSelectProps } from '@mantine/core';
import React from 'react';

type DataItem = string | (ComboboxItem & Record<string, unknown>);
type LimitedData = readonly DataItem[];

type ExtractStringValues<T extends LimitedData> = T[number] extends infer U
  ? U extends ComboboxItem
    ? U['value']
    : U extends string
      ? U
      : never
  : never;

type TMultiSelectProps<DataType extends LimitedData> = Omit<
  MultiSelectProps,
  'data' | 'onChange' | 'value' | 'defaultValue' | 'renderOption'
> & {
  data: DataType;
  onChange: (value: ExtractStringValues<DataType>[]) => void;
  value?: ExtractStringValues<DataType>[];
  defaultValue?: ExtractStringValues<DataType>[];
  renderOption?: (item: DataType[number]) => React.ReactNode;
};

export const TMultiSelect = <TData extends LimitedData>(
  props: TMultiSelectProps<TData>
): React.JSX.Element => {
  const { data, renderOption, ...rest } = props;

  const itemByValue = React.useMemo(() => {
    const map = new Map<string, TData[number]>();
    for (const item of data) {
      if (typeof item === 'string') map.set(item, item);
      else map.set(item.value, item);
    }
    return map;
  }, [data]);

  const mantineRenderOption: MultiSelectProps['renderOption'] | undefined = renderOption
    ? ({ option }) => {
        const item = itemByValue.get(option.value);
        if (item !== undefined) return renderOption(item);
        return option.label ?? option.value;
      }
    : undefined;

  // @ts-expect-error
  return <MultiSelect {...rest} data={data} renderOption={mantineRenderOption} />;
};
