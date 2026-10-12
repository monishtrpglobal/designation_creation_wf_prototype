"use client";

import { rolesFile, type RoleSeed } from "@/mock";
import { Alert } from "@/ds/Alert";
import { AppFrame } from "@/ds/AppFrame";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Checkbox } from "@/ds/Checkbox";
import { FlowShell } from "@/ds/FlowShell";
import { IconChevronRight, IconUserCircle } from "@/ds/icons";
import { Link } from "@/ds/Link";
import { Pagination } from "@/ds/Pagination";
import { RadioCard, RadioCardGroup } from "@/ds/RadioCard";
import { Table, type SortState, type TableColumn } from "@/ds/Table";
import { Tabs } from "@/ds/Tabs";
import { TextField } from "@/ds/TextField";
import { Tooltip } from "@/ds/Tooltip";
import { flowSteps } from "@/features/designation/flowSteps";
import { guardRedirect, pathFor } from "@/state/access";
import { useFlowStore } from "@/state/flowStore";
import type { FlowMethod, RoleRuntimeStatus } from "@/state/model";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RoleDetailsDrawer, type RoleDrawerTarget } from "./RoleDetailsDrawer";
import {
  badgeLabel,
  badgeVariant,
  compareStatus,
  countLabel,
  displayedRoleStatus,
  isCreated,
  isInProgress,
  isIssue,
  optionBDetail,
  optionBPhase,
  optionBShowsActions,
  roleDetail,
  type OptionBFilter,
  type OptionBPhase,
} from "./rolesView";

type TabId = "new" | "existing";
type NewFilter = "all" | "issues" | "ready" | "progress" | "created" | OptionBFilter;

type NewRow = {
  id: string;
  label: string;
  sapName: string;
  status: RoleRuntimeStatus;
  retried: boolean;
  enteredId: string;
};

type ExistingRow = RoleSeed & { included: boolean };

const pageSizes = [5, 10, 25, 50] as const;
const labelL2 = {
  fontFamily: "var(--font-family-lato-regular)",
  lineHeight: "var(--font-line-height-label-l1)",
} as const;

function truncate(name: string, className = "") {
  return (
    <Tooltip label={name} position="bottom" width="single-line">
      <span className={`block max-w-full overflow-hidden text-ellipsis whitespace-nowrap ${className}`}>{name}</span>
    </Tooltip>
  );
}

