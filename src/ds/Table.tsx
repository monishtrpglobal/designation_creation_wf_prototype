"use client";

import { Table as MantineTable } from "@mantine/core";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { IconArrowsSort, IconSortAscending, IconSortDescending } from "./icons";
import styles from "./Table.module.css";

export type SortDirection = "asc" | "desc";

export type SortState = {
  key: string;
  direction: SortDirection;
};

export type TableColumn<Row> = {
  key: string;
  label: ReactNode;
  sortable?: boolean;
  width?: string;
  render?: (row: Row) => ReactNode;
};

type TableProps<Row> = {
  columns: TableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  onRowClick?: (row: Row) => void;
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  minWidth?: string;
  highlightedKey?: string;
  density?: "default" | "compact";
};

function nextSort(current: SortState | null, key: string): SortState | null {
  if (!current || current.key !== key) {
    return { key, direction: "asc" };
  }
  if (current.direction === "asc") {
    return { key, direction: "desc" };
  }
  return null;
}

function ariaSort(direction: SortDirection | "idle" | "off"): "none" | "ascending" | "descending" | undefined {
  if (direction === "off") {
    return undefined;
  }
  if (direction === "asc") {
    return "ascending";
  }
  if (direction === "desc") {
    return "descending";
  }
  return "none";
}

export function Table<Row>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  sort,
  onSortChange,
  minWidth,
  highlightedKey,
  density = "default",
}: TableProps<Row>) {
  const [uncontrolled, setUncontrolled] = useState<SortState | null>(null);
  const active = sort !== undefined ? sort : uncontrolled;

  function changeSort(key: string) {
    const next = nextSort(active, key);
    if (sort === undefined) {
      setUncontrolled(next);
    }
    onSortChange?.(next);
  }

  function onRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, row: Row) {
    if (!onRowClick) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(row);
    }
  }

  return (
    <MantineTable
      className={styles.table}
      data-fit={density === "compact" ? "true" : undefined}
      data-density={density}
      style={minWidth ? { minWidth } : undefined}
    >
      <MantineTable.Thead>
        <MantineTable.Tr>
          {columns.map((column) => {
            const direction = !column.sortable ? "off" : active?.key === column.key ? active.direction : "idle";
            return (
              <MantineTable.Th
                key={column.key}
                className={styles.headerCell}
                data-sort={direction}
                aria-sort={ariaSort(direction)}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.sortable ? (
                  <button type="button" className={styles.sortButton} onClick={() => changeSort(column.key)}>
                    <span className={styles.sortLabel}>{column.label}</span>
                    {direction === "asc" ? (
                      <IconSortAscending size="s14" className={styles.sortIcon} />
                    ) : direction === "desc" ? (
                      <IconSortDescending size="s14" className={styles.sortIcon} />
                    ) : (
                      <IconArrowsSort size="s14" className={styles.sortIcon} />
                    )}
                  </button>
                ) : (
                  <span className={styles.plainLabel}>{column.label}</span>
                )}
              </MantineTable.Th>
            );
          })}
        </MantineTable.Tr>
      </MantineTable.Thead>
      <MantineTable.Tbody>
        {rows.map((row) => (
          <MantineTable.Tr
            key={getRowKey(row)}
            className={styles.row}
            data-highlighted={highlightedKey !== undefined && highlightedKey === getRowKey(row) ? "true" : undefined}
            data-clickable={onRowClick ? "true" : "false"}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={(event) => onRowKeyDown(event, row)}
            tabIndex={onRowClick ? 0 : undefined}
          >
            {columns.map((column) => (
              <MantineTable.Td key={column.key} className={styles.cell}>
                {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "")}
              </MantineTable.Td>
            ))}
          </MantineTable.Tr>
        ))}
      </MantineTable.Tbody>
    </MantineTable>
  );
}
