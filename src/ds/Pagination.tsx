"use client";

import { Pagination as MantinePagination } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "./icons";
import styles from "./Pagination.module.css";

export const pageSizes = [10, 25, 50] as const;

export type PageSize = (typeof pageSizes)[number];

type PaginationProps = {
  page: number;
  total: number;
  pageSize?: PageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: PageSize) => void;
  range?: string;
};

export function Pagination({
  page,
  total,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  range,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <nav className={styles.root} aria-label="Pagination">
      {range ? <p className={styles.range}>{range}</p> : <span />}
      <div className={styles.sizes}>
        <span className={styles.sizesLabel}>Rows per page</span>
        {pageSizes.map((size) => (
          <button
            key={size}
            type="button"
            className={styles.chip}
            data-active={size === pageSize ? "true" : undefined}
            aria-pressed={size === pageSize}
            onClick={() => onPageSizeChange?.(size)}
          >
            {size}
          </button>
        ))}
      </div>
      <MantinePagination
        total={pageCount}
        value={page}
        onChange={onPageChange}
        withEdges
        siblings={2}
        classNames={{ root: styles.pages, control: styles.control }}
        previousIcon={IconChevronLeft}
        nextIcon={IconChevronRight}
        firstIcon={IconChevronsLeft}
        lastIcon={IconChevronsRight}
        getControlProps={(control) => {
          const labels = {
            first: "First page",
            previous: "Previous page",
            next: "Next page",
            last: "Last page",
          };
          return { "aria-label": labels[control] };
        }}
      />
    </nav>
  );
}
