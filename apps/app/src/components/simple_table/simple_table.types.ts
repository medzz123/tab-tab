import type {
  MantineColor,
  MantineStyleProp,
  MantineStyleProps,
  StyleProp,
  TableProps,
} from '@mantine/core';
import type { ReactNode } from 'react';

type Leaves<TData> = TData extends object
  ? {
      [TKey in keyof TData]: `${Exclude<TKey, symbol>}${Leaves<TData[TKey]> extends never
        ? ''
        : `.${Leaves<TData[TKey]>}`}`;
    }[keyof TData]
  : never;

type CommonColumnProps<TData, TKey> = {
  key: TKey;
  name?: string | React.ReactNode;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'middle' | 'top';
  minWidth?: string | number;
  maxWidth?: string | number;
  padding?: string | number;
  width?: string | number;
  color?: string;
  fontWeight?: StyleProp<React.CSSProperties['fontWeight']>;
  copy?: boolean;
  expand?: boolean;
  monospace?: boolean;
  formatValue?: (data: TData, index: number) => string | null | number | undefined;
  actions?: (data: TData, index: number) => ReactNode;
};

type Column<TData, TKey> = TKey extends Leaves<TData>
  ? CommonColumnProps<TData, TKey> & {
      render?: (row: TData, index: number) => ReactNode | undefined;
    }
  : CommonColumnProps<TData, TKey> &
      (
        | {
            render: (row: TData, index: number) => ReactNode | undefined; // Required when key is a string not in T
          }
        | {
            formatValue: (data: TData, index: number) => string | null | number | undefined;
          }
      );

export type SimpleTableProps<TData extends Record<string, unknown>> = {
  data?: TData[];
  title?: string;
  maxWidth?: string | number;
  rowHeight?: string | number;
  columns: Column<TData, Leaves<TData> | string>[];
  getRowId?: (row: TData, index: number) => string;
  rowColor?: (row: TData, index: number) => (MantineColor | undefined) | MantineColor;
  rowStyle?: (row: TData, index: number) => MantineStyleProp;
  expandRow?: (row: TData, index: number) => ReactNode;
  onRowClick?: (row: TData, index: number) => void;
  noDataMessage?: string;
  height?: MantineStyleProps['h'];
  maxHeight?: MantineStyleProps['h'];
  hideIfEmpty?: boolean;
  minWidth?: StyleProp<React.CSSProperties['minWidth']>;
  hideHeaders?: boolean;
} & TableProps;
