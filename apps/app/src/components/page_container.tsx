import { Box, type BoxProps } from '@mantine/core';

type PageContainerProps = {
  children: React.ReactNode;
  header?: React.ReactNode;
  headerPadded?: boolean;
  headerProps?: BoxProps;
  padded?: boolean;
} & BoxProps;

export const PageContainer: React.FC<PageContainerProps> = (props) => {
  const { children, header, headerProps, headerPadded = true, padded = true, ...rest } = props;

  return (
    <Box
      h="100%"
      w="100%"
      className="print-page-container"
      {...rest}
      style={{
        borderRadius: 4,
        backgroundColor: 'var(--mantine-color-gray-0)',
        border: '0.5px solid lch(86.22 0 282.863)',
        boxShadow: 'lch(0 0 0 / 0.022) 0px 3px 6px -2px, lch(0 0 0 / 0.044) 0px 1px 1px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        overflow: 'hidden',
        ...rest.style,
      }}
    >
      {header && (
        <Box style={{ flexShrink: 0, padding: headerPadded ? '16px 16px 0' : 0 }} {...headerProps}>
          {header}
        </Box>
      )}
      <Box style={{ flex: 1, overflow: 'auto', padding: padded ? 16 : 0 }}>{children}</Box>
    </Box>
  );
};
