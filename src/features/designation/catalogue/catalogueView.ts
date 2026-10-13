import type { BadgeVariant } from "@/ds/Badge";
import { lastAllowedRoute, pathFor } from "@/state/access";
import type { DesignationRuntime } from "@/state/model";
import type { LifecycleStatus } from "@/mock";

export type CatalogueFilter = "all" | LifecycleStatus;

export const catalogueFilters: { value: CatalogueFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Draft", label: "Draft" },
  { value: "In progress", label: "In progress" },
  { value: "Completed", label: "Completed" },
  { value: "Syncing to Dev", label: "Syncing to Dev" },
  { value: "Awaiting TR approval", label: "Awaiting TR approval" },
  { value: "Moving to Quality", label: "Moving to Quality" },
  { value: "License analysis running", label: "License analysis running" },
  { value: "Analysis failed", label: "Analysis failed" },
  { value: "Awaiting final approval", label: "Awaiting final approval" },
  { value: "Published", label: "Published" },
  { value: "Rejected", label: "Rejected" },
];

const statusVariant: Record<LifecycleStatus, BadgeVariant> = {
  Draft: "pending",
  "In progress": "in-progress",
  Completed: "completed",
  "Syncing to Dev": "in-progress",
  "Awaiting TR approval": "pending",
  "Moving to Quality": "in-progress",
  "License analysis running": "in-progress",
  "Awaiting final approval": "pending",
  "Analysis failed": "error",
  Rejected: "error",
  Published: "completed",
};

export function statusBadgeVariant(status: LifecycleStatus): BadgeVariant {
  return statusVariant[status];
}

export function matchesFilter(item: DesignationRuntime, filter: CatalogueFilter): boolean {
  if (filter === "all") {
    return true;
  }
  return item.status === filter;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** "6 Oct 2026", as on the Figma frame. */
export function formatUpdated(iso: string): string {
  const date = new Date(iso);
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function wizardStep(item: DesignationRuntime): number {
  const done = [item.steps.name, item.steps.activities, item.steps.sync, item.steps.roles, item.steps.finalize].filter(
    Boolean,
  ).length;
  return Math.min(5, done + 1);
}

export function statusNote(item: DesignationRuntime): string | null {
  switch (item.status) {
    case "Draft":
    case "In progress":
      return `Step ${wizardStep(item)} of 5`;
    case "Syncing to Dev":
    case "Moving to Quality":
    case "License analysis running":
      return "Next: System";
    case "Awaiting TR approval":
    case "Analysis failed":
      return "Next: Technical user";
    case "Awaiting final approval":
      return "Next: Admin";
    case "Rejected":
      return "Next: Designation owner";
    default:
      return null;
  }
}

export type LicenceCell = {
  badges: { label: string; variant: BadgeVariant }[];
  note: string | null;
};

export function licenceCell(item: DesignationRuntime): LicenceCell {
  if (item.approval.license === "running" || item.status === "License analysis running") {
    return {
      badges: [
        { label: "Running", variant: "in-progress" },
        { label: "Auto", variant: "light" },
      ],
      note: "Started automatically.",
    };
  }
  if (item.approval.license === "failed" || item.status === "Analysis failed") {
    return {
      badges: [{ label: "Failed", variant: "error" }],
      note: "License service timeout.",
    };
  }
  if (item.approval.license === "completed") {
    return { badges: [{ label: "Completed", variant: "completed" }], note: null };
  }
  if (item.status === "Awaiting TR approval" || item.status === "Moving to Quality") {
    return {
      badges: [{ label: "Not started", variant: "pending" }],
      note: "Waiting for Quality sync.",
    };
  }
  return { badges: [], note: null };
}

function completedSummary(item: DesignationRuntime) {
  if (item.approval.license !== "completed" || !item.licenseSummary) {
    return null;
  }
  return item.licenseSummary;
}

export function savingText(item: DesignationRuntime): string | null {
  const summary = completedSummary(item);
  if (!summary) {
    return null;
  }
  return `${summary.savingLabel} (${summary.savingPercent}%)`;
}

export type SavingTooltip = {
  currentCost: string;
  projectedCost: string;
  lastRun: string;
};

export function savingTooltip(item: DesignationRuntime): SavingTooltip | null {
  const summary = completedSummary(item);
  if (!summary) {
    return null;
  }
  return {
    currentCost: summary.beforeLabel,
    projectedCost: summary.afterLabel,
    lastRun: formatUpdated(summary.lastRunAt ?? item.updatedAt),
  };
}

export function savingLakhs(item: DesignationRuntime): number {
  const summary = completedSummary(item);
  if (!summary) {
    return 0;
  }
  const match = summary.savingLabel.match(/([\d.]+)/);
  return match ? Number(match[1]) : 0;
}

/** Technical user control. TODO(confirm): the Admin sees the result, not this action. */
export function canRerunLicense(item: DesignationRuntime): boolean {
  if (item.approval.licenseLive || item.status === "Moving to Quality" || item.status === "License analysis running") {
    return false;
  }
  return item.approval.license === "failed" || item.approval.license === "completed";
}

export type SodCell = { label: string; variant: BadgeVariant } | null;

export function sodCell(item: DesignationRuntime): SodCell {
  const summary = item.sodSummary;
  if (summary) {
    if (summary.high > 0) {
      return { label: `High ${summary.high}`, variant: "error" };
    }
    if (summary.medium > 0) {
      return { label: `Medium ${summary.medium}`, variant: "warning" };
    }
    if (summary.low > 0) {
      return { label: `Low ${summary.low}`, variant: "light" };
    }
    return { label: "None", variant: "completed" };
  }
  if (item.approval.license === "completed") {
    return { label: "None", variant: "completed" };
  }
  return null;
}

export function sodRank(item: DesignationRuntime): number {
  const summary = item.sodSummary;
  if (!summary) {
    return item.approval.license === "completed" ? 0 : -1;
  }
  return summary.high * 100 + summary.medium * 10 + summary.low;
}

const licenceOrder: Record<DesignationRuntime["approval"]["license"], number> = {
  none: 0,
  running: 2,
  failed: 3,
  completed: 4,
};

export function licenceRank(item: DesignationRuntime): number {
  if (item.status === "Awaiting TR approval" || item.status === "Moving to Quality") {
    return 1;
  }
  return licenceOrder[item.approval.license];
}

export type RowAction = {
  label: "Continue" | "View" | "Review TR" | "Re-run analysis" | "Approve" | "Reopen";
  href: string;
};

export function rowAction(item: DesignationRuntime): RowAction {
  switch (item.status) {
    case "Draft":
    case "In progress":
      return { label: "Continue", href: pathFor(lastAllowedRoute(item), item.id) };
    case "Awaiting TR approval":
      // TODO(confirm): other personas see View only. This prototype has no persona switch.
      return { label: "Review TR", href: pathFor("tr", item.id) };
    case "Moving to Quality":
      return { label: "View", href: pathFor("tr", item.id) };
    case "Analysis failed":
      // TODO(confirm): Admin sees the result, not Re-run. Prototype has no persona switch.
      return { label: "Re-run analysis", href: "/designations" };
    case "Awaiting final approval":
      return { label: "Approve", href: pathFor("approve", item.id) };
    case "Rejected":
      return { label: "Reopen", href: pathFor("activities", item.id) };
    default:
      return { label: "View", href: pathFor(lastAllowedRoute(item), item.id) };
  }
}

export function formatLakhs(value: number): string {
  return `₹ ${value.toFixed(1)} L`;
}
