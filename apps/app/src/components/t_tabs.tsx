import {
  Tabs,
  type TabsListProps,
  type TabsPanelProps,
  type TabsProps,
  type TabsTabProps,
} from '@mantine/core';
import type { Icon, IconProps } from '@tabler/icons-react';
import type React from 'react';

export type TabConfig<TValue extends string = string> = {
  value: TValue;
  enabled?: boolean;
  tabLabel: React.ReactNode;
  panelContent?: React.ReactNode;
  tabProps?: Omit<TabsTabProps, 'value' | 'children'>;
  panelProps?: Omit<TabsPanelProps, 'value' | 'children'>;
  icon?: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>;
  iconSize?: number;
};

type ExtractTabValues<T extends ReadonlyArray<{ value: string }>> = T[number]['value'];

export type TypedTabsProps<TTabsConfig extends ReadonlyArray<TabConfig<string>>> = Omit<
  TabsProps,
  'value' | 'defaultValue' | 'onChange' | 'children'
> & {
  tabs: TTabsConfig;
  value?: ExtractTabValues<TTabsConfig> | null;
  defaultValue?: ExtractTabValues<TTabsConfig> | null; // Uncontrolled default active tab. Can be null.
  onChange?: (value: ExtractTabValues<TTabsConfig> | null) => void; // Callback for tab change. Receives null if a tab is deactivated.
  listProps?: TabsListProps; // Optional props for the Tabs.List component
};

export const TypedTabs = <
  // Comment to keep syntax happy
  const TTabsConfig extends ReadonlyArray<TabConfig<string>>,
>(
  props: TypedTabsProps<TTabsConfig>
): React.JSX.Element => {
  const { tabs, value, defaultValue, onChange, listProps, ...restTabsProps } = props;

  const handleTabChange = (newValue: string | null) => {
    if (onChange) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      onChange(newValue as ExtractTabValues<TTabsConfig> | null);
    }
  };

  return (
    <Tabs
      value={value}
      defaultValue={defaultValue}
      onChange={onChange ? handleTabChange : undefined}
      {...restTabsProps}
    >
      <Tabs.List {...listProps}>
        {tabs
          .filter((tab) => (tab.enabled === undefined ? true : tab.enabled))
          .map((tab) => (
            <Tabs.Tab
              key={tab.value}
              value={tab.value}
              leftSection={tab.icon ? <tab.icon size={tab.iconSize ?? 16} /> : undefined}
              {...tab.tabProps}
            >
              {tab.tabLabel}
            </Tabs.Tab>
          ))}
      </Tabs.List>

      {tabs.map((tab) => (
        <Tabs.Panel key={tab.value} value={tab.value} {...tab.panelProps}>
          {tab.panelContent}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
};
