import {
  SegmentedControl,
  type SegmentedControlItem,
  type SegmentedControlProps,
} from '@mantine/core';
import type React from 'react';

type LimitedSegmentedData =
  | (string | SegmentedControlItem)[]
  | Readonly<(string | SegmentedControlItem)[]>;

type ExtractSegmentedString<T extends LimitedSegmentedData> = T extends Array<infer U>
  ? U extends SegmentedControlItem
    ? U['value']
    : U
  : never;

type TSegmentedControlProps<TData extends LimitedSegmentedData> = Omit<
  SegmentedControlProps,
  'data' | 'onChange' | 'value' | 'defaultValue'
> & {
  data: TData;
  onChange?: (value: ExtractSegmentedString<TData>) => void;
  value?: ExtractSegmentedString<TData>;
  defaultValue?: ExtractSegmentedString<TData>;
};

export const TSegmentedControl = <TData extends LimitedSegmentedData>(
  props: TSegmentedControlProps<TData>
): React.JSX.Element => {
  const { ...rest } = props;

  // @ts-expect-error: forced generic component like TSelect
  return <SegmentedControl {...rest} />;
};
