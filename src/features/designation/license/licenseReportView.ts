import type { DrawerFooterStatus } from "@/ds/DrawerFooterSummary";
import { licenseFile, sodFile, type LicenseChange, type LicenseMixSegment, type LicenseRoleLine, type SodConflict, type SodSummary } from "@/mock";
import { formatUpdated } from "@/features/designation/catalogue/catalogueView";
import type { DesignationRuntime } from "@/state/model";

export type LicenseRoleFilter = "all" | LicenseChange;

export const licenseRoleFilters: { value: LicenseRoleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "downgrade", label: "Downgraded" },
  { value: "unchanged", label: "Unchanged" },
  { value: "flagged", label: "Flagged for review" },
];

export type LicenseReport = {
  beforeLabel: string;
  afterLabel: string;
  savingLabel: string;
  savingPercent: number;
  beforeLakhs: number;
  afterLakhs: number;
  lastRunLabel: string;
  mix: LicenseMixSegment[];
  roles: LicenseRoleLine[];
};

export function showsLicenseReport(item: DesignationRuntime): boolean {
  return (
    item.status === "Awaiting final approval" &&
    item.steps.license &&
    item.approval.license === "completed" &&
    item.licenseSummary !== null
  );
}

function lakhsFromLabel(label: string): number {
  const match = label.match(/([\d.]+)/);
  return match ? Number(match[1]) : 0;
}

function formatLastRun(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatUpdated(iso)}, ${hours}:${minutes}`;
}

export function licenseReportFor(item: DesignationRuntime): LicenseReport | null {
  const summary = item.licenseSummary;
  if (!summary) {
    return null;
  }
  const seed = licenseFile.analyses.find((analysis) => analysis.designationId === item.id);
  return {
    beforeLabel: summary.beforeLabel,
    afterLabel: summary.afterLabel,
    savingLabel: summary.savingLabel,
    savingPercent: summary.savingPercent,
    beforeLakhs: seed?.beforeLakhs ?? lakhsFromLabel(summary.beforeLabel),
    afterLakhs: seed?.afterLakhs ?? lakhsFromLabel(summary.afterLabel),
    lastRunLabel: formatLastRun(summary.lastRunAt ?? item.updatedAt),
    mix: seed?.mix ?? [],
    roles: seed?.roles ?? [],
  };
}

export function roleCounts(roles: LicenseRoleLine[]): Record<LicenseRoleFilter, number> {
  return {
    all: roles.length,
    downgrade: roles.filter((role) => role.change === "downgrade").length,
    unchanged: roles.filter((role) => role.change === "unchanged").length,
    flagged: roles.filter((role) => role.change === "flagged").length,
  };
}

export function filterRoles(roles: LicenseRoleLine[], filter: LicenseRoleFilter): LicenseRoleLine[] {
  if (filter === "all") {
    return roles;
  }
  return roles.filter((role) => role.change === filter);
}

export function compareRoles(left: LicenseRoleLine, right: LicenseRoleLine, key: string): number {
  if (key === "role") {
    return left.roleName.localeCompare(right.roleName);
  }
  if (key === "saving") {
    const leftValue = left.savingPercent ?? -1;
    const rightValue = right.savingPercent ?? -1;
    return leftValue - rightValue;
  }
  return 0;
}

export function changeStateLabel(counts: Record<LicenseRoleFilter, number>): string {
  return `${counts.downgrade} downgraded · ${counts.flagged} flagged`;
}

export function sodConflictsFor(designationId: string): SodConflict[] {
  return sodFile.conflicts.filter((conflict) => conflict.designationId === designationId);
}

export function sodFooter(summary: SodSummary | null): { status: DrawerFooterStatus; label: string } {
  const high = summary?.high ?? 0;
  const medium = summary?.medium ?? 0;
  const low = summary?.low ?? 0;
  if (high + medium + low === 0) {
    return { status: "success", label: "No open SoD risk." };
  }
  const lead = high > 0 ? `${high} high SoD ${high === 1 ? "risk" : "risks"}` : "Open SoD risk";
  return {
    status: "warning",
    label: `${lead} (High ${high} · Medium ${medium} · Low ${low}). You confirm it on the next step.`,
  };
}
