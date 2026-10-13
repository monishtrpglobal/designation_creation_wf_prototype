import type { BadgeVariant } from "@/ds/Badge";
import type { RoleRuntimeStatus } from "@/state/model";
import { optionBDetail, type OptionBPhase } from "@/features/designation/roles/rolesView";

export const sapRoleIdMax = 30;
export const linkPageSize = 25;

export const sampleRoleIdPaste = [
  "Procurement Analyst\tZ_FI_PRC_ANL_1000",
  "Fixed Assets Approver\tZ_FI_FA_APR_1000",
  "Corporate Treasury and Cash Positioning Analyst, Intercompany Netting and Bank Account Management\tZ_FI_TREASURY_CASH_NETTING_POSITION_DRAFT",
  "Unknown Role X\tZ_FI_X_DRAFT",
].join("\n");

export type PasteKind = "matched" | "too-long" | "not-found" | "validated" | "duplicate" | "empty";

export type PasteRole = {
  id: string;
  label: string;
  status: RoleRuntimeStatus;
};

export type PasteRow = {
  label: string;
  sapRoleId: string;
  kind: PasteKind;
  roleId?: string;
  detail: string;
};

export function parseRoleIdPaste(text: string, roles: PasteRole[]): PasteRow[] {
  const byLabel = new Map(roles.map((role) => [role.label.trim().toLowerCase(), role]));
  const seen = new Set<string>();
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const tabbed = line.includes("\t");
      const parts = (tabbed ? line.split("\t") : line.split(","))
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
      if (parts.length < 2) {
        return {
          label: line,
          sapRoleId: "",
          kind: "empty" as const,
          detail: "Each row needs a role name and a SAP role ID.",
        };
      }
      const sapRoleId = parts[parts.length - 1] ?? "";
      const label = parts.slice(0, -1).join(tabbed ? "\t" : ", ");
      const role = byLabel.get(label.toLowerCase());
      if (!role) {
        return {
          label,
          sapRoleId,
          kind: "not-found" as const,
          detail: `${label} is not in the ${roles.length} new roles`,
        };
      }
      if (role.status === "Validated") {
        return {
          label,
          sapRoleId,
          kind: "validated" as const,
          roleId: role.id,
          detail: `${label} is already validated and stays locked.`,
        };
      }
      const key = sapRoleId.toUpperCase();
      if (seen.has(key)) {
        return {
          label,
          sapRoleId,
          kind: "duplicate" as const,
          roleId: role.id,
          detail: `${sapRoleId} is already in this paste.`,
        };
      }
      seen.add(key);
      if (sapRoleId.length > sapRoleIdMax) {
        return {
          label,
          sapRoleId,
          kind: "too-long" as const,
          roleId: role.id,
          detail: `${sapRoleId} has ${sapRoleId.length} characters (max ${sapRoleIdMax})`,
        };
      }
      return { label, sapRoleId, kind: "matched" as const, roleId: role.id, detail: label };
    });
}

export function phaseBadge(phase: OptionBPhase): { label: string; variant: BadgeVariant } {
  switch (phase) {
    case "before-send":
      return { label: "Not started", variant: "pending" };
    case "awaiting":
      return { label: "Awaiting SAP", variant: "warning" };
    case "linking":
      return { label: "Linking roles", variant: "in-progress" };
    case "gaps":
      return { label: "Gaps found", variant: "error" };
    case "validated":
      return { label: "All validated", variant: "completed" };
  }
}

export function needsAttention(status: RoleRuntimeStatus) {
  return status === "Needed" || status === "Gap found" || status === "Too long";
}

export function gapSentence(roleId: string) {
  return optionBDetail("gaps", "Gap found", "", roleId);
}
