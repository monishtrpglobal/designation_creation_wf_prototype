import type { BadgeVariant } from "@/ds/Badge";
import { finalizationFile, rolesFile, type FinalizationConflict, type SodRisk } from "@/mock";
import type { SodDecision } from "@/state/model";

export const sodRoleTotal = rolesFile.newRoles.length + rolesFile.existingRoles.length;

const featuredRoleIds = ["existing-01", "existing-02", "new-05", "new-01", "new-34", "existing-04"];

export type CheckPhase = "checked" | "checking" | "queued";

export type CheckRole = {
  id: string;
  label: string;
  detail: string;
};

export type ConflictFilter = "all" | "open" | "High" | "Medium" | "Low";

export function roleCheckList(): CheckRole[] {
  const all = [...rolesFile.existingRoles, ...rolesFile.newRoles];
  const byId = new Map(all.map((role) => [role.id, role]));
  const featured = featuredRoleIds.flatMap((id) => {
    const role = byId.get(id);
    return role ? [role] : [];
  });
  const rest = all.filter((role) => !featuredRoleIds.includes(role.id));
  return [...featured, ...rest].map((role) => ({
    id: role.id,
    label: role.businessLabel,
    detail: `${role.sapRoleName} · ${role.kind === "existing" ? "Existing" : "New"}`,
  }));
}

export function phaseFor(index: number, checked: number, running: boolean): CheckPhase {
  if (index < checked) {
    return "checked";
  }
  if (running && checked < sodRoleTotal && index === checked) {
    return "checking";
  }
  return "queued";
}

export function visibleConflicts(clearedIds: string[]) {
  const cleared = new Set(clearedIds);
  return finalizationFile.conflicts.filter((conflict) => !cleared.has(conflict.id));
}

export function decisionOf(conflict: FinalizationConflict, decisions: Record<string, SodDecision>) {
  return decisions[conflict.id]?.decision ?? conflict.initialDecision;
}

export function justificationOf(conflict: FinalizationConflict, decisions: Record<string, SodDecision>) {
  return decisions[conflict.id]?.justification ?? conflict.justification;
}

export function isOpenDecision(decision: SodDecision["decision"]) {
  return decision === "pending" || decision === "mitigate" || decision === "accept";
}

export function riskVariant(risk: SodRisk): BadgeVariant {
  if (risk === "High") {
    return "error";
  }
  if (risk === "Medium") {
    return "warning";
  }
  return "info";
}

export function decisionBadge(decision: SodDecision["decision"]): { label: string; variant: BadgeVariant } {
  if (decision === "whitelist") {
    return { label: "Whitelisted", variant: "completed" };
  }
  if (decision === "mitigate") {
    return { label: "Remediating", variant: "in-progress" };
  }
  return { label: "Open", variant: "warning" };
}

export function riskRank(risk: SodRisk) {
  if (risk === "High") {
    return 0;
  }
  if (risk === "Medium") {
    return 1;
  }
  return 2;
}
