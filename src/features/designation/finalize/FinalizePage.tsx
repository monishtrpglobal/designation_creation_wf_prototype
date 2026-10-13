"use client";

import { Alert } from "@/ds/Alert";
import { AppFrame } from "@/ds/AppFrame";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Checkbox } from "@/ds/Checkbox";
import { FlowShell } from "@/ds/FlowShell";
import { IconUserCircle } from "@/ds/icons";
import { Link } from "@/ds/Link";
import { Pagination, type PageSize } from "@/ds/Pagination";
import { ProgressRing, ProgressTrackConnector, ProgressTrackNode, type ProgressNodeState } from "@/ds/Progress";
import { RadioCard, RadioCardGroup } from "@/ds/RadioCard";
import { Table, type SortState } from "@/ds/Table";
import { Tabs } from "@/ds/Tabs";
import { TextArea } from "@/ds/TextArea";
import { flowSteps } from "@/features/designation/flowSteps";
import type { FinalizationConflict } from "@/mock";
import { guardRedirect, pathFor } from "@/state/access";
import { useFlowStore } from "@/state/flowStore";
import type { SodDecision } from "@/state/model";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import {
  decisionBadge,
  decisionOf,
  isOpenDecision,
  justificationOf,
  phaseFor,
  riskRank,
  riskVariant,
  roleCheckList,
  sodRoleTotal,
  visibleConflicts,
  type ConflictFilter,
} from "./finalizeView";

const sampleJustification = "Month-end close needs both T-codes; reviewed by internal audit.";
const rowHeight = "calc(var(--space-s64) + var(--space-s8))";

function phaseBadge(phase: ReturnType<typeof phaseFor>) {
  if (phase === "checked") {
    return { label: "Checked", variant: "completed" as const };
  }
  if (phase === "checking") {
    return { label: "Checking", variant: "in-progress" as const };
  }
  return { label: "Queued", variant: "pending" as const };
}

function compareConflicts(
  left: FinalizationConflict,
  right: FinalizationConflict,
  sort: SortState,
  decisions: Record<string, SodDecision>,
) {
  const direction = sort.direction === "asc" ? 1 : -1;
  if (sort.key === "risk") {
    return (riskRank(left.risk) - riskRank(right.risk)) * direction;
  }
  if (sort.key === "decision") {
    return decisionOf(left, decisions).localeCompare(decisionOf(right, decisions)) * direction;
  }
  const pair = `${left.roleALabel} ${left.roleBLabel}`.localeCompare(`${right.roleALabel} ${right.roleBLabel}`);
  return pair * direction;
}

