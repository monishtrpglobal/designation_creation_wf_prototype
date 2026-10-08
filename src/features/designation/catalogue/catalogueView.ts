import type { BadgeVariant } from "@/ds/Badge";
import { lastAllowedRoute, pathFor } from "@/state/access";
import type { DesignationRuntime } from "@/state/model";
import type { LifecycleStatus } from "@/mock";

export type CatalogueFilter =
  | "all"
  | "in-progress"
  | "completed"
  | LifecycleStatus;

export const catalogueFilters: { value: CatalogueFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Draft", label: "Draft" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
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
  if (filter === "in-progress" || filter === "completed") {
    return false;
  }
  return item.status === filter;
}

export function formatUpdated(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
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

export function savingText(item: DesignationRuntime): string | null {
  if (!item.licenseSummary) {
    return null;
  }
  return `${item.licenseSummary.savingLabel} (${item.licenseSummary.savingPercent}%)`;
}

export function savingLakhs(item: DesignationRuntime): number {
  if (!item.licenseSummary) {
    return 0;
  }
  const match = item.licenseSummary.savingLabel.match(/([\d.]+)/);
  return match ? Number(match[1]) : 0;
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
      return { label: "Continue", href: pathFor(lastAllowedRoute(item), item.id) };
    case "Awaiting TR approval":
      return { label: "Review TR", href: pathFor("tr", item.id) };
    case "Analysis failed":
      return { label: "Re-run analysis", href: pathFor("license", item.id) };
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