export function RolesPage({ designationId }: { designationId: string }) {
  const router = useRouter();
  const hydrated = useFlowStore((state) => state.hydrated);
  const designation = useFlowStore((state) => state.designations.find((item) => item.id === designationId));
  const setCurrentDesignation = useFlowStore((state) => state.setCurrentDesignation);
  const saveDraft = useFlowStore((state) => state.saveDraft);
  const chooseMethod = useFlowStore((state) => state.chooseMethod);
  const retryRole = useFlowStore((state) => state.retryRole);
  const retryFailedRoles = useFlowStore((state) => state.retryFailedRoles);
  const completeLinkedRoles = useFlowStore((state) => state.completeLinkedRoles);
  const redirect = hydrated ? guardRedirect(designation, "roles") : null;

  const [tab, setTab] = useState<TabId>("new");
  const [filter, setFilter] = useState<NewFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sort, setSort] = useState<SortState | null>({ key: "status", direction: "asc" });
  const [existingSort, setExistingSort] = useState<SortState | null>(null);
  const [included, setIncluded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(rolesFile.existingRoles.map((role) => [role.id, role.included !== false])),
  );
  const [drawer, setDrawer] = useState<RoleDrawerTarget | null>(null);

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

  const statuses = designation?.roleStatuses;
  const sapNames = designation?.roleSapNames;
  const enteredIds = designation?.optionBRoleIds;
  const method = designation?.method ?? null;
  const phase = optionBPhase(method, designation?.methodLocked === true, Object.values(statuses ?? {}));

  useEffect(() => {
    setFilter("all");
    setPage(1);
  }, [phase]);

  const started =
    designation?.methodLocked === true &&
    designation.method === "A" &&
    Object.values(statuses ?? {}).some((status) => isCreated(status) || isInProgress(status) || status === "Failed");
  const allCreated =
    started && Object.values(statuses ?? {}).length > 0 && Object.values(statuses ?? {}).every((status) => status === "Created");

  const retriedRoles = designation?.roleRetried ?? {};
  const newRows = useMemo<NewRow[]>(() => {
    if (!statuses || !sapNames) {
      return [];
    }
    return rolesFile.newRoles.map((role) => ({
      id: role.id,
      label: role.businessLabel,
      sapName: sapNames[role.id] ?? role.sapRoleName,
      status: displayedRoleStatus(statuses[role.id] ?? role.status, phase),
      retried: retriedRoles[role.id] === true,
      enteredId: enteredIds?.[role.id] ?? "",
    }));
  }, [enteredIds, phase, retriedRoles, sapNames, statuses]);

  const issueCount = newRows.filter((row) => isIssue(row.status)).length;
  const readyCount = newRows.filter((row) => row.status === "Ready").length;
  const progressCount = newRows.filter((row) => isInProgress(row.status)).length;
  const createdCount = newRows.filter((row) => row.status === "Created").length;
  const failedCount = newRows.filter((row) => row.status === "Failed").length;
  const neededCount = newRows.filter((row) => row.status === "Needed").length;
  const awaitingCount = newRows.filter((row) => row.status === "Awaiting SAP").length;
  const enteredCount = newRows.filter((row) => row.status === "ID entered").length;
  const gapCount = newRows.filter((row) => row.status === "Gap found").length;
  const validatedCount = newRows.filter((row) => row.status === "Validated").length;
  const notCreatedCount = newRows.filter((row) => !isIssue(row.status) && row.status !== "Created").length;
  const includedCount = rolesFile.existingRoles.filter((role) => included[role.id]).length;

  const filteredNew = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = newRows.filter((row) => {
      if (filter === "issues" && !isIssue(row.status)) {
        return false;
      }
      if (filter === "ready" && row.status !== "Ready") {
        return false;
      }
      if (filter === "progress" && !isInProgress(row.status)) {
        return false;
      }
      if (filter === "created" && row.status !== "Created") {
        return false;
      }
      if (filter === "needed" && row.status !== "Needed") {
        return false;
      }
      if (filter === "awaiting" && row.status !== "Awaiting SAP") {
        return false;
      }
      if (filter === "entered" && row.status !== "ID entered") {
        return false;
      }
      if (filter === "gap" && row.status !== "Gap found") {
        return false;
      }
      if (filter === "validated" && row.status !== "Validated") {
        return false;
      }
      if (!needle) {
        return true;
      }
      return row.label.toLowerCase().includes(needle) || row.sapName.toLowerCase().includes(needle);
    });
    if (!sort) {
      return rows;
    }
    const direction = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((left, right) => {
      if (sort.key === "status") {
        const rank = compareStatus(left.status, right.status) * direction;
        if (rank !== 0) {
          return rank;
        }
        if (left.retried !== right.retried) {
          return left.retried ? -1 : 1;
        }
        return 0;
      }
      if (sort.key === "sapName") {
        return left.sapName.localeCompare(right.sapName) * direction;
      }
      return left.label.localeCompare(right.label) * direction;
    });
  }, [filter, newRows, query, sort]);

  const filteredExisting = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows: ExistingRow[] = rolesFile.existingRoles
      .filter((role) => {
        if (!needle) {
          return true;
        }
        return role.businessLabel.toLowerCase().includes(needle) || role.sapRoleName.toLowerCase().includes(needle);
      })
      .map((role) => ({ ...role, included: included[role.id] === true }));
    if (!existingSort) {
      return rows;
    }
    const direction = existingSort.direction === "asc" ? 1 : -1;
    return [...rows].sort((left, right) => {
      if (existingSort.key === "match") {
        return ((left.match ?? 0) - (right.match ?? 0)) * direction;
      }
      return left.businessLabel.localeCompare(right.businessLabel) * direction;
    });
  }, [existingSort, included, query]);

  if (!hydrated || redirect || !designation || !statuses) {
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

  const visibleNew = filteredNew.length < 11 ? filteredNew : filteredNew.slice((page - 1) * pageSize, page * pageSize);
  const showNewPagination = filteredNew.length >= 11;
  const showExistingPagination = filteredExisting.length > 25;
  const visibleExisting = showExistingPagination
    ? filteredExisting.slice((page - 1) * pageSize, page * pageSize)
    : filteredExisting;
  const showFilters = rolesFile.newRoles.length >= 5;
  const selectedMethod: FlowMethod = method ?? "A";
  const reviewDisabled = tab !== "new" || selectedMethod !== "A" || started;
  const reviewReason =
    tab !== "new"
      ? "Review & Configure only applies to new roles."
      : selectedMethod !== "A"
        ? "Review & Configure applies to Option A."
        : null;

  function showIssues() {
    setTab("new");
    setFilter("issues");
    setPage(1);
  }

  function openDrawer(row: NewRow) {
    setDrawer({
      id: row.id,
      label: row.label,
      sapName: row.sapName,
      status: row.status,
      retried: row.retried,
      allSettled: allCreated,
    });
  }

  function markRetry(roleId: string) {
    void retryRole(designationId, roleId);
  }

  function goReview() {
    if (method === null) {
      chooseMethod(designationId, "A");
    }
    router.push(pathFor("review", designationId));
  }

  function goLink() {
    if (method === null) {
      chooseMethod(designationId, "B");
    }
    router.push(pathFor("link", designationId));
  }

  function optionBActionLabel(current: OptionBPhase) {
    return current === "before-send" ? "Link roles built in SAP (Option B)" : "Continue linking roles";
  }

  const newColumns: TableColumn<NewRow>[] = [
    {
      key: "label",
      label: "Role",
      sortable: true,
      width: "34%",
      render: (row) => (
        <span className="block whitespace-normal text-strong" style={{ fontFamily: "var(--font-family-label-l1)" }}>
          {row.label}
        </span>
      ),
    },
    {
      key: "sapName",
      label: "Suggested name",
      sortable: true,
      width: "21%",
      render: (row) => truncate(row.sapName),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      width: "10%",
      render: (row) => (
        <Badge size="md" variant={badgeVariant(row.status)}>
          {badgeLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: "detail",
      label: "Detail",
      width: phase && !optionBShowsActions(phase) ? "24%" : "21%",
      render: (row) =>
        phase ? optionBDetail(phase, row.status, row.enteredId, row.id) : roleDetail(row.status, row.sapName, row.retried, row.id, allCreated),
    },
    ...(phase && !optionBShowsActions(phase)
      ? []
      : [
    {
      key: "actions",
      label: "Actions",
      width: "14%",
      render: (row: NewRow) => {
        if (phase) {
          const label =
            phase === "linking" && row.status === "Needed"
              ? "Enter role ID"
              : phase === "gaps" && row.status === "Gap found"
                ? "View gap report"
                : "View details";
          return (
            <Link
              href={pathFor("link", designationId)}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                goLink();
              }}
            >
              {label}
            </Link>
          );
        }
        if (!started) {
          if (!isIssue(row.status)) {
            return null;
          }
          return (
            <Button
              variant="secondary"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                goReview();
              }}
            >
              Fix
            </Button>
          );
        }
        if (row.status === "Failed") {
          return (
            <span className="flex items-center gap-s12">
              <Link
                href="#retry-role"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  markRetry(row.id);
                }}
              >
                Retry
              </Link>
              <Link
                href="#role-error"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  openDrawer(row);
                }}
              >
                View error log
              </Link>
            </span>
          );
        }
        return (
          <Link
            href="#role-details"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              openDrawer(row);
            }}
          >
            View details
          </Link>
        );
      },
    },
  ]),
  ];

  const existingColumns: TableColumn<ExistingRow>[] = [
    {
      key: "include",
      label: (
        <Checkbox
          size="sm"
          aria-label={includedCount === rolesFile.existingRoles.length ? "Clear all roles" : "Include all roles"}
          checked={includedCount === rolesFile.existingRoles.length}
          indeterminate={includedCount > 0 && includedCount < rolesFile.existingRoles.length}
          disabled={started}
          onChange={() => {
            const next = includedCount !== rolesFile.existingRoles.length;
            setIncluded(Object.fromEntries(rolesFile.existingRoles.map((role) => [role.id, next])));
          }}
        />
      ),
      width: "calc(var(--space-s40) + var(--space-s4))",
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <Checkbox
            size="sm"
            aria-label={`Include ${row.businessLabel}`}
            checked={row.included}
            disabled={started}
            onChange={(checked) => setIncluded((current) => ({ ...current, [row.id]: checked }))}
          />
        </span>
      ),
    },
    {
      key: "label",
      label: "Role",
      sortable: true,
      render: (row) => (
        <span className="block text-strong" style={{ fontFamily: "var(--font-family-label-l1)" }}>
          {row.businessLabel}
        </span>
      ),
    },
    {
      key: "sapName",
      label: "Role ID",
      width: "calc(var(--space-s80) * 3)",
      render: (row) => truncate(row.sapRoleName, "text-body"),
    },
    {
      key: "match",
      label: "Match",
      sortable: true,
      width: "calc(var(--space-s80) + var(--space-s40) + var(--space-s20))",
      render: (row) => (
        <span className="text-body" style={labelL2}>
          {row.match ?? 0}% match
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "calc(var(--space-s80) + var(--space-s40) + var(--space-s20))",
      render: () => (
        <Button variant="secondary" size="sm">
          View details
        </Button>
      ),
    },
  ];

  const filterItems = phase
    ? [
        { value: "all", label: "All", count: newRows.length, variant: "light" as const },
        ...(phase === "before-send" || phase === "linking"
          ? [{ value: "needed", label: "Needed", count: neededCount, variant: "pending" as const }]
          : []),
        ...(phase === "awaiting"
          ? [{ value: "awaiting", label: "Awaiting SAP", count: awaitingCount, variant: "warning" as const }]
          : []),
        ...(phase === "linking"
          ? [{ value: "entered", label: "ID entered", count: enteredCount, variant: "in-progress" as const }]
          : []),
        ...(phase === "gaps" || phase === "validated"
          ? [{ value: "gap", label: "Gap found", count: gapCount, variant: "error" as const }]
          : []),
        ...(phase === "before-send" || phase === "awaiting" || phase === "gaps" || phase === "validated"
          ? [{ value: "validated", label: "Validated", count: validatedCount, variant: "completed" as const }]
          : []),
      ]
    : started
      ? [
          { value: "all", label: "All", count: newRows.length, variant: "light" as const },
          { value: "issues", label: "Issues", count: failedCount, variant: "error" as const },
          { value: "progress", label: "In progress", count: progressCount, variant: "in-progress" as const },
          { value: "created", label: "Created", count: createdCount, variant: "completed" as const },
        ]
      : [
          { value: "all", label: "All", count: newRows.length, variant: "light" as const },
          { value: "issues", label: "Issues", count: issueCount, variant: "error" as const },
          { value: "ready", label: "Ready", count: readyCount, variant: "completed" as const },
        ];

  const rangeStart = filteredNew.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, filteredNew.length);
  const roleTotal = rolesFile.newRoles.length;

  function optionBHelper(current: OptionBPhase) {
    if (current === "validated") {
      return `All ${roleTotal} roles validated. Validated roles are locked.`;
    }
    const reason =
      tab === "existing" && current === "before-send"
        ? "Next is locked: send the requirement, link the roles built in SAP, and validate them before continuing. "
        : current === "before-send"
          ? "Next is locked: the requirement has not been sent to the security team yet. "
          : current === "awaiting"
            ? `Next is locked: ${roleTotal} roles are still awaiting SAP. `
            : current === "linking"
              ? `Next is locked: ${neededCount} ${neededCount === 1 ? "role still needs" : "roles still need"} a SAP role ID. `
              : `Next is locked: ${countLabel(gapCount, "role")} ${gapCount === 1 ? "has" : "have"} gaps. `;
    const linkLabel = tab === "existing" ? "Open New roles" : current === "before-send" ? "Open link roles" : "Continue linking roles";
    return (
      <>
        {reason}
        <Link
          href={tab === "existing" ? "#new-roles" : pathFor("link", designationId)}
          onClick={(event) => {
            event.preventDefault();
            if (tab === "existing") {
              setTab("new");
              setPage(1);
              return;
            }
            goLink();
          }}
        >
          {linkLabel}
        </Link>
      </>
    );
  }

  return (
    <AppFrame>
      <FlowShell
        title="Create a New Designation"
        steps={flowSteps}
        activeIndex={3}
        contentSurface="white"
        pageSurface="white"
        onBack={() => router.push(pathFor("sync", designationId))}
        stepPrevVariant="primary"
        helperAlign="start"
        showFooterPrimary={false}
        primaryLabel="Next"
        primaryDisabled={phase ? phase !== "validated" : !allCreated}
        onPrimaryClick={() => {
          if (phase === "validated") {
            completeLinkedRoles(designationId);
          }
          router.push(pathFor("finalize", designationId));
        }}
        helperText={
          phase ? (
            optionBHelper(phase)
          ) : allCreated ? (
            `All ${rolesFile.newRoles.length} roles created and synced. Created roles are locked.`
          ) : (
            <>
              {started
                ? `Next is locked: ${countLabel(failedCount, "role")} failed and ${progressCount} ${progressCount === 1 ? "is" : "are"} still being created. `
                : `Next is locked: ${countLabel(issueCount, "role")} on the New roles tab ${issueCount === 1 ? "has" : "have"} issues and ${notCreatedCount} ${notCreatedCount === 1 ? "is" : "are"} not created yet. `}
              {issueCount > 0 || failedCount > 0 ? (
                <Link
                  href="#issues"
                  onClick={(event) => {
                    event.preventDefault();
                    showIssues();
                  }}
                >
                  Show issues
                </Link>
              ) : null}
            </>
          )
        }
      >
        <div className="flex w-full flex-col gap-s16">
          <div className="flex w-full flex-col gap-s4">
            <div className="flex w-full items-center justify-between gap-s16">
              <div className="flex min-w-0 items-center gap-s8">
                <span className="inline-flex shrink-0 text-body">
                  <IconUserCircle size="s16" />
                </span>
                <span className="shrink-0 text-l2 text-body" style={labelL2}>
                  Designation:
                </span>
                <span
                  className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-l2 text-body"
                  style={{
                    ...labelL2,
                    maxWidth: "calc(var(--space-s80) * 7 + var(--space-s40))",
                    fontFamily: "var(--font-family-label-l1)",
                    fontWeight: "var(--font-weight-label-l1)",
                  }}
                >
                  {designation.name}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  saveDraft(designationId);
                  router.push("/designations");
                }}
              >
                Save as draft
              </Button>
            </div>
            <h2 className="m-0 text-heading-h2 text-strong" style={{ fontFamily: "var(--font-family-heading-h2)" }}>
              Recommended Roles
            </h2>
            <p className="m-0 text-l2 text-body" style={labelL2}>
              {phase === "validated"
                ? `${rolesFile.existingRoles.length} existing roles ready · ${roleTotal} new roles validated`
                : phase === "awaiting"
                  ? `${rolesFile.existingRoles.length} existing roles ready · ${roleTotal} new roles awaiting SAP`
                  : phase === "linking" || phase === "gaps"
                    ? `${rolesFile.existingRoles.length} existing roles ready · ${roleTotal} new roles, linking started`
                    : allCreated
                      ? `${rolesFile.existingRoles.length} existing roles ready · ${roleTotal} new roles created`
                      : started
                        ? `${rolesFile.existingRoles.length} existing roles ready · ${roleTotal} new roles, creation started`
                        : `${rolesFile.existingRoles.length} existing roles ready · ${roleTotal} new roles need setup`}
            </p>
          </div>

          <Tabs
            variant="underline"
            showPanels={false}
            value={tab}
            onChange={(value) => {
              setTab(value === "existing" ? "existing" : "new");
              setPage(1);
              setQuery("");
            }}
            items={[
              {
                value: "new",
                label:
                  phase === "gaps" && gapCount > 0
                    ? `New roles · ${countLabel(gapCount, "issue")}`
                    : phase === "validated"
                      ? `New roles · ${roleTotal}`
                      : phase
                        ? "New roles"
                        : (started ? failedCount : issueCount) > 0
                          ? `New roles · ${countLabel(started ? failedCount : issueCount, "issue")}`
                          : allCreated
                            ? `New roles · ${roleTotal}`
                            : "New roles",
              },
              {
                value: "existing",
                label: `Existing roles · ${includedCount} of ${rolesFile.existingRoles.length}`,
              },
            ]}
          />

          {tab === "new" ? (
            <section className="flex w-full flex-col gap-s16">
              <div className="flex w-full items-center justify-between gap-s16">
                <h3
                  className="m-0 uppercase text-strong"
                  style={{
                    fontFamily: "var(--font-family-lato-semibold)",
                    fontSize: "var(--font-size-l3)",
                    fontWeight: "var(--font-weight-body-b1)",
                    lineHeight: "var(--font-line-height-control-sm)",
                  }}
                >
                  New roles ({rolesFile.newRoles.length})
                </h3>
                {started || (phase && phase !== "before-send") ? null : (
                  <p className="m-0 text-l2 text-body" style={labelL2}>
                    How should these roles be created? Applies to all {roleTotal}.
                  </p>
                )}
              </div>

              {phase && phase !== "before-send" ? (
                <>
                  <div className="flex w-full items-center justify-between gap-s16">
                    <p className="m-0 text-l2 text-body" style={labelL2}>
                      Method is locked: Option B · Link roles built in SAP
                    </p>
                    <Button
                      variant="primary"
                      size="md"
                      rightIcon={<IconChevronRight size="s16" />}
                      onClick={goLink}
                    >
                      Continue linking roles
                    </Button>
                  </div>
                  <Alert
                    type={phase === "validated" ? "success" : phase === "gaps" ? "error" : phase === "linking" ? "info" : "warning"}
                    title={
                      phase === "validated"
                        ? "Roles validated"
                        : phase === "gaps"
                          ? "Gaps found"
                          : phase === "linking"
                            ? "Linking roles"
                            : "Requirement sent"
                    }
                    action={
                      phase === "validated" ? undefined : (
                        <Button variant="secondary" size="sm" onClick={goLink}>
                          Continue linking roles
                        </Button>
                      )
                    }
                  >
                    {phase === "validated"
                      ? `${roleTotal} of ${roleTotal} validated and synced. Validated roles are locked.`
                      : phase === "gaps"
                        ? `${gapCount} ${gapCount === 1 ? "role does" : "roles do"} not match the requirement. ${validatedCount} validated.`
                        : phase === "linking"
                          ? `${enteredCount} of ${roleTotal} linked. Run sync is available once all ${roleTotal} role IDs are entered.`
                          : `${roleTotal} roles are with the security team. You will be notified when they are built in SAP.`}
                  </Alert>
                </>
              ) : started ? (
                <Alert
                  type={allCreated ? "success" : "warning"}
                  title={allCreated ? "Roles created · Option A" : "Creating roles · Option A"}
                  action={
                    allCreated ? undefined : (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={failedCount === 0}
                        onClick={() => {
                          void retryFailedRoles(designationId);
                        }}
                      >
                        Retry all failed
                      </Button>
                    )
                  }
                >
                  {allCreated
                    ? `${roleTotal} of ${roleTotal} created and synced. Created roles are locked.`
                    : `${createdCount} of ${roleTotal} created · ${progressCount} in progress · ${failedCount} failed. Method is locked: creation started.`}
                </Alert>
              ) : (
                <>
                  <RadioCardGroup
                    direction="row"
                    value={selectedMethod}
                    onChange={(value) => {
                      if (designation.methodLocked) {
                        return;
                      }
                      chooseMethod(designationId, value === "B" ? "B" : "A");
                    }}
                  >
                    <div className="grid w-full items-stretch gap-s12" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      <RadioCard
                        value="A"
                        title="Option A · Build roles"
                        subtitle="Created from the platform via SAP Integration Flow API"
                        disabled={designation.methodLocked}
                      />
                      <RadioCard
                        value="B"
                        title="Option B · Link roles built in SAP"
                        subtitle="Your security team builds each role directly in SAP using the suggested names. The platform then links the roles it finds and validates them against the live SAP definition."
                        disabled={designation.methodLocked}
                      />
                    </div>
                  </RadioCardGroup>
                  <div className="flex w-full items-center justify-between gap-s16">
                    <p className="m-0 text-l2 text-body" style={labelL2}>
                      {selectedMethod === "B"
                        ? "Method can be changed freely until the requirement is sent. Then it is locked for the designation."
                        : "Method can be changed freely until creation starts. Then it is locked for the designation."}
                    </p>
                    <div className="flex shrink-0 items-center gap-s12">
                      {selectedMethod === "B" ? null : reviewReason ? (
                        <span className="text-l2 text-body" style={labelL2}>
                          {reviewReason}
                        </span>
                      ) : null}
                      <Button
                        variant="primary"
                        size="md"
                        disabled={selectedMethod === "B" ? false : reviewDisabled}
                        rightIcon={<IconChevronRight size="s16" />}
                        onClick={selectedMethod === "B" ? goLink : goReview}
                      >
                        {selectedMethod === "B" ? "Link roles built in SAP (Option B)" : "Review & Configure (Option A)"}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <div className="overflow-hidden rounded-s12 border border-solid border-subtle bg-surface-white">
                <div className="flex items-start justify-between gap-s16 px-s16 pt-s12">
                  {showFilters ? (
                    <Tabs
                      variant="pill"
                      showPanels={false}
                      value={filter}
                      onChange={(value) => {
                        setFilter((value as NewFilter) ?? "all");
                        setPage(1);
                      }}
                      items={filterItems.map((item) => ({
                        value: item.value,
                        label: item.label,
                        count: (
                          <Badge size="sm" variant={item.variant}>
                            {item.count}
                          </Badge>
                        ),
                      }))}
                    />
                  ) : (
                    <span />
                  )}
                  <div className="shrink-0" style={{ width: "calc(var(--space-s80) * 4)" }}>
                    <TextField
                      type="search"
                      placeholder="Search roles or suggested names"
                      value={query}
                      onChange={(value) => {
                        setQuery(value);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>
                <Table
                  columns={newColumns}
                  rows={visibleNew}
                  getRowKey={(row) => row.id}
                  sort={sort}
                  onSortChange={setSort}
                  onRowClick={started ? openDrawer : undefined}
                />
                {showNewPagination ? (
                  <div className="px-s16 py-s12">
                    <Pagination
                      page={page}
                      total={filteredNew.length}
                      pageSize={pageSize}
                      sizes={pageSizes}
                      onPageChange={setPage}
                      onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                      }}
                      range={`${rangeStart}–${rangeEnd} of ${filteredNew.length}`}
                    />
                  </div>
                ) : null}
              </div>
            </section>
          ) : (
            <section className="flex w-full flex-col gap-s16">
              <div className="flex w-full items-center justify-between gap-s16">
                <p className="m-0 min-w-0 flex-1 text-l2 text-body" style={labelL2}>
                  {selectedMethod === "B"
                    ? "Link roles built in SAP only applies to new roles."
                    : "Review & Configure is only available on the New roles tab."}
                </p>
                <Button variant="primary" size="md" disabled rightIcon={<IconChevronRight size="s16" />}>
                  {selectedMethod === "B" ? optionBActionLabel(phase ?? "before-send") : "Review & Configure (Option A)"}
                </Button>
              </div>
              <div className="rounded-s12 border border-solid border-subtle bg-surface-white">
                <div className="sticky top-0 z-10 flex items-center justify-between gap-s16 rounded-t-s12 border-b border-solid border-subtle bg-surface-white px-s16 py-s12">
                  <Badge size="md" variant="light">
                    {includedCount} of {rolesFile.existingRoles.length} included
                  </Badge>
                  <div className="shrink-0" style={{ width: "calc(var(--space-s80) * 4)" }}>
                    <TextField
                      type="search"
                      size="sm"
                      placeholder="Search existing roles"
                      value={query}
                      onChange={setQuery}
                    />
                  </div>
                </div>
                <Table
                  columns={existingColumns}
                  rows={visibleExisting}
                  getRowKey={(row) => row.id}
                  sort={existingSort}
                  onSortChange={setExistingSort}
                />
                {showExistingPagination ? (
                  <div className="px-s16 py-s12">
                    <Pagination
                      page={page}
                      total={filteredExisting.length}
                      pageSize={pageSize}
                      sizes={pageSizes}
                      onPageChange={setPage}
                      onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                      }}
                      range={`${filteredExisting.length === 0 ? 0 : (page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredExisting.length)} of ${filteredExisting.length}`}
                    />
                  </div>
                ) : null}
              </div>
            </section>
          )}
        </div>
      </FlowShell>
      <RoleDetailsDrawer
        role={drawer}
        onClose={() => setDrawer(null)}
        onRetry={(roleId) => {
          markRetry(roleId);
          setDrawer(null);
        }}
      />
    </AppFrame>
  );
}
