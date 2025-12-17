import { ActionIcon, Box, Collapse, Group, Table, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconChevronDown, IconChevronRight, IconMaximize } from '@tabler/icons-react';
import { get } from 'lodash-es';
import type React from 'react';
import { Fragment, useState } from 'react';
import { Copy } from '../copy_button';
import classes from './simple_table.module.css';
import type { SimpleTableProps } from './simple_table.types';

export const SimpleTable = <T extends Record<string, unknown>>(
  props: SimpleTableProps<T>
): React.JSX.Element => {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const {
    data = [],
    columns,
    noDataMessage = 'Nothing found...',
    getRowId,
    rowColor,
    rowStyle,
    height,
    maxHeight,
    rowHeight,
    minWidth,
    hideHeaders = false,
    onRowClick,
    expandRow,
    title,
    ...tableProps
  } = props;

  return (
    <Table.ScrollContainer p={0} minWidth="100%" type="native" h={height} mah={maxHeight}>
      {title && (
        <Text mb="xs" fw="bold" fz="sm">
          {title}
        </Text>
      )}
      <Table pos="relative" highlightOnHover withRowBorders={false} {...tableProps}>
        {!hideHeaders && (
          <Table.Thead h={36} mah={36} bg="gray.0">
            <Table.Tr>
              {expandRow && <Table.Th className={classes.header} h={36} w={15}></Table.Th>}
              {columns.map((column, index) => (
                <Table.Th
                  className={classes.header}
                  miw={minWidth ?? column.minWidth}
                  maw={column.maxWidth}
                  h={36}
                  w={column.width || 'auto'}
                  key={`table-head-th-${String(column.key)}-${index}`}
                >
                  {typeof column.name !== 'string' && column.name !== undefined ? (
                    column.name
                  ) : (
                    <Text
                      tt={column.name ? undefined : 'capitalize'}
                      size="sm"
                      fw={700}
                      ta={column.align || 'left'}
                    >
                      {column.name ||
                        String(
                          column.key.replace(/\.|([A-Z])/g, (_, group1) =>
                            group1 ? ' ' + group1 : ' '
                          )
                        )}
                    </Text>
                  )}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
        )}

        <Table.Tbody>
          {data.map((row, rowIndex) => (
            <Fragment
              key={
                getRowId
                  ? `table-body-row-${getRowId(row, rowIndex)}`
                  : `table-body-row-${rowIndex}`
              }
            >
              <Table.Tr
                h={rowHeight ? rowHeight : undefined}
                bg={typeof rowColor === 'function' ? rowColor(row, rowIndex) : rowColor}
                style={typeof rowStyle === 'function' ? rowStyle(row, rowIndex) : undefined}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {expandRow && (
                  <Table.Td className={classes.cell} style={{ verticalAlign: 'middle' }}>
                    <Group gap="xs" wrap="nowrap">
                      <ActionIcon
                        onClick={() =>
                          setExpandedRows((prev) =>
                            prev.includes(rowIndex)
                              ? prev.filter((index) => index !== rowIndex)
                              : [...prev, rowIndex]
                          )
                        }
                        variant="subtle"
                        size="sm"
                      >
                        {expandedRows.includes(rowIndex) ? (
                          <IconChevronDown />
                        ) : (
                          <IconChevronRight />
                        )}
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                )}
                {columns.map((column, columnIndex) => {
                  const value = get(row, column.key);
                  const renderValue =
                    typeof value === 'string'
                      ? value
                      : value === undefined
                        ? ''
                        : value === null
                          ? ''
                          : JSON.stringify(value);
                  //@ts-expect-error
                  const customRender = column.render?.(row, rowIndex);
                  const actualValue = column.formatValue?.(row, rowIndex) || renderValue;

                  return (
                    <Table.Td
                      miw={minWidth ?? column.minWidth}
                      maw={column.maxWidth}
                      style={{
                        verticalAlign: column.verticalAlign
                          ? column.verticalAlign
                          : rowHeight
                            ? 'top'
                            : 'middle',
                      }}
                      w={column.width || 'auto'}
                      p={column.padding || undefined}
                      className={classes.cell}
                      key={
                        getRowId
                          ? `table-body-row-${rowIndex}-cell-${columnIndex}-${getRowId(
                              row,
                              columnIndex
                            )}`
                          : `table-body-row-${rowIndex}-cell-${columnIndex}`
                      }
                    >
                      <Group
                        gap={4}
                        wrap="nowrap"
                        justify={
                          column.align === 'right'
                            ? 'flex-end'
                            : column.align === 'center'
                              ? 'center'
                              : 'flex-start'
                        }
                      >
                        {customRender || (
                          <Text
                            fz={14}
                            fw={column.fontWeight}
                            c={column.color}
                            ta={column.align || 'left'}
                            ff={column.monospace ? 'monospace' : undefined}
                            title={actualValue ? String(actualValue) : undefined}
                            truncate={!rowHeight}
                          >
                            {actualValue}
                          </Text>
                        )}
                        {actualValue !== '' && (
                          <>
                            {column.copy && <Copy value={String(actualValue)} />}
                            {column.expand && (
                              <ActionIcon
                                color="black"
                                variant="transparent"
                                ml="auto"
                                size="xs"
                                onClick={() => {
                                  modals.open({
                                    withCloseButton: false,
                                    title: column.name,
                                    size: 'auto',
                                    children: (
                                      <Box maw={400}>
                                        <div
                                          style={{
                                            fontSize: 'var(--mantine-font-size-sm)',
                                          }}
                                          dangerouslySetInnerHTML={{
                                            __html: actualValue,
                                          }}
                                        />
                                      </Box>
                                    ),
                                  });
                                }}
                              >
                                <IconMaximize size="1rem" />
                              </ActionIcon>
                            )}
                          </>
                        )}
                        {column.actions?.(row, rowIndex)}
                      </Group>
                    </Table.Td>
                  );
                })}
              </Table.Tr>
              {expandRow && (
                <Table.Tr>
                  <Table.Td colSpan={columns.length + 1} style={{ padding: 0 }}>
                    <Collapse in={expandedRows.includes(rowIndex)}>
                      {data[rowIndex] && expandedRows.includes(rowIndex)
                        ? expandRow(data[rowIndex], rowIndex)
                        : null}
                    </Collapse>
                  </Table.Td>
                </Table.Tr>
              )}
            </Fragment>
          ))}
        </Table.Tbody>
      </Table>
      {data.length === 0 && (
        <Group w="100%" justify="center">
          <Text py={16} mb={16} c="dimmed" ta="center" size="xs">
            {noDataMessage}
          </Text>
        </Group>
      )}
    </Table.ScrollContainer>
  );
};
