"use client";

import { Alert } from "@/ds/Alert";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Drawer } from "@/ds/Drawer";
import { DrawerFooterSummary } from "@/ds/DrawerFooterSummary";
import { IconClose } from "@/ds/icons";
import { Link } from "@/ds/Link";
import { StepCard } from "@/ds/StepCard";
import { Table, type SortState } from "@/ds/Table";
import { Tabs } from "@/ds/Tabs";
import { TextArea } from "@/ds/TextArea";
import type { LicenseMixSegment, LicenseRoleLine } from "@/mock";
import type { DesignationRuntime } from "@/state/model";
import { useFlowStore } from "@/state/flowStore";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { FinalApprovalDialog } from "@/features/designation/approve/FinalApprovalDialog";
import { SodDetailsDrawer } from "./SodDetailsDrawer";
import {
  changeStateLabel,
  compareRoles,
  filterRoles,
  licenseReportFor,
  licenseRoleFilters,
  roleCounts,
  sodFooter,
  type LicenseRoleFilter,
} from "./licenseReportView";

const bodyText: CSSProperties = {
  fontFamily: "var(--font-family-lato-regular)",
  fontSize: "var(--font-size-l2)",
  fontWeight: "var(--font-weight-body-b4)",
  lineHeight: "var(--font-line-height-label-l1)",
};

const captionText: CSSProperties = {
  fontFamily: "var(--font-family-control-sm)",
  fontSize: "var(--font-size-control-sm)",
  fontWeight: "var(--font-weight-control-sm)",
  lineHeight: "var(--font-line-height-control-sm)",
};

const mixTone: Record<LicenseMixSegment["key"], { background: string; color: string }> = {
  professional: { background: "var(--color-info-bg)", color: "var(--color-info-text)" },
  limited: { background: "var(--color-success-bg)", color: "var(--color-success-text)" },
  other: { background: "var(--color-neutral-bg)", color: "var(--color-neutral-text)" },
};

const rejectError = "Enter a comment to reject";

type LicenseReportDrawerProps = {
  designation: DesignationRuntime | null;
  onClose: () => void;
  onFinished: (result: "published" | "rejected") => void;
};

