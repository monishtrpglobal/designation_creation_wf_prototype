"use client";

import { AppFrame } from "@/ds/AppFrame";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Dialog } from "@/ds/Dialog";
import { IconAlertCircle, IconAlertTriangle, IconCircleCheck, IconClock, IconUserCircle } from "@/ds/icons";
import { Link } from "@/ds/Link";
import { Pagination, type PageSize } from "@/ds/Pagination";
import { RowMenu } from "@/ds/RowMenu";
import { Table, type SortState, type TableColumn } from "@/ds/Table";
import { Tabs } from "@/ds/Tabs";
import { TextField } from "@/ds/TextField";
import { useFlowStore } from "@/state/flowStore";
import type { DesignationRuntime } from "@/state/model";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  catalogueFilters,
  formatLakhs,
  formatUpdated,
  licenceCell,
  licenceRank,
  matchesFilter,
  rowAction,
  savingLakhs,
  savingText,
  sodCell,
  sodRank,
  statusBadgeVariant,
  statusNote,
  type CatalogueFilter,
} from "./catalogueView";

const searchWidth = "calc(var(--space-s96) * 3 + var(--space-s32))";

function SummaryCard({
  icon,
  title,
  value,
  detail,
  border,
  wash,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
  border: string;
  wash: string;
}) {
  return (
    <article
      className="flex min-w-0 flex-1 flex-col gap-s8 rounded-s12 border border-solid p-s16"
      style={{ borderColor: border, backgroundImage: `linear-gradient(154deg, ${wash}, var(--color-bg-surface-white))` }}
    >
      <span
        className="inline-flex items-center justify-center rounded-s10 bg-surface-white"
        style={{ width: "calc(var(--space-s32) + var(--space-s2))", height: "calc(var(--space-s32) + var(--space-s2))" }}
      >
        {icon}
      </span>
      <p className="text-body-b4 text-body" style={{ fontFamily: "var(--font-family-body-b4)" }}>
        {title}
      </p>
      <p className="text-heading-h2 text-body" style={{ fontFamily: "var(--font-family-heading-h2)" }}>
        {value}
      </p>
      <p className="text-control-sm text-body" style={{ fontFamily: "var(--font-family-control-sm)" }}>
        {detail}
      </p>
    </article>
  );
}

function Stack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col items-start gap-s4">{children}</div>;
}

function Dash() {
  return <span aria-label="None">—</span>;
}

