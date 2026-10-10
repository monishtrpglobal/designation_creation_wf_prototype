import type { BadgeVariant } from "@/ds/Badge";
import { statusBadge, type BadgeStatus } from "@/ds/statusMap";
import type { RoleRuntimeStatus } from "@/state/model";

export const sampleTr = "DEVK900125";

const issueStatuses = new Set<RoleRuntimeStatus>(["Error", "Name clash", "Too long", "Failed"]);
const progressStatuses = new Set<RoleRuntimeStatus>(["Creating", "Queued"]);
const createdStatuses = new Set<RoleRuntimeStatus>(["Created"]);

const statusRank: Record<RoleRuntimeStatus, number> = {
  Error: 0,
  Failed: 0,
  "Name clash": 1,
  "Too long": 1,
  Creating: 3,
  Queued: 3,
  Ready: 4,
  Needed: 4,
  "ID entered": 4,
  Validated: 4,
  "Gap found": 4,
  Created: 5,
};

export function isIssue(status: RoleRuntimeStatus) {
  return issueStatuses.has(status);
}

export function isInProgress(status: RoleRuntimeStatus) {
  return progressStatuses.has(status);
}

export function isCreated(status: RoleRuntimeStatus) {
  return createdStatuses.has(status);
}

export function badgeLabel(status: RoleRuntimeStatus) {
  if (status === "Failed") {
    return "Error";
  }
  return status;
}

export function badgeVariant(status: RoleRuntimeStatus): BadgeVariant {
  if (status === "Failed") {
    return "error";
  }
  return statusBadge(status as BadgeStatus);
}

export function roleDetail(status: RoleRuntimeStatus, sapName: string, retried: boolean) {
  if (status === "Error") {
    return "SAP returned an error while reading this role";
  }
  if (status === "Name clash") {
    return "Suggested name already exists in SAP";
  }
  if (status === "Too long") {
    return `Name is ${sapName.length} characters; SAP allows 30`;
  }
  if (status === "Failed") {
    return "SAP API: authorisation error";
  }
  if (status === "Creating") {
    return "Calling SAP API";
  }
  if (status === "Queued") {
    return retried ? "Retry requested" : "Queued";
  }
  if (status === "Created") {
    return retried ? "Created on retry" : `TR ${sampleTr}`;
  }
  return "";
}

export function compareStatus(left: RoleRuntimeStatus, right: RoleRuntimeStatus) {
  return statusRank[left] - statusRank[right];
}

export function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
