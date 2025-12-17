import {
  Checkbox,
  type CheckboxProps,
  Chip,
  type ChipProps,
  JsonInput,
  type JsonInputProps,
  MultiSelect,
  type MultiSelectProps,
  NumberInput,
  type NumberInputProps,
  PasswordInput,
  type PasswordInputProps,
  Select,
  type SelectProps,
  Switch,
  type SwitchProps,
  Textarea,
  type TextareaProps,
  TextInput,
  type TextInputProps,
} from '@mantine/core';
import { DatePickerInput, type DatePickerInputProps, DateTimePicker } from '@mantine/dates';
import { startCase } from 'lodash-es';
import type React from 'react';
import { IMaskInput } from 'react-imask';

type InputTypeProps = {
  text: TextInputProps;
  textArea: TextareaProps;
  jsonInput: JsonInputProps;
  number: NumberInputProps;
  select: SelectProps;
  password: PasswordInputProps;
  checkbox: CheckboxProps;
  switch: SwitchProps;
  date: DatePickerInputProps;
  multiSelect: MultiSelectProps;
  dateTime: DatePickerInputProps;
  chip: ChipProps;
};

type FormInputPropsGeneric<T extends keyof InputTypeProps = 'text'> = {
  controller: {
    name: string;
    // biome-ignore lint/suspicious/noExplicitAny: Its fine
    value: any;
    // biome-ignore lint/suspicious/noExplicitAny: Its fine
    onChange: (value: any) => void;
    error?: string;
  };
  inputType?: T;
  loading?: boolean;
  loadingError?: unknown;
  fixedHeight?: boolean;
  cy?: string;
  mask?: string;
  hideLabel?: boolean;
} & (T extends keyof InputTypeProps ? InputTypeProps[T] : never);

type FormInputPropsInfer = {
  [K in keyof InputTypeProps]: FormInputPropsGeneric<K>;
}[keyof InputTypeProps];

export type FormInputProps = Extract<FormInputPropsInfer, { inputType?: keyof InputTypeProps }>;

const inputTypeMapper = {
  // events
  text: TextInput,
  textArea: Textarea,
  jsonInput: JsonInput,

  // current target
  password: PasswordInput,

  // current checked
  checkbox: Checkbox,
  switch: Switch,

  // value
  number: NumberInput,
  select: Select,
  date: DatePickerInput,
  multiSelect: MultiSelect,
  dateTime: DateTimePicker,
  chip: Chip,
};

export const FormInput = (props: FormInputProps): React.JSX.Element => {
  const {
    cy,
    controller: { name, value, onChange, error },
    inputType = 'text',
    mask,
    hideLabel = false,
    ...rest
  } = props;

  const text = startCase(name.split('.')[name.split('.').length - 1]);

  const Input = inputTypeMapper[inputType];

  return (
    <Input
      component={mask ? IMaskInput : undefined}
      mask={mask}
      data-test={name}
      // who knows why it complains
      // @ts-expect-error
      size={inputType === 'chip' ? 'xs' : 'sm'}
      mb={inputType === 'chip' ? undefined : 'sm'}
      radius={inputType === 'chip' ? 'md' : undefined}
      color={inputType === 'chip' ? 'blue' : undefined}
      variant={inputType === 'chip' ? 'light' : undefined}
      label={!hideLabel ? text : undefined}
      error={error}
      data-cy={
        inputType === 'multiSelect' ? undefined : (cy ?? `form-${name.split('.').join('-')}`)
      }
      {...(inputType === 'multiSelect'
        ? {
            comboboxProps: {
              'data-cy': cy ?? `form-${name.split('.').join('-')}`,
            },
          }
        : {})}
      value={inputType === 'date' ? value : value === undefined ? '' : value === null ? '' : value}
      // @ts-expect-error
      // biome-ignore lint/suspicious/noExplicitAny: Its fine
      onChange={(event: any) => {
        let changeValue: string | number | null | string[] = '';

        if (['text', 'textArea'].includes(inputType)) {
          changeValue = event.target.value;
        } else if (['checkbox', 'switch'].includes(inputType)) {
          changeValue = event.currentTarget.checked;
        } else if (inputType === 'password') {
          changeValue = event.currentTarget.value;
        } else if (inputType === 'date') {
          changeValue = event;
        } else if (inputType === 'multiSelect') {
          changeValue = event;
        } else if (inputType === 'dateTime') {
          changeValue = event;
        } else if (inputType === 'chip') {
          changeValue = event;
        } else if (inputType === 'jsonInput') {
          changeValue = event;
        } else if (inputType === 'number') {
          if (event === '' || event === undefined || event === null) {
            changeValue = 0;
          } else if (typeof event === 'number') {
            changeValue = event;
          } else {
            const parsedValue = parseFloat(event);
            changeValue = isNaN(parsedValue) ? 0 : parsedValue;
          }
        } else {
          changeValue = event;
        }

        onChange(changeValue);
      }}
      checked={['checkbox', 'switch', 'chip'].includes(inputType) ? value : undefined}
      {...rest}
    />
  );
};