export function CataloguePage() {
  const router = useRouter();
  const hydrated = useFlowStore((state) => state.hydrated);
  const designations = useFlowStore((state) => state.designations);
  const deleteDesignation = useFlowStore((state) => state.deleteDesignation);
  const reopenDesignation = useFlowStore((state) => state.reopenDesignation);
  const [filter, setFilter] = useState<CatalogueFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState | null>({ key: "updatedAt", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [pendingDelete, setPendingDelete] = useState<DesignationRuntime | null>(null);

  const counts = useMemo(() => {
    const tally = new Map<CatalogueFilter, number>();
    for (const item of catalogueFilters) {
      tally.set(item.value, designations.filter((row) => matchesFilter(row, item.value)).length);
    }
    return tally;
  }, [designations]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = designations.filter((item) => {
      if (!matchesFilter(item, filter)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return (
        item.name.toLowerCase().includes(needle) || item.businessArea.toLowerCase().includes(needle)
      );
    });
    if (!sort) {
      return rows;
    }
    const direction = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((left, right) => direction * compare(left, right, sort.key));
  }, [designations, filter, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const awaitingFinal = designations.filter((item) => item.status === "Awaiting final approval").length;
  const failed = designations.filter((item) => item.status === "Analysis failed").length;
  const openSod = designations.filter((item) => {
    const summary = item.sodSummary;
    return summary ? summary.high + summary.medium + summary.low > 0 : false;
  }).length;
  const pendingSaving = designations
    .filter((item) => item.status !== "Published" && item.status !== "Rejected")
    .reduce((sum, item) => sum + savingLakhs(item), 0);

  const columns: TableColumn<DesignationRuntime>[] = [
    {
      key: "no",
      label: "No",
      width: "var(--space-s64)",
      render: (row) => filtered.indexOf(row) + 1,
    },
    {
      key: "name",
      label: "Designation",
      sortable: true,
      render: (row) => row.name,
    },
    {
      key: "department",
      label: "Department",
      sortable: true,
      render: (row) => row.businessArea || <Dash />,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <Stack>
          <Badge variant={statusBadgeVariant(row.status)}>{row.status}</Badge>
          {statusNote(row) ? (
            <span className="text-control-sm text-body" style={{ fontFamily: "var(--font-family-control-sm)" }}>
              {statusNote(row)}
            </span>
          ) : null}
        </Stack>
      ),
    },
    {
      key: "license",
      label: "License / status",
      sortable: true,
      render: (row) => {
        const cell = licenceCell(row);
        if (cell.badges.length === 0) {
          return <Dash />;
        }
        return (
          <Stack>
            <span className="flex flex-wrap items-center gap-s4">
              {cell.badges.map((badge) => (
                <Badge key={badge.label} variant={badge.variant}>
                  {badge.label}
                </Badge>
              ))}
            </span>
            {cell.note ? (
              <span className="text-control-sm text-body" style={{ fontFamily: "var(--font-family-control-sm)" }}>
                {cell.note}
              </span>
            ) : null}
          </Stack>
        );
      },
    },
    {
      key: "saving",
      label: "Saving",
      sortable: true,
      render: (row) => {
        const saving = savingText(row);
        if (!saving) {
          return <Dash />;
        }
        return (
          <span className="text-body-b4 text-success-text" style={{ fontFamily: "var(--font-family-body-b4)" }}>
            {saving}
          </span>
        );
      },
    },
    {
      key: "sod",
      label: "SoD risk",
      sortable: true,
      render: (row) => {
        const cell = sodCell(row);
        if (!cell) {
          return <Dash />;
        }
        return <Badge variant={cell.variant}>{cell.label}</Badge>;
      },
    },
    {
      key: "updatedAt",
      label: "Last updated",
      sortable: true,
      render: (row) => formatUpdated(row.updatedAt),
    },
    {
      key: "actions",
      label: "Actions",
      width: "calc(var(--space-s80) * 2)",
      render: (row) => {
        const action = rowAction(row);
        return (
          <span className="flex items-center gap-s8" onClick={(event) => event.stopPropagation()}>
            <Link
              href={action.href}
              onClick={(event) => {
                if (action.label !== "Reopen") {
                  return;
                }
                event.preventDefault();
                reopenDesignation(row.id);
                router.push(action.href);
              }}
            >
              {action.label}
            </Link>
            {row.status === "Draft" ? (
              <RowMenu
                label={`Actions for ${row.name}`}
                items={[{ label: "Delete draft", onClick: () => setPendingDelete(row) }]}
              />
            ) : null}
          </span>
        );
      },
    },
  ];

  if (!hydrated) {
    return (
      <AppFrame>
        <main className="p-s24">
          <p className="text-body-b4 text-body" style={{ fontFamily: "var(--font-family-body-b4)" }}>
            Loading
          </p>
        </main>
      </AppFrame>
    );
  }

  return (
    <AppFrame>
    <main className="bg-surface-white p-s24">
      <section className="flex flex-col gap-s24 rounded-s12 border border-solid border-subtle px-s40 py-s32">
        <header className="flex items-center justify-between gap-s16">
          <div className="flex flex-col gap-s10">
            <h1
              className="text-heading-h2"
              style={{ fontFamily: "var(--font-family-heading-h2)", color: "var(--color-in-progress-text)" }}
            >
              Designation catalogue
            </h1>
            <p className="text-body-b4 text-body" style={{ fontFamily: "var(--font-family-body-b4)" }}>
              Create and manage the designations your organisation uses.
            </p>
          </div>
          {designations.length > 0 ? (
            <Button variant="primary" size="md" onClick={() => router.push("/designation/new")}>
              Create a New Designation
            </Button>
          ) : null}
        </header>

        {designations.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-s16 rounded-s12 border border-dashed px-s24 py-s48 text-center"
            style={{
              minHeight: "calc(var(--space-s96) * 4)",
              borderColor: "var(--color-gray-3)",
            }}
          >
            <IconUserCircle size="s32" style={iconStyle("var(--color-text-body)")} />
            <div className="flex flex-col items-center gap-s8" style={{ maxWidth: "calc(var(--space-s96) * 5)" }}>
              <p
                className="text-strong"
                style={{
                  fontFamily: "var(--font-family-body-b4)",
                  fontSize: "var(--font-size-l2)",
                  fontWeight: "var(--font-weight-body-b3)",
                  lineHeight: "var(--font-line-height-label-l1)",
                }}
              >
                Create your first designation
              </p>
              <p
                className="text-body"
                style={{
                  fontFamily: "var(--font-family-body-b4)",
                  fontSize: "var(--font-size-l2)",
                  fontWeight: "var(--font-weight-body-b4)",
                  lineHeight: "var(--font-line-height-label-l1)",
                }}
              >
                A designation groups the business activities and roles a
                <br />
                position needs. Start with one and we&apos;ll guide you
                <br />
                through it.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => router.push("/designation/new")}>
              Create a New Designation
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-stretch gap-s8">
              <SummaryCard
                icon={<IconClock size="s20" style={iconStyle("var(--color-info-text)")} />}
                title="Awaiting final approval"
                value={String(awaitingFinal)}
                detail="Admin approval needed"
                border="var(--color-info-border-subtle)"
                wash="var(--color-info-bg)"
              />
              <SummaryCard
                icon={<IconCircleCheck size="s20" style={iconStyle("var(--color-success-text)")} />}
                title="Projected annual saving (pending)"
                value={formatLakhs(pendingSaving)}
                detail="Sample figure, pending approval"
                border="var(--color-success-border-subtle)"
                wash="var(--color-success-bg)"
              />
              <SummaryCard
                icon={<IconAlertTriangle size="s20" style={iconStyle("var(--color-warning-text)")} />}
                title="Designations with open SoD risk"
                value={String(openSod)}
                detail="Review before approval"
                border="var(--color-warning-border-subtle)"
                wash="var(--color-warning-bg)"
              />
              <SummaryCard
                icon={<IconAlertCircle size="s20" style={iconStyle("var(--color-error-text)")} />}
                title="Analysis failed"
                value={String(failed)}
                detail="Re-run by technical user"
                border="var(--color-error-border-subtle)"
                wash="var(--color-error-bg)"
              />
            </div>

            <div className="flex items-start justify-between gap-s16">
              <div className="min-w-0 flex-1">
                <Tabs
                  variant="pill"
                  value={filter}
                  onChange={(value) => {
                    setFilter((value as CatalogueFilter) ?? "all");
                    setPage(1);
                  }}
                  items={catalogueFilters.map((item) => ({
                    value: item.value,
                    label: item.label,
                    count: (
                      <Badge size="sm" variant="light">
                        {counts.get(item.value) ?? 0}
                      </Badge>
                    ),
                  }))}
                />
              </div>
              <div style={{ width: searchWidth }} className="shrink-0">
                <TextField
                  type="search"
                  placeholder="Search designations"
                  value={query}
                  onChange={(value) => {
                    setQuery(value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="text-body-b4 text-body" style={{ fontFamily: "var(--font-family-body-b4)" }}>
                No designations match your search.
              </p>
            ) : (
              <div className="w-full overflow-x-auto">
                <Table columns={columns} rows={visible} getRowKey={(row) => row.id} sort={sort} onSortChange={setSort} />
              </div>
            )}

            <Pagination
              page={safePage}
              total={filtered.length}
              pageSize={pageSize}
              pageSizeLabel="Designations per page"
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        )}
      </section>

      <Dialog
        opened={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        size="sm"
        header={
          <h2 className="text-heading-h2 text-body" style={{ fontFamily: "var(--font-family-heading-h2)" }}>
            {`Delete draft "${pendingDelete?.name ?? ""}"?`}
          </h2>
        }
        footer={
          <div className="flex items-center justify-end gap-s12">
            <Button variant="secondary" size="md" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="warn"
              size="md"
              onClick={() => {
                if (pendingDelete) {
                  deleteDesignation(pendingDelete.id);
                }
                setPendingDelete(null);
              }}
            >
              Delete draft
            </Button>
          </div>
        }
      >
        <p className="text-body-b4 text-body" style={{ fontFamily: "var(--font-family-body-b4)" }}>
          This removes the draft and everything you&apos;ve set up so far. It can&apos;t be undone. No roles have been
          created in SAP.
        </p>
      </Dialog>
    </main>
    </AppFrame>
  );
}

function iconStyle(color: string): CSSProperties {
  return { color };
}

function compare(left: DesignationRuntime, right: DesignationRuntime, key: string): number {
  switch (key) {
    case "name":
      return left.name.localeCompare(right.name);
    case "department":
      return left.businessArea.localeCompare(right.businessArea);
    case "status":
      return left.status.localeCompare(right.status);
    case "license":
      return licenceRank(left) - licenceRank(right);
    case "saving":
      return savingLakhs(left) - savingLakhs(right);
    case "sod":
      return sodRank(left) - sodRank(right);
    case "updatedAt":
      return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
    default:
      return 0;
  }
}