export function LicenseReportDrawer({ designation, onClose, onFinished }: LicenseReportDrawerProps) {
  const rejectFinal = useFlowStore((state) => state.rejectFinal);
  const report = designation ? licenseReportFor(designation) : null;
  const [filter, setFilter] = useState<LicenseRoleFilter>("all");
  const [sort, setSort] = useState<SortState | null>(null);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState<string | undefined>(undefined);
  const [rangeLabel, setRangeLabel] = useState("Showing 0 of 0");
  const [sodOpen, setSodOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => roleCounts(report?.roles ?? []), [report]);
  const rows = useMemo(() => {
    const filtered = filterRoles(report?.roles ?? [], filter);
    if (!sort) {
      return filtered;
    }
    const direction = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((left, right) => direction * compareRoles(left, right, sort.key));
  }, [report, filter, sort]);

  useEffect(() => {
    setFilter("all");
    setSort(null);
    setComment("");
    setCommentError(undefined);
    setSodOpen(false);
    setApprovalOpen(false);
  }, [designation?.id]);

  useEffect(() => {
    let frame = 0;
    let attempts = 0;
    function measure() {
      const node = tableRef.current;
      const ready = node !== null && node.querySelectorAll("tbody tr").length === rows.length;
      if (!node || !ready) {
        if (attempts < 8) {
          attempts += 1;
          frame = window.requestAnimationFrame(measure);
        }
        return;
      }
      node.scrollTop = 0;
      updateRange(node);
    }
    frame = window.requestAnimationFrame(measure);
    return () => window.cancelAnimationFrame(frame);
  }, [rows]);

  function updateRange(node: HTMLDivElement) {
    const bodyRows = [...node.querySelectorAll<HTMLElement>("tbody tr")];
    if (bodyRows.length === 0) {
      setRangeLabel("Showing 0 of 0");
      return;
    }
    const box = node.getBoundingClientRect();
    let first = 0;
    let last = 0;
    bodyRows.forEach((row, index) => {
      const rowBox = row.getBoundingClientRect();
      const middle = rowBox.top + rowBox.height / 2;
      if (middle >= box.top && middle <= box.bottom) {
        if (first === 0) {
          first = index + 1;
        }
        last = index + 1;
      }
    });
    if (first === 0) {
      setRangeLabel(`Showing 0 of ${bodyRows.length}`);
      return;
    }
    setRangeLabel(`Showing ${first}-${last} of ${bodyRows.length}`);
  }

  function reject() {
    if (!designation) {
      return;
    }
    if (comment.trim().length === 0) {
      setCommentError(rejectError);
      document.getElementById("license-reject-comment")?.focus();
      return;
    }
    const saved = rejectFinal(designation.id, comment);
    if (saved) {
      onFinished("rejected");
    }
  }

  const footer = designation ? sodFooter(designation.sodSummary) : { status: "secondary" as const, label: "" };
  const maxCost = Math.max(report?.beforeLakhs ?? 0, report?.afterLakhs ?? 0, 1);

  return (
    <>
      <Drawer
        opened={designation !== null && report !== null}
        onClose={onClose}
        size="xl"
        header={
          designation && report ? (
            <div className="flex w-full flex-col gap-s8">
              <div className="flex w-full items-start justify-between gap-s12">
                <h2
                  className="m-0 min-w-0 flex-1 text-heading-h2 text-strong"
                  style={{ fontFamily: "var(--font-family-heading-h2)" }}
                >
                  License optimization report
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label="Close"
                  leftIcon={<IconClose size="s16" />}
                  onClick={onClose}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-s12">
                <div className="flex items-center gap-s8">
                  <span className="text-body" style={bodyText}>
                    {designation.name}
                  </span>
                  <Badge variant="light">{designation.businessArea}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-s8">
                  <span className="text-body" style={bodyText}>{`Last run ${report.lastRunLabel}`}</span>
                  <Link disabled>Re-run analysis</Link>
                  <span className="text-body" style={bodyText}>
                    Only the technical user can re-run
                  </span>
                </div>
              </div>
              <Alert type="success" compact showTitle={false}>
                {`Estimated saving: ${report.savingLabel} / year (${report.savingPercent}%)`}
              </Alert>
            </div>
          ) : null
        }
        footer={
          designation && report ? (
            <DrawerFooterSummary
              label="What happens next"
              result={`Approving sends ${designation.name} to final confirmation.`}
              status={footer.status}
              statusLabel={footer.label}
              linkLabel="View SoD details (read-only)"
              onLinkClick={() => setSodOpen(true)}
              secondaryLabel="Reject"
              secondaryVariant="warn"
              onSecondaryClick={reject}
              primaryLabel="Approve"
              onPrimaryClick={() => setApprovalOpen(true)}
            />
          ) : null
        }
      >
        {designation && report ? (
          <div className="flex flex-col gap-s12 p-s20">
            <StepCard
              step={1}
              title="Review the saving"
              state="locked"
              plainState
              stateLabel={`${report.beforeLabel} to ${report.afterLabel}`}
            >
              <div className="flex flex-col gap-s16 lg:flex-row">
                <CostBars
                  beforeLakhs={report.beforeLakhs}
                  afterLakhs={report.afterLakhs}
                  beforeLabel={report.beforeLabel}
                  afterLabel={report.afterLabel}
                  maxCost={maxCost}
                />
                {report.mix.length > 0 ? <MixChart mix={report.mix} /> : null}
              </div>
              <div className="grid grid-cols-2 gap-s12 lg:grid-cols-4">
                <Tile label="Roles analysed" value={String(counts.all)} />
                <Tile label="Licenses downgraded" value={String(counts.downgrade)} />
                <Tile label="Licenses unchanged" value={String(counts.unchanged)} />
                <Tile label="Licenses flagged for review" value={String(counts.flagged)} />
              </div>
            </StepCard>

            <StepCard
              step={2}
              title="Check license changes"
              state="locked"
              plainState
              stateLabel={changeStateLabel(counts)}
            >
              <Tabs
                variant="pill"
                showPanels={false}
                value={filter}
                onChange={(value) => setFilter((value as LicenseRoleFilter) ?? "all")}
                items={licenseRoleFilters.map((item) => ({
                  value: item.value,
                  label: item.label,
                  count: (
                    <Badge size="sm" variant="light">
                      {counts[item.value]}
                    </Badge>
                  ),
                }))}
              />
              <div
                ref={tableRef}
                className="overflow-auto"
                style={{ maxHeight: "calc(var(--space-s40) + var(--space-s56) * 4)" }}
                onScroll={(event) => updateRange(event.currentTarget)}
              >
                <Table
                  minWidth="0"
                  columns={roleColumns}
                  rows={rows}
                  getRowKey={(row) => row.id}
                  sort={sort}
                  onSortChange={setSort}
                />
              </div>
              {rows.length === 0 ? (
                <p className="m-0 text-body" style={bodyText}>
                  No role lines are recorded for this designation.
                </p>
              ) : null}
              <p className="m-0 text-body" style={captionText}>
                {rangeLabel}
              </p>
            </StepCard>

            <StepCard
              step={3}
              title="Add a comment"
              state="required"
              neutralBorder
              stateLabel="Required to reject"
            >
              <TextArea
                id="license-reject-comment"
                label="Comment (required to reject)"
                tooltip="Stored with the rejection. Approving does not need a comment."
                placeholder="Enter a comment"
                value={comment}
                error={commentError}
                onChange={(value) => {
                  setComment(value);
                  if (value.trim().length > 0) {
                    setCommentError(undefined);
                  }
                }}
              />
            </StepCard>
          </div>
        ) : null}
      </Drawer>
      <SodDetailsDrawer
        designationId={sodOpen && designation ? designation.id : null}
        designationName={designation?.name ?? ""}
        department={designation?.businessArea}
        onClose={() => setSodOpen(false)}
      />
      <FinalApprovalDialog
        designation={approvalOpen ? designation : null}
        onClose={() => setApprovalOpen(false)}
        onPublished={() => onFinished("published")}
      />
    </>
  );
}

