import {
  ActionIcon,
  Alert,
  Badge,
  Checkbox,
  type MantineThemeOverride,
  Modal,
  MultiSelect,
  SegmentedControl,
  Select,
  Switch,
  Tabs,
  Text,
} from '@mantine/core';

export const theme: MantineThemeOverride = {
  primaryColor: 'blue',
  colors: {
    error: [
      '#ffe9dd',
      '#ffc4af',
      '#ff9e7e',
      '#ff784c',
      '#FF6633',
      '#e63900',
      '#b42c00',
      '#811e00',
      '#4f1000',
      '#210200',
    ],
    rowHighlight: ['rgba(255, 243, 191, 0.3)', '', '', '', '', '', '', '', '', ''],
    white: [
      '#ffffff',
      '#f9fafb',
      '#f8f8f9',
      '#f6f6f6',
      '#f5f6f7',
      '#f3f4f6',
      '#F4F4F4',
      '#f2f3f5',
      '#E9ECEF',
      '#e0e0e0',
    ],
    black: [
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#00112E',
    ],
    shadows: [
      'rgba(149, 157, 165, 0.05)',
      'rgba(146, 154, 162, 0.1)',
      'rgba(143, 151, 159, 0.15)',
      'rgba(140, 148, 156, 0.2)',
      'rgba(137, 145, 153, 0.25)',
      'rgba(134, 142, 150, 0.3)',
      'rgba(131, 139, 147, 0.35)',
      'rgba(128, 136, 144, 0.4)',
      'rgba(125, 133, 141, 0.45)',
      'rgba(122, 130, 138, 0.5)',
    ],
  },
  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '92em',
  },
  primaryShade: 5,
  shadows: {
    md: '1px 1px 3px rgba(0, 0, 0, .025)',
    xl: '5px 5px 3px rgba(0, 0, 0, .025)',
  },
  headings: {
    fontFamily: 'Roboto, sans-serif',
    sizes: {
      h1: { fontSize: '2rem' },
    },
  },
  cursorType: 'pointer',
  components: {
    SegmentedControl: SegmentedControl.extend({
      defaultProps: {
        color: 'blue',
      },
    }),
    Checkbox: Checkbox.extend({
      defaultProps: {
        labelPosition: 'left',
      },
    }),
    Switch: Switch.extend({
      defaultProps: {
        labelPosition: 'left',
      },
    }),
    MultiSelect: MultiSelect.extend({
      defaultProps: {
        searchable: true,
        checkIconPosition: 'right',
      },
    }),
    Modal: Modal.extend({
      defaultProps: {
        centered: true,
      },
    }),
    Text: Text.extend({
      defaultProps: {
        fz: 'sm',
      },
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        variant: 'light',
        size: 'xs',
        style: {},
      },
    }),
    Select: Select.extend({
      defaultProps: {
        allowDeselect: false,
        checkIconPosition: 'right',
        searchable: true,
      },
    }),
    ModalCloseButton: Modal.extend({
      defaultProps: {
        'data-cy': 'modal-close',
      },
    }),
    Alert: Alert.extend({
      styles: {
        root: {
          borderRadius: 12,
        },
      },
    }),
    Tabs: Tabs.extend({
      defaultProps: {
        keepMounted: false,
        variant: 'pills',
      },
      styles: {
        root: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        },
        panel: {
          flexGrow: 1,
        },
      },
    }),
    Badge: Badge.extend({
      defaultProps: {
        size: 'xs',
        radius: 'sm',
      },
    }),
  },
};
