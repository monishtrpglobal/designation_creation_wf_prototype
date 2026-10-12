import type { BadgeVariant } from "@/ds/Badge";
import { statusBadge, type BadgeStatus } from "@/ds/statusMap";
import { rolesFile } from "@/mock";
import type { FlowMethod, RoleRuntimeStatus } from "@/state/model";

export const creationFailureIds = ["new-08", "new-27"] as const;
export const creationCreatingIds = ["new-03", "new-29", "new-30", "new-31", "new-32"] as const;
export const creationSyncingIds = ["new-04", "new-11", "new-12", "new-13", "new-14"] as const;

const issueStatuses = new Set<RoleRuntimeStatus>(["Error", "Name clash", "Too long", "Failed"]);
const progressStatuses = new Set<RoleRuntimeStatus>(["Creating", "Queued", "Syncing"]);
const createdStatuses = new Set<RoleRuntimeStatus>(["Created"]);

const statusRank: Record<RoleRuntimeStatus, number> = {
  Error: 0,
  Failed: 0,
  "Name clash": 1,
  "Too long": 1,
  "Gap found": 2,
  Creating: 3,
  Queued: 3,
  "Awaiting SAP": 4,
  Needed: 4,
  Syncing: 4,
  "ID entered": 5,
  Ready: 5,
  Validated: 6,
  Created: 6,
};

export type OptionBPhase = "before-send" | "awaiting" | "linking" | "gaps" | "validated";

export type OptionBFilter = "all" | "needed" | "awaiting" | "entered" | "gap" | "validated";

export const optionBGapRoleIds = ["new-03", "new-29"] as const;
export const optionBLinkedCount = 12;

export function optionBPhase(
  method: FlowMethod | null,
  methodLocked: boolean,
  statuses: RoleRuntimeStatus[],
): OptionBPhase | null {
  if (method !== "B") {
    return null;
  }
  if (!methodLocked) {
    return "before-send";
  }
  if (statuses.length > 0 && statuses.every((status) => status === "Validated")) {
    return "validated";
  }
  if (statuses.some((status) => status === "Gap found")) {
    return "gaps";
  }
  if (statuses.some((status) => status === "Needed" || status === "ID entered")) {
    return "linking";
  }
  return "awaiting";
}

export function displayedRoleStatus(status: RoleRuntimeStatus, phase: OptionBPhase | null): RoleRuntimeStatus {
  if (phase === "before-send") {
    return "Needed";
  }
  return status;
}

export function optionBShowsActions(phase: OptionBPhase) {
  return phase === "linking" || phase === "gaps" || phase === "validated";
}

export function optionBDetail(phase: OptionBPhase, status: RoleRuntimeStatus, enteredId: string, roleId: string) {
  if (phase === "before-send") {
    return "Waiting for the security team to build this role";
  }
  if (status === "Awaiting SAP") {
    return "Security team is building this role in SAP";
  }
  if (status === "Needed") {
    return "SAP role ID not entered yet";
  }
  if (status === "ID entered") {
    return enteredId ? `Entered · ${enteredId}` : "SAP role ID entered";
  }
  if (status === "Gap found") {
    return (optionBGapRoleIds as readonly string[]).includes(roleId)
      ? "2 T-codes missing, 1 excess auth object"
      : "Does not match the requirement";
  }
  if (status === "Validated") {
    return "Matches the requirement";
  }
  return "";
}

const failureTr: Record<string, string> = {
  "new-08": "DEVK900152",
  "new-27": "DEVK900153",
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

function numberedTr(start: number, index: number) {
  return `DEVK900${start + Math.max(index, 0)}`;
}

export function transportNumber(roleId: string, status: RoleRuntimeStatus, allSettled: boolean) {
  const failed = failureTr[roleId];
  if (failed && (status === "Created" || status === "Failed" || allSettled)) {
    return failed;
  }
  if (!allSettled && status === "Syncing") {
    const syncingIndex = creationSyncingIds.indexOf(roleId as (typeof creationSyncingIds)[number]);
    return numberedTr(131, syncingIndex);
  }
  if (!allSettled && status === "Created") {
    const skip = new Set<string>([...creationFailureIds, ...creationCreatingIds, ...creationSyncingIds]);
    const createdIndex = rolesFile.newRoles.filter((role) => !skip.has(role.id)).findIndex((role) => role.id === roleId);
    return numberedTr(101, createdIndex);
  }
  const skipFailures = new Set<string>(creationFailureIds);
  const settledIndex = rolesFile.newRoles
    .filter((role) => !skipFailures.has(role.id))
    .findIndex((role) => role.id === roleId);
  return numberedTr(101, settledIndex);
}

export function roleDetail(
  status: RoleRuntimeStatus,
  sapName: string,
  retried: boolean,
  roleId = "",
  allSettled = false,
) {
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
  if (status === "Syncing" || status === "Created") {
    const tr = `TR ${transportNumber(roleId, status, allSettled)}`;
    return status === "Created" && retried ? `${tr} · created on retry` : tr;
  }
  return "";
}

export function compareStatus(left: RoleRuntimeStatus, right: RoleRuntimeStatus) {
  return statusRank[left] - statusRank[right];
}

export function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function creationStatusFor(roleId: string): RoleRuntimeStatus {
  if ((creationFailureIds as readonly string[]).includes(roleId)) {
    return "Failed";
  }
  if ((creationCreatingIds as readonly string[]).includes(roleId)) {
    return "Creating";
  }
  if ((creationSyncingIds as readonly string[]).includes(roleId)) {
    return "Syncing";
  }
  return "Created";
}

export function shouldFailCreation(roleId: string, retried: boolean) {
  return (creationFailureIds as readonly string[]).includes(roleId) && !retried;
}
