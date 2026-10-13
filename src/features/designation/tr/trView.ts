import { rolesFile } from "@/mock";
import type { FlowMethod } from "@/state/model";

export const trRequestId = "REQ-0001";
export const trRouteLabel = "SAP DEV → SAP QUALITY";
export const trWindowSize = 5;
export const trImportingWindow = 5;

export const trTotal = rolesFile.newRoles.length;

export type TrRowStatus = "Released" | "Imported" | "Importing" | "Queued";

export type TrRow = {
  id: string;
  number: string;
  roleId: string;
  createdBy: string;
  status: TrRowStatus;
};

export type TrImportCounts = {
  imported: number;
  importing: number;
  queued: number;
  total: number;
};

/**
 * TODO(confirm): Figma sample shows Sec. team on Procurement Lead.
 * This prototype's Procurement Lead is Option A, so that row reads Platform.
 */
export function createdByLabel(method: FlowMethod | null): string {
  return method === "B" ? "Sec. team" : "Platform";
}

export function importCounts(imported: number, total = trTotal): TrImportCounts {
  const safe = Math.min(total, Math.max(0, imported));
  const remaining = total - safe;
  const importing = Math.min(trImportingWindow, remaining);
  return { imported: safe, importing, queued: remaining - importing, total };
}

export function trRows(method: FlowMethod | null, imported: number | null): TrRow[] {
  const createdBy = createdByLabel(method);
  const counts = imported === null ? null : importCounts(imported);
  return rolesFile.newRoles.map((role, index) => {
    let status: TrRowStatus = "Released";
    if (counts) {
      if (index < counts.imported) {
        status = "Imported";
      } else if (index < counts.imported + counts.importing) {
        status = "Importing";
      } else {
        status = "Queued";
      }
    }
    return {
      id: role.id,
      number: `DEVK${900101 + index}`,
      roleId: role.sapRoleName,
      createdBy,
      status,
    };
  });
}

export function visibleRange(scrollTop: number, rowHeight: number, total = trTotal, windowSize = trWindowSize) {
  const height = rowHeight > 0 ? rowHeight : 1;
  const maxStart = Math.max(0, total - windowSize);
  const start = Math.min(maxStart, Math.max(0, Math.floor(scrollTop / height)));
  const end = Math.min(total, start + windowSize);
  return { start: start + 1, end: Math.max(start + 1, end) };
}

export function scrollTopForWindow(imported: number, rowHeight: number, total = trTotal, windowSize = trWindowSize) {
  const startIndex = Math.max(0, Math.min(imported - 2, total - windowSize));
  return startIndex * rowHeight;
}

export type TrTrackState = "pending" | "active" | "done";

export function movementTrack(imported: number, total = trTotal): {
  starting: TrTrackState;
  afterStarting: "pending" | "done";
  importing: TrTrackState;
  afterImporting: "pending" | "done";
  completed: TrTrackState;
} {
  if (imported >= total) {
    return {
      starting: "done",
      afterStarting: "done",
      importing: "done",
      afterImporting: "done",
      completed: "done",
    };
  }
  if (imported <= 0) {
    return {
      starting: "active",
      afterStarting: "pending",
      importing: "pending",
      afterImporting: "pending",
      completed: "pending",
    };
  }
  return {
    starting: "done",
    afterStarting: "done",
    importing: "active",
    afterImporting: "pending",
    completed: "pending",
  };
}

export function showsTrDialog(status: string): boolean {
  return status === "Awaiting TR approval" || status === "Moving to Quality";
}

let pendingCatalogueFocusId: string | null = null;

export function queueCatalogueFocus(id: string) {
  pendingCatalogueFocusId = id;
}

export function takeCatalogueFocus(): string | null {
  const id = pendingCatalogueFocusId;
  pendingCatalogueFocusId = null;
  return id;
}

export function catalogueActionId(id: string) {
  return `catalogue-action-${id}`;
}
