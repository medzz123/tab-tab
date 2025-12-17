import {
  Box,
  CheckIcon,
  Combobox,
  type ComboboxItem,
  Group,
  Pill,
  PillsInput,
  type PillsInputProps,
  useCombobox,
} from '@mantine/core';
import React from 'react';

type CreatableItem = string | (Pick<ComboboxItem, 'value' | 'label'> & Record<string, unknown>);
type CreatableData = readonly CreatableItem[];

type TMultiSelectCreatableProps<TData extends CreatableData> = {
  label?: string;
  description?: string;
  data: TData;
  value: string[];
  onChange: (value: string[]) => void;

  placeholder?: string;
  withinPortal?: boolean;

  renderOption?: (item: TData[number]) => React.ReactNode;

  onCreate?: (value: string) => Exclude<TData[number], string>;
} & Omit<PillsInputProps, 'onChange'>;

export const TMultiSelectCreatable = <TData extends CreatableData>(
  props: TMultiSelectCreatableProps<TData>
): React.JSX.Element => {
  const {
    data,
    value,
    onChange,
    placeholder,
    withinPortal,
    renderOption,
    onCreate,
    label,
    description,
    ...rest
  } = props;

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });

  const [search, setSearch] = React.useState('');

  const itemByValue = React.useMemo(() => {
    const map = new Map<string, TData[number]>();
    for (const item of data) {
      if (typeof item === 'string') map.set(item, item);
      else map.set(item.value, item);
    }
    return map;
  }, [data]);

  const normalizedData = React.useMemo(() => {
    const out: Array<Pick<ComboboxItem, 'value' | 'label'>> = [];
    for (const item of data) {
      if (typeof item === 'string') out.push({ value: item, label: item });
      else out.push({ value: item.value, label: item.label });
    }
    return out;
  }, [data]);

  const exactOptionMatch = React.useMemo(() => {
    const s = search.trim();
    if (!s) return true;
    for (const item of normalizedData) if (item.value === s) return true;
    return false;
  }, [normalizedData, search]);

  const handleValueSelect = (val: string) => {
    setSearch('');

    if (val === '$create') {
      const s = search.trim();
      if (!s) return;
      if (!onCreate) return;

      const created = onCreate(s);
      const createdValue = created.value;

      onChange(value.includes(createdValue) ? value : [...value, createdValue]);
      return;
    }

    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  };

  const handleValueRemove = (val: string) => onChange(value.filter((v) => v !== val));

  const values = value.map((v) => {
    const item = itemByValue.get(v);
    const label =
      item === undefined ? v : typeof item === 'string' ? item : (item.label ?? item.value);

    return (
      <Pill key={v} withRemoveButton onRemove={() => handleValueRemove(v)}>
        {label}
      </Pill>
    );
  });

  const options = normalizedData
    .filter((item) => item.label.toLowerCase().includes(search.trim().toLowerCase()))
    .map((item) => {
      const raw = itemByValue.get(item.value);
      const content =
        renderOption && raw !== undefined ? renderOption(raw) : <span>{item.label}</span>;

      return (
        <Combobox.Option value={item.value} key={item.value} active={value.includes(item.value)}>
          <Group gap="sm" w="100%">
            {content}
            {value.includes(item.value) ? (
              <Box ml="auto">
                <CheckIcon size={12} />
              </Box>
            ) : null}
          </Group>
        </Combobox.Option>
      );
    });

  const canCreate = Boolean(onCreate) && !exactOptionMatch && search.trim().length > 0;

  return (
    <Combobox store={combobox} onOptionSubmit={handleValueSelect} withinPortal={withinPortal}>
      <Combobox.DropdownTarget>
        <PillsInput
          label={label}
          description={description}
          onClick={() => combobox.openDropdown()}
          {...rest}
        >
          <Pill.Group>
            {values}

            <Combobox.EventsTarget>
              <PillsInput.Field
                onFocus={() => combobox.openDropdown()}
                onBlur={() => combobox.closeDropdown()}
                value={search}
                placeholder={placeholder}
                onChange={(event) => {
                  combobox.updateSelectedOptionIndex();
                  setSearch(event.currentTarget.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' && search.length === 0 && value.length > 0) {
                    event.preventDefault();
                    const last = value[value.length - 1];
                    if (last) onChange(value.filter((v) => v !== last));
                    return;
                  }

                  if (event.key !== 'Enter') return;
                  if (!onCreate) return;

                  const s = search.trim();
                  if (s.length === 0) return;

                  const exists = data.some((item) =>
                    typeof item === 'string' ? item === s : item.value === s
                  );
                  if (exists) return;

                  event.preventDefault();
                  event.stopPropagation();

                  const created = onCreate(s);
                  onChange(value.includes(created.value) ? value : [...value, created.value]);
                  setSearch('');
                }}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options}

          {canCreate && <Combobox.Option value="$create">+ Create {search.trim()}</Combobox.Option>}

          {!canCreate && search.trim().length > 0 && options.length === 0 && (
            <Combobox.Empty>Nothing found</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};