const roleColumns = [
  {
    key: "role",
    label: "Role",
    sortable: true,
    render: (row: LicenseRoleLine) => (
      <span className="flex flex-col gap-s2">
        <span style={bodyText}>{row.roleName}</span>
        <span style={captionText}>{row.sapRoleName}</span>
      </span>
    ),
  },
  {
    key: "current",
    label: "Current license",
    width: "calc(var(--space-s96) + var(--space-s48) + var(--space-s6))",
    render: (row: LicenseRoleLine) => row.currentLicense,
  },
  {
    key: "recommended",
    label: "Recommended license",
    width: "calc(var(--space-s96) * 2 - var(--space-s2))",
    render: (row: LicenseRoleLine) => (
      <span className="flex flex-wrap items-center gap-s8">
        <span>{row.recommendedLicense}</span>
        {row.change === "downgrade" ? <Badge variant="completed">Downgrade</Badge> : null}
        {row.change === "flagged" ? <Badge variant="warning">Flagged</Badge> : null}
      </span>
    ),
  },
  {
    key: "saving",
    label: "Saving",
    sortable: true,
    width: "calc(var(--space-s96) + var(--space-s40) + var(--space-s4))",
    render: (row: LicenseRoleLine) => row.savingLabel ?? "—",
  },
];

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <article className="flex flex-col gap-s4 rounded-s12 bg-neutral-bg p-s12">
      <p className="m-0 text-body" style={captionText}>
        {label}
      </p>
      <p
        className="m-0 text-body"
        style={{ fontFamily: "var(--font-family-heading-h2)", fontSize: "var(--font-size-heading-h2)" }}
      >
        {value}
      </p>
    </article>
  );
}

function CostBars({
  beforeLakhs,
  afterLakhs,
  beforeLabel,
  afterLabel,
  maxCost,
}: {
  beforeLakhs: number;
  afterLakhs: number;
  beforeLabel: string;
  afterLabel: string;
  maxCost: number;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-s8">
      <p className="m-0 text-body" style={captionText}>
        Current vs projected cost
      </p>
      <div className="flex h-[120px] items-end justify-center gap-s16 border-b border-solid border-subtle">
        <Bar height={(beforeLakhs / maxCost) * 100} fill="var(--color-neutral-border)" label="Current cost" />
        <Bar height={(afterLakhs / maxCost) * 100} fill="var(--color-success-bg)" label="Projected cost" />
      </div>
      <div className="flex justify-center gap-s16">
        <span className="text-center text-body" style={{ ...captionText, width: "calc(var(--space-s96) + var(--space-s16))" }}>
          {`Current ${beforeLabel}`}
        </span>
        <span className="text-center text-body" style={{ ...captionText, width: "calc(var(--space-s96) + var(--space-s16))" }}>
          {`Projected ${afterLabel}`}
        </span>
      </div>
    </div>
  );
}

function Bar({ height, fill, label }: { height: number; fill: string; label: string }) {
  return (
    <div className="flex h-full w-s64 items-end justify-center">
      <div
        role="img"
        aria-label={label}
        className="w-s64"
        style={{ height: `${Math.max(height, 8)}%`, backgroundColor: fill }}
      />
    </div>
  );
}

function MixChart({ mix }: { mix: LicenseMixSegment[] }) {
  const beforeTotal = mix.reduce((sum, segment) => sum + segment.beforeCount, 0) || 1;
  const afterTotal = mix.reduce((sum, segment) => sum + segment.afterCount, 0) || 1;
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-s8">
      <p className="m-0 text-body" style={captionText}>
        License types, before and after
      </p>
      <MixRow label="Before" total={beforeTotal} segments={mix} countKey="beforeCount" />
      <MixRow label="After" total={afterTotal} segments={mix} countKey="afterCount" />
      <div className="flex flex-wrap gap-s16">
        {mix.map((segment) => (
          <span key={segment.key} className="inline-flex items-center gap-s8 text-body" style={captionText}>
            <span
              aria-hidden
              className="inline-block h-s12 w-s12 rounded-s2 border border-solid border-subtle"
              style={{ backgroundColor: mixTone[segment.key].background }}
            />
            {segment.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function MixRow({
  label,
  total,
  segments,
  countKey,
}: {
  label: string;
  total: number;
  segments: LicenseMixSegment[];
  countKey: "beforeCount" | "afterCount";
}) {
  return (
    <div className="flex flex-col gap-s4">
      <p className="m-0 text-body" style={captionText}>
        {label}
      </p>
      <div className="flex overflow-hidden rounded-s4" style={{ height: "calc(var(--space-s24) + var(--space-s4))" }}>
        {segments.map((segment) => {
          const count = segment[countKey];
          const tone = mixTone[segment.key];
          return (
            <div
              key={segment.key}
              className="flex items-center justify-center"
              style={{
                width: `${(count / total) * 100}%`,
                backgroundColor: tone.background,
                color: tone.color,
                ...captionText,
              }}
            >
              {`${segment.label} ${count}`}
            </div>
          );
        })}
      </div>
    </div>
  );
}
