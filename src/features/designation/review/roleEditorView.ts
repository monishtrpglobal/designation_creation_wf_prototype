import { activitiesFile, roleEditorFile } from "@/mock";
import type { BadgeVariant } from "@/ds/Badge";
import type { RoleEditorAuth, RoleEditorTcode } from "@/mock/types";
import { emptyRoleEditor } from "@/state/flowStore";
import type { OrgValue, RoleEditorOverride } from "@/state/model";
import { openOrgRoleId, sampleReviewRoleId } from "@/state/seed";

export type EditorTab = "tcodes" | "authorizations" | "org";

export type OrgEditorRow = {
  id: string;
  name: string;
  value: OrgValue;
  fields: number;
};

const leaseRoleId = sampleReviewRoleId;

export function editorOverride(overrides: Record<string, RoleEditorOverride> | undefined, roleId: string) {
  return overrides?.[roleId] ?? emptyRoleEditor();
}

export function isRevenueRole(roleId: string) {
  return roleId === openOrgRoleId;
}

export function isLeaseRole(roleId: string) {
  return roleId === leaseRoleId;
}

export function baseTcodeIds(roleId: string) {
  if (isLeaseRole(roleId)) {
    return roleEditorFile.lease.tcodeIds;
  }
  return roleEditorFile.revenue.tcodeIds;
}

export function tcodeByCode(code: string): RoleEditorTcode | undefined {
  const known = roleEditorFile.tcodes.find((item) => item.code === code);
  if (known) {
    return known;
  }
  const extra = roleEditorFile.knownTcodes.find((item) => item.code === code);
  if (!extra) {
    return undefined;
  }
  return {
    id: extra.code,
    code: extra.code,
    description: extra.description,
    manual: true,
    authCount: 2,
    sample: true,
  };
}

export function visibleTcodes(roleId: string, editor: RoleEditorOverride): RoleEditorTcode[] {
  const ids = [
    ...baseTcodeIds(roleId).filter((id) => !editor.removedTcodeIds.includes(id)),
    ...editor.addedTcodeIds,
  ];
  return ids.flatMap((id) => {
    const row = tcodeByCode(id);
    return row ? [row] : [];
  });
}

export function visibleAuth(roleId: string, editor: RoleEditorOverride): RoleEditorAuth[] {
  const base = roleEditorFile.revenue.authObjects.filter((item) =>
    isLeaseRole(roleId) ? roleEditorFile.lease.authIds.includes(item.id) : true,
  );
  const rows = base
    .filter((item) => !editor.removedAuthIds.includes(item.id))
    .map((item) =>
      editor.inactiveAuthIds.includes(item.id) ? { ...item, status: "Inactive" as const, isNew: false } : item,
    );
  const added: RoleEditorAuth[] = editor.addedAuth.map((item) => ({
    id: item.id,
    name: item.name,
    class: item.class,
    description: item.description,
    status: "Manual",
    isNew: true,
    fields: "Entered manually",
    sample: true,
    editor: "checklist",
  }));
  return [...rows, ...added];
}

export function orgRows(roleId: string, orgLevels: Record<string, OrgValue>): OrgEditorRow[] {
  const ids = isLeaseRole(roleId) ? roleEditorFile.lease.orgLevelIds : roleEditorFile.orgOrder;
  return ids.map((id) => {
    const catalogue = activitiesFile.orgLevels.find((item) => item.id === id);
    const stored = orgLevels[id];
    const value: OrgValue = isLeaseRole(roleId)
      ? (stored && stored.kind !== "open" ? stored : { kind: "values", values: catalogue?.values ?? ["1000"] })
      : (stored ?? { kind: "open" });
    return {
      id,
      name: catalogue?.name ?? id,
      value,
      fields: roleEditorFile.fieldCounts[id] ?? catalogue?.values.length ?? 0,
    };
  });
}

export function openOrgIds(rows: OrgEditorRow[]) {
  return rows.filter((row) => row.value.kind === "open").map((row) => row.id);
}

export function changeCount(roleId: string, editor: RoleEditorOverride) {
  const base = isLeaseRole(roleId) ? roleEditorFile.lease.changes : roleEditorFile.revenue.changes;
  return base + editor.extraChanges;
}

export function summaryLabel(tcodes: number, auth: number, org: number) {
  return `${tcodes} T-codes · ${auth} auth objects · ${org} org levels`;
}

export function authBadgeVariant(status: RoleEditorAuth["status"]): BadgeVariant {
  if (status === "Maintained") {
    return "completed";
  }
  if (status === "Changed") {
    return "dot";
  }
  if (status === "Manual") {
    return "outline";
  }
  if (status === "Inactive") {
    return "pending";
  }
  if (status === "Open") {
    return "warning";
  }
  return "light";
}

export function orgStatus(value: OrgValue): { label: string; variant: BadgeVariant } {
  if (value.kind === "open") {
    return { label: "Open", variant: "warning" };
  }
  if (value.kind === "wildcard") {
    return { label: "Wildcard", variant: "warning" };
  }
  return { label: "Maintained", variant: "completed" };
}

export function orgValueLabels(value: OrgValue): string[] {
  if (value.kind === "open") {
    return [];
  }
  if (value.kind === "range") {
    return [`${value.from}–${value.to}`];
  }
  return value.values;
}

export function knownTcodeCodes() {
  const codes = new Set<string>([
    ...roleEditorFile.tcodes.map((item) => item.code),
    ...roleEditorFile.knownTcodes.map((item) => item.code),
    ...activitiesFile.tcodes.map((item) => item.code),
  ]);
  return codes;
}

export type PasteKind = "valid" | "already" | "missing";

export function classifyPaste(text: string, existing: string[]): { code: string; kind: PasteKind }[] {
  const tokens = text
    .split(/[\s,;]+/)
    .map((item) => item.trim().toUpperCase())
    .filter((item) => item.length > 0);
  const unique = [...new Set(tokens)].slice(0, 100);
  const known = knownTcodeCodes();
  return unique.map((code) => {
    if (existing.includes(code)) {
      return { code, kind: "already" as const };
    }
    if (!known.has(code)) {
      return { code, kind: "missing" as const };
    }
    return { code, kind: "valid" as const };
  });
}