export function FinalizePage({ designationId }: { designationId: string }) {
  const router = useRouter();
  const hydrated = useFlowStore((state) => state.hydrated);
  const designation = useFlowStore((state) => state.designations.find((item) => item.id === designationId));
  const setCurrentDesignation = useFlowStore((state) => state.setCurrentDesignation);
  const saveDraft = useFlowStore((state) => state.saveDraft);
  const startSodSimulation = useFlowStore((state) => state.startSodSimulation);
  const rerunSodSimulation = useFlowStore((state) => state.rerunSodSimulation);
  const ensureFinalizationDecisions = useFlowStore((state) => state.ensureFinalizationDecisions);
  const applySodDecisions = useFlowStore((state) => state.applySodDecisions);
  const completeFinalize = useFlowStore((state) => state.completeFinalize);
  const redirect = hydrated ? guardRedirect(designation, "finalize") : null;
  const roles = useMemo(() => roleCheckList(), []);
  const [rangeLabel, setRangeLabel] = useState(`Showing 1-5 of ${sodRoleTotal}`);
  const [filter, setFilter] = useState<ConflictFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [sort, setSort] = useState<SortState | null>(null);
  const [selected, setSelected] = useState<string[]>(["fin-01", "fin-02"]);
  const [choice, setChoice] = useState<"whitelist" | "mitigate">("whitelist");
  const [justification, setJustification] = useState(sampleJustification);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated || !redirect) {
      return;
    }
    router.replace(redirect);
  }, [hydrated, redirect, router]);

  useEffect(() => {
    if (!hydrated || redirect) {
      return;
    }
    setCurrentDesignation(designationId);
  }, [hydrated, redirect, designationId, setCurrentDesignation]);

  const simStatus = designation?.sodSim.status;
  const submitted = designation?.steps.finalize ?? false;

  useEffect(() => {
    if (!hydrated || redirect || simStatus === undefined) {
      return;
    }
    if (submitted || simStatus === "completed") {
      ensureFinalizationDecisions(designationId);
      return;
    }
    void startSodSimulation(designationId);
  }, [
    hydrated,
    redirect,
    designationId,
    simStatus,
    submitted,
    ensureFinalizationDecisions,
    startSodSimulation,
  ]);

  if (!hydrated || redirect || !designation) {
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

  const running = designation.sodSim.status !== "completed";
  const checked = designation.sodSim.checked;
  const phases = roles.map((_, index) => phaseFor(index, checked, running));
  const checkedCount = phases.filter((phase) => phase === "checked").length;
  const checkingCount = phases.filter((phase) => phase === "checking").length;
  const queuedCount = phases.filter((phase) => phase === "queued").length;
  const conflicts = visibleConflicts(designation.sodSim.clearedIds);
  const decisions = designation.sodDecisions;
  const openConflicts = conflicts.filter((conflict) => isOpenDecision(decisionOf(conflict, decisions)));
  const counts = {
    all: conflicts.length,
    open: openConflicts.length,
    High: conflicts.filter((conflict) => conflict.risk === "High").length,
    Medium: conflicts.filter((conflict) => conflict.risk === "Medium").length,
    Low: conflicts.filter((conflict) => conflict.risk === "Low").length,
  };
  const filtered = conflicts.filter((conflict) => {
    if (filter === "all") {
      return true;
    }
    if (filter === "open") {
      return isOpenDecision(decisionOf(conflict, decisions));
    }
    return conflict.risk === filter;
  });
  const sorted = sort ? [...filtered].sort((left, right) => compareConflicts(left, right, sort, decisions)) : filtered;
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * pageSize;
  const pageRows = sorted.slice(startIndex, startIndex + pageSize);
  const pageIds = pageRows.map((row) => row.id);
  const selectedOnPage = pageIds.filter((id) => selected.includes(id));
  const selectedRows = conflicts.filter((conflict) => selected.includes(conflict.id));
  const canApply =
    !submitted &&
    selectedRows.length > 0 &&
    (choice === "mitigate" || justification.trim().length > 0);
  const canSubmit = !submitted && !running && openConflicts.length === 0;
  const track: [ProgressNodeState, ProgressNodeState, ProgressNodeState] =
    checked === 0 ? ["active", "pending", "pending"] : checked >= sodRoleTotal ? ["done", "done", "done"] : ["done", "active", "pending"];

  function saveAndLeave() {
    saveDraft(designationId);
    router.push("/designations");
  }

  function togglePage(on: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      for (const id of pageIds) {
        if (on) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return [...next];
    });
  }

  function toggleRow(id: string, on: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (on) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return [...next];
    });
  }

  function focusDecision(conflict: FinalizationConflict) {
    const decision = decisionOf(conflict, decisions);
    setSelected([conflict.id]);
    setChoice(decision === "mitigate" ? "mitigate" : "whitelist");
    setJustification(decision === "whitelist" ? justificationOf(conflict, decisions) : decision === "pending" ? "" : justificationOf(conflict, decisions));
    panelRef.current?.focus();
  }

  function reviewOpen(event: { preventDefault: () => void }) {
    event.preventDefault();
    const first = openConflicts[0];
    setFilter("open");
    setPage(1);
    if (!first) {
      return;
    }
    setSelected([first.id]);
    requestAnimationFrame(() => {
      document.getElementById(`conflict-${first.id}`)?.scrollIntoView({ block: "center" });
    });
  }

  function onRoleScroll(event: UIEvent<HTMLUListElement>) {
    const element = event.currentTarget;
    const height = Number.parseFloat(getComputedStyle(element).getPropertyValue("--row-h")) || 72;
    const start = Math.floor(element.scrollTop / height) + 1;
    const visible = Math.max(1, Math.floor(element.clientHeight / height));
    const end = Math.min(roles.length, start + visible - 1);
    setRangeLabel(`Showing ${start}-${end} of ${roles.length}`);
  }

  function applyDecision() {
    if (!canApply) {
      return;
    }
    applySodDecisions(
      designationId,
      selectedRows.map((row) => row.id),
      choice,
      justification,
    );
  }

  const openNoun = openConflicts.length === 1 ? "conflict is" : "conflicts are";
  const helper = submitted ? (
    <span className="text-body">This designation is already submitted for TR approval.</span>
  ) : running ? (
    <span className="text-body">Submit is off: the simulation is still running.</span>
  ) : openConflicts.length > 0 ? (
    <span className="text-body">
      {`Submit is off: ${openConflicts.length} ${openNoun} still open. `}
      <Link href="#open-conflicts" onClick={reviewOpen}>
        Review open conflicts
      </Link>
    </span>
  ) : (
    <span className="text-body">
      Submitting creates a request for TR approval. You can track it on the catalogue (Screen 12).
    </span>
  );

  const selectionCount = selectedRows.length;
  const selectionOnPageCount = selectedOnPage.length;
  const selectionSentence =
    selectionCount === selectionOnPageCount
      ? `${selectionOnPageCount} ${selectionOnPageCount === 1 ? "conflict" : "conflicts"} selected on this page.`
      : `${selectionCount} ${selectionCount === 1 ? "conflict" : "conflicts"} selected.`;
  const justificationLabel =
    selectionCount === 2
      ? "Justification (applies to both conflicts)"
      : selectionCount > 1
        ? `Justification (applies to all ${selectionCount} conflicts)`
        : "Justification";

  return (
    <AppFrame>
      <FlowShell
        title="Create a New Designation"
        steps={flowSteps}
        activeIndex={4}
        contentSurface="white"
        pageSurface="white"
        onBack={() => router.push(pathFor("roles", designationId))}
        stepPrevVariant="primary"
        helperAlign="start"
        primaryLabel="Next"
        primaryDisabled
        stepNextDisabled
        footerPrimaryLabel="Submit for TR approval"
        footerPrimaryDisabled={!canSubmit}
        onFooterPrimaryClick={() => {
          if (completeFinalize(designationId)) {
            router.push("/designations");
          }
        }}
        helperText={helper}
      >
        <div className="flex w-full flex-col gap-s16">
          <div className="flex w-full items-start justify-between gap-s16">
            <div className="flex min-w-0 flex-col gap-s4">
              {running ? null : (
                <div className="flex min-w-0 items-center gap-s8">
                  <span className="inline-flex shrink-0 text-body">
                    <IconUserCircle size="s16" />
                  </span>
                  <span
                    className="shrink-0 text-l2 text-body"
                    style={{
                      fontFamily: "var(--font-family-lato-regular)",
                      lineHeight: "var(--font-line-height-label-l1)",
                    }}
                  >
                    Designation:
                  </span>
                  <span
                    className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-l2 text-body"
                    style={{
                      fontFamily: "var(--font-family-label-l1)",
                      fontWeight: "var(--font-weight-label-l1)",
                      lineHeight: "var(--font-line-height-label-l1)",
                    }}
                  >
                    {designation.name}
                  </span>
                </div>
              )}
              <h2
                className="m-0 text-heading-h2 text-in-progress-text"
                style={{ fontFamily: "var(--font-family-heading-h2)" }}
              >
                Role finalization
              </h2>
              <p
                className="m-0 text-l2 text-body"
                style={{ fontFamily: "var(--font-family-lato-regular)", lineHeight: "var(--font-line-height-label-l1)" }}
              >
                {running
                  ? "We are checking every pair of roles in this designation for conflicts. This can take a few minutes."
                  : "Decide what to do with each conflict before you submit."}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-s8">
              <Button variant="secondary" size="sm" onClick={saveAndLeave}>
                Save as draft
              </Button>
              {running ? null : (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={submitted}
                  onClick={() => {
                    void rerunSodSimulation(designationId);
                  }}
                >
                  Re-run check
                </Button>
              )}
            </div>
          </div>

          {running ? (
            <div
              className="grid w-full items-stretch gap-s16"
              style={{
                gridTemplateColumns:
                  "minmax(0, calc(var(--space-s96) * 5 + var(--space-s80))) minmax(calc(var(--space-s96) * 3 + var(--space-s32) + var(--space-s24) * 2), 1fr)",
              }}
            >
              <section
                className="flex min-w-0 flex-col gap-s16 rounded-s12 bg-surface-white p-s24"
                style={{ border: "var(--border-default) solid var(--color-border-subtle)" }}
              >
                <div className="flex w-full items-center gap-s8">
                  <h3 className="m-0 min-w-0 flex-1 text-label-l1 text-strong" style={{ fontFamily: "var(--font-family-label-l1)" }}>
                    Roles
                  </h3>
                  <Badge variant="info" size="md">
                    {checkedCount} of {sodRoleTotal} checked
                  </Badge>
                </div>
                <ul
                  className="m-0 flex list-none flex-col overflow-y-auto p-0"
                  style={{ maxHeight: "calc(var(--space-s80) * 4 + var(--space-s64) + var(--space-s12))", ["--row-h" as string]: rowHeight }}
                  onScroll={onRoleScroll}
                >
                  {roles.map((role, index) => {
                    const phase = phases[index];
                    const badge = phaseBadge(phase);
                    return (
                      <li
                        key={role.id}
                        className="flex items-center justify-between gap-s12"
                        style={{
                          minHeight: rowHeight,
                          borderBottom: "var(--border-default) solid var(--color-border-subtle)",
                        }}
                      >
                        <span className="min-w-0">
                          <span
                            className="block overflow-hidden text-ellipsis whitespace-nowrap text-l2 text-strong"
                            style={{
                              fontFamily: "var(--font-family-label-l1)",
                              fontWeight: "var(--font-weight-label-l1)",
                              lineHeight: "var(--font-line-height-label-l1)",
                            }}
                          >
                            {role.label}
                          </span>
                          <span
                            className="block overflow-hidden text-ellipsis whitespace-nowrap text-body"
                            style={{
                              fontFamily: "var(--font-family-lato-regular)",
                              fontSize: "var(--font-size-control-sm)",
                              lineHeight: "var(--font-line-height-control-sm)",
                            }}
                          >
                            {role.detail}
                          </span>
                        </span>
                        <Badge variant={badge.variant} size="md">
                          {badge.label}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
                <p
                  className="m-0 text-l2 text-body"
                  style={{ fontFamily: "var(--font-family-lato-regular)", lineHeight: "var(--font-line-height-label-l1)" }}
                >
                  {rangeLabel}
                </p>
              </section>
              <section
                className="flex min-w-0 flex-col items-center gap-s16 rounded-s12 bg-surface-white p-s24"
                style={{ border: "var(--border-default) solid var(--color-border-subtle)" }}
              >
                <h3 className="m-0 w-full text-label-l1 text-strong" style={{ fontFamily: "var(--font-family-label-l1)" }}>
                  SoD simulation progress
                </h3>
                <ProgressRing value={Math.round((checked / sodRoleTotal) * 100)} size="lg" />
                <p
                  className="m-0 text-center text-strong"
                  style={{
                    fontFamily: "var(--font-family-lato-semibold)",
                    fontSize: "var(--font-size-b3)",
                    fontWeight: "var(--font-weight-body-b3)",
                    lineHeight: "var(--space-s24)",
                  }}
                >
                  Running SoD simulation...
                </p>
                <p
                  className="m-0 text-center text-l2 text-body"
                  style={{ fontFamily: "var(--font-family-lato-regular)", lineHeight: "var(--font-line-height-label-l1)" }}
                >
                  {checked} of {sodRoleTotal} roles checked · {designation.sodSim.conflictsFound} conflicts found so far
                </p>
                <div className="flex w-full items-start gap-s12">
                  {[
                    ["Checked", String(checkedCount)],
                    ["Checking", String(checkingCount)],
                    ["Queued", String(queuedCount)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex min-w-0 flex-1 flex-col gap-s4 rounded-s8 bg-surface p-s12">
                      <span
                        className="text-control-sm text-body"
                        style={{ fontFamily: "var(--font-family-control-sm)", fontWeight: "var(--font-weight-control-sm)" }}
                      >
                        {label}
                      </span>
                      <span
                        className="text-strong"
                        style={{
                          fontFamily: "var(--font-family-lato-semibold)",
                          fontSize: "var(--font-size-b3)",
                          fontWeight: "var(--font-weight-body-b3)",
                          lineHeight: "var(--space-s24)",
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex w-full items-start">
                  <ProgressTrackNode label="Starting" number="1" state={track[0]} />
                  <ProgressTrackConnector state={track[0] === "done" ? "done" : "pending"} />
                  <ProgressTrackNode label="Simulating" number="2" state={track[1]} />
                  <ProgressTrackConnector state={track[1] === "done" ? "done" : "pending"} />
                  <ProgressTrackNode label="Completed" number="3" state={track[2]} />
                </div>
              </section>
            </div>
          ) : (
            <section
              className="flex w-full flex-col gap-s16 rounded-s12 bg-surface-white p-s16"
              style={{ border: "var(--border-default) solid var(--color-border-subtle)" }}
            >
              <div className="flex w-full flex-wrap items-center gap-s12">
                <h3 className="m-0 text-label-l1 text-strong" style={{ fontFamily: "var(--font-family-label-l1)" }}>
                  SoD simulation results
                </h3>
                <Badge variant="warning" size="md">
                  Conflicts detected
                </Badge>
                <span
                  className="ml-auto text-l2 text-body"
                  style={{ fontFamily: "var(--font-family-lato-regular)", lineHeight: "var(--font-line-height-label-l1)" }}
                >
                  {counts.all} conflicts · {counts.open} open
                </span>
              </div>
              <Tabs
                variant="pill"
                showPanels={false}
                value={filter}
                onChange={(value) => {
                  if (value === "all" || value === "open" || value === "High" || value === "Medium" || value === "Low") {
                    setFilter(value);
                    setPage(1);
                  }
                }}
                items={[
                  { value: "all", label: "All", count: counts.all },
                  { value: "open", label: "Open", count: counts.open },
                  { value: "High", label: "High", count: counts.High },
                  { value: "Medium", label: "Medium", count: counts.Medium },
                  { value: "Low", label: "Low", count: counts.Low },
                ]}
              />
              {selectionCount > 0 ? (
                <div aria-live="polite">
                  <Alert
                    type="info"
                    showTitle={false}
                    action={
                      <span className="flex flex-wrap items-center gap-s12">
                        <Button variant="secondary" size="sm" onClick={() => setSelected([])}>
                          Clear selection
                        </Button>
                        <Link
                          href="#select-open"
                          onClick={(event) => {
                            event.preventDefault();
                            setSelected(openConflicts.map((conflict) => conflict.id));
                          }}
                        >
                          Select all {counts.open} open conflicts
                        </Link>
                      </span>
                    }
                  >
                    {selectionSentence}
                  </Alert>
                </div>
              ) : null}
              <Table
                rows={pageRows}
                getRowKey={(row) => row.id}
                sort={sort}
                onSortChange={setSort}
                minWidth="calc(var(--space-s96) * 12)"
                columns={[
                  {
                    key: "select",
                    width: "var(--space-s48)",
                    label: (
                      <Checkbox
                        checked={pageIds.length > 0 && selectedOnPage.length === pageIds.length}
                        indeterminate={selectedOnPage.length > 0 && selectedOnPage.length < pageIds.length}
                        aria-label="Select all on this page"
                        onChange={togglePage}
                      />
                    ),
                    render: (row) => (
                      <Checkbox
                        checked={selected.includes(row.id)}
                        aria-label={`Select ${row.roleALabel} and ${row.roleBLabel}`}
                        onChange={(on) => toggleRow(row.id, on)}
                      />
                    ),
                  },
                  {
                    key: "pair",
                    label: "Role pair",
                    sortable: true,
                    render: (row) => (
                      <span id={`conflict-${row.id}`} className="block">
                        <span
                          className="block text-l2 text-strong"
                          style={{
                            fontFamily: "var(--font-family-label-l1)",
                            fontWeight: "var(--font-weight-label-l1)",
                            lineHeight: "var(--font-line-height-label-l1)",
                          }}
                        >
                          {row.roleALabel}
                        </span>
                        <span
                          className="block text-l2 text-body"
                          style={{ fontFamily: "var(--font-family-lato-regular)", lineHeight: "var(--font-line-height-label-l1)" }}
                        >
                          × {row.roleBLabel}
                        </span>
                      </span>
                    ),
                  },
                  {
                    key: "tcodes",
                    label: "Conflicting T-codes",
                    width: "calc(var(--space-s96) * 2)",
                    render: (row) => row.tcodes,
                  },
                  {
                    key: "risk",
                    label: "Risk",
                    sortable: true,
                    width: "calc(var(--space-s80) + var(--space-s40))",
                    render: (row) => (
                      <Badge variant={riskVariant(row.risk)} size="md">
                        {row.risk}
                      </Badge>
                    ),
                  },
                  {
                    key: "decision",
                    label: "Decision",
                    sortable: true,
                    width: "calc(var(--space-s96) + var(--space-s64))",
                    render: (row) => {
                      const badge = decisionBadge(decisionOf(row, decisions));
                      return (
                        <Badge variant={badge.variant} size="md">
                          {badge.label}
                        </Badge>
                      );
                    },
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    width: "calc(var(--space-s96) + var(--space-s40))",
                    render: (row) => {
                      const open = isOpenDecision(decisionOf(row, decisions));
                      return (
                        <Link
                          href={`#decide-${row.id}`}
                          onClick={(event) => {
                            event.preventDefault();
                            focusDecision(row);
                          }}
                        >
                          {open && decisionOf(row, decisions) !== "mitigate" ? "Decide" : "Edit decision"}
                        </Link>
                      );
                    },
                  },
                ]}
              />
              <Pagination
                page={safePage}
                total={sorted.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  if (size === 10 || size === 25 || size === 50) {
                    setPageSize(size);
                    setPage(1);
                  }
                }}
                pageSizeLabel="Conflicts per page"
                range={`Showing ${sorted.length === 0 ? 0 : startIndex + 1} to ${Math.min(startIndex + pageSize, sorted.length)} of ${sorted.length}`}
              />
              <div
                id="sod-decision"
                ref={panelRef}
                tabIndex={-1}
                className="flex flex-col gap-s12 rounded-s12 p-s16"
                style={{ border: "var(--border-default) solid var(--color-border-subtle)" }}
              >
                <h3 className="m-0 text-label-l1 text-strong" style={{ fontFamily: "var(--font-family-label-l1)" }}>
                  {selectionCount === 1
                    ? "Decision for 1 selected conflict"
                    : `Decision for ${selectionCount} selected conflicts`}
                </h3>
                <RadioCardGroup
                  direction="row"
                  value={choice}
                  onChange={(value) => {
                    if (value === "mitigate" || value === "whitelist") {
                      setChoice(value);
                    }
                  }}
                >
                  <RadioCard value="mitigate" title="Remediate" subtitle="Fix access in the roles, then re-run the check." disabled={submitted || selectionCount === 0} />
                  <RadioCard
                    value="whitelist"
                    title="Whitelist with justification"
                    subtitle="Accept the risk. A justification is required."
                    disabled={submitted || selectionCount === 0}
                  />
                </RadioCardGroup>
                {choice === "whitelist" ? (
                  <TextArea
                    label={justificationLabel}
                    required
                    maxLength={500}
                    showCounter
                    value={justification}
                    disabled={submitted || selectionCount === 0}
                    onChange={setJustification}
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-s12">
                  <Button variant="primary" size="md" disabled={!canApply} onClick={applyDecision}>
                    {selectionCount === 1 ? "Apply decision to 1 conflict" : `Apply decision to ${selectionCount} conflicts`}
                  </Button>
                  <span
                    className="text-l2 text-body"
                    style={{ fontFamily: "var(--font-family-lato-regular)", lineHeight: "var(--font-line-height-label-l1)" }}
                  >
                    Decisions are saved to the draft.
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>
      </FlowShell>
    </AppFrame>
  );
}
