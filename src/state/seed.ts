import { activitiesFile, designations, rolesFile, sodFile, type LifecycleStatus } from "@/mock";
import type {
  ApprovalState,
  CreationProgress,
  DesignationRuntime,
  OrgValue,
  RoleRuntimeStatus,
  SodDecision,
  StepFlags,
  SyncState,
} from "./model";

const activityIds = {
  inventory: ["inventory-material-ledger", "general-ledger", "tax"],
  revenue: ["revenue-recognition"],
  maintenance: ["asset-accounting"],
  payables: ["account-payable", "general-ledger"],
  ledger: ["general-ledger"],
  tax: ["tax", "general-ledger"],
  assets: ["asset-accounting"],
  billing: ["revenue-recognition", "account-receivable"],
} as const;

function emptySteps(): StepFlags {
  return {
    name: false,
    activities: false,
    sync: false,
    roles: false,
    finalize: false,
    tr: false,
    license: false,
  };
}

function stepsFor(status: LifecycleStatus): StepFlags {
  const done: StepFlags = {
    name: true,
    activities: true,
    sync: true,
    roles: true,
    finalize: true,
    tr: true,
    license: true,
  };
  switch (status) {
    case "Draft":
      return { ...emptySteps(), name: true };
    case "Syncing to Dev":
      return { ...emptySteps(), name: true, activities: true };
    case "In progress":
      return { ...emptySteps(), name: true, activities: true, sync: true };
    case "Completed":
      return { ...done, tr: false, license: false };
    case "Awaiting TR approval":
      return { ...done, tr: false, license: false };
    case "Moving to Quality":
    case "License analysis running":
    case "Analysis failed":
      return { ...done, license: false };
    case "Awaiting final approval":
    case "Rejected":
    case "Published":
      return done;
    default:
      return emptySteps();
  }
}

function orgValueFromCatalogue(levelId: string): OrgValue {
  const level = activitiesFile.orgLevels.find((item) => item.id === levelId);
  if (!level || level.state === "open") {
    return { kind: "open" };
  }
  if (level.state === "wildcard") {
    return { kind: "wildcard", values: [...level.values] };
  }
  if (level.state === "range") {
    return { kind: "range", from: level.from ?? "", to: level.to ?? "" };
  }
  return { kind: "values", values: [...level.values] };
}

function initialOrgLevels(rolesComplete: boolean): Record<string, OrgValue> {
  const orgLevels: Record<string, OrgValue> = {};
  for (const level of activitiesFile.orgLevels) {
    orgLevels[level.id] = orgValueFromCatalogue(level.id);
  }
  if (rolesComplete) {
    orgLevels.KOKRS = { kind: "values", values: ["1000"] };
    orgLevels.WERKS = { kind: "values", values: ["1000"] };
  }
  return orgLevels;
}

function fixedSapName(sapRoleName: string, status: string): string {
  if (status === "Too long") {
    return "CORP_TREASURY_CASH_POS";
  }
  if (status === "Name clash") {
    return `${sapRoleName}_2`.slice(0, 30);
  }
  return sapRoleName;
}

function roleState(rolesComplete: boolean, method: "A" | "B" | null) {
  const roleStatuses: Record<string, RoleRuntimeStatus> = {};
  const roleSapNames: Record<string, string> = {};
  const optionBRoleIds: Record<string, string> = {};
  for (const role of rolesFile.newRoles) {
    roleSapNames[role.id] = rolesComplete ? fixedSapName(role.sapRoleName, role.status) : role.sapRoleName;
    if (!rolesComplete) {
      roleStatuses[role.id] = role.status;
      continue;
    }
    if (method === "B") {
      roleStatuses[role.id] = "Validated";
      optionBRoleIds[role.id] = roleSapNames[role.id] ?? role.sapRoleName;
      continue;
    }
    roleStatuses[role.id] = "Created";
  }
  return { roleStatuses, roleSapNames, optionBRoleIds };
}

function syncFor(status: LifecycleStatus): SyncState {
  if (status === "Draft") {
    return { status: "idle", progress: 0, message: "", live: false };
  }
  if (status === "Syncing to Dev") {
    return { status: "running", progress: 40, message: "Syncing", live: false };
  }
  if (status === "In progress") {
    return { status: "completed", progress: 100, message: "Completed", live: false };
  }
  return { status: "completed", progress: 100, message: "Completed", live: false };
}

function creationFor(rolesComplete: boolean): CreationProgress {
  const total = rolesFile.newRoles.length;
  return rolesComplete
    ? { completed: total, total, failed: 0 }
    : { completed: 0, total, failed: 0 };
}

function sodDecisionsFor(designationId: string): Record<string, SodDecision> {
  const decisions: Record<string, SodDecision> = {};
  for (const conflict of sodFile.conflicts) {
    if (conflict.designationId !== designationId) {
      continue;
    }
    decisions[conflict.id] = {
      conflictId: conflict.id,
      risk: conflict.risk,
      decision: conflict.whitelisted ? "whitelist" : "pending",
      justification: conflict.justification,
      whitelistedBy: conflict.whitelistedBy,
      whitelistedAt: conflict.whitelistedAt,
    };
  }
  return decisions;
}

function approvalFor(status: LifecycleStatus): ApprovalState {
  const base: ApprovalState = {
    tr: "none",
    trNumber: null,
    license: "none",
    licenseProgress: 0,
    licenseLive: false,
    final: "none",
    finalComment: "",
  };
  switch (status) {
    case "Awaiting TR approval":
      return { ...base, tr: "awaiting" };
    case "Moving to Quality":
      return { ...base, tr: "approved", trNumber: "DEVK900125" };
    case "License analysis running":
      return { ...base, tr: "approved", trNumber: "DEVK900125", license: "running", licenseProgress: 60 };
    case "Analysis failed":
      return { ...base, tr: "approved", trNumber: "DEVK900125", license: "failed", licenseProgress: 100 };
    case "Awaiting final approval":
      return {
        ...base,
        tr: "approved",
        trNumber: "DEVK900125",
        license: "completed",
        licenseProgress: 100,
        final: "awaiting",
      };
    case "Rejected":
      return {
        ...base,
        tr: "approved",
        trNumber: "DEVK900125",
        license: "completed",
        licenseProgress: 100,
        final: "rejected",
        finalComment: "Role scope is wider than the business request (sample data).",
      };
    case "Published":
      return {
        ...base,
        tr: "approved",
        trNumber: "DEVK900125",
        license: "completed",
        licenseProgress: 100,
        final: "published",
        finalComment: "Approved for publish (sample data).",
      };
    default:
      return base;
  }
}

function activitiesFor(id: string, status: LifecycleStatus): string[] {
  if (status === "Draft") {
    return [];
  }
  const map: Record<string, readonly string[]> = {
    "treasury-analyst": activityIds.ledger,
    "revenue-accountant": activityIds.revenue,
    "inventory-controller": activityIds.inventory,
    "sales-operations-manager": activityIds.billing,
    "tax-compliance-officer": activityIds.tax,
    "asset-accounting-lead": activityIds.assets,
    "credit-controller": activityIds.payables,
    "billing-specialist": activityIds.billing,
  };
  return [...(map[id] ?? activityIds.ledger)];
}

function methodFor(id: string, status: LifecycleStatus): { method: "A" | "B" | null; methodLocked: boolean } {
  if (status === "Draft" || status === "Syncing to Dev" || status === "In progress") {
    return { method: null, methodLocked: false };
  }
  if (id === "revenue-accountant") {
    return { method: "B", methodLocked: true };
  }
  return { method: "A", methodLocked: true };
}

export function buildDraft(id: string, name: string): DesignationRuntime {
  const steps = { ...emptySteps(), name: true };
  const roles = roleState(false, null);
  return {
    id,
    name,
    businessArea: "",
    status: "Draft",
    updatedAt: new Date().toISOString(),
    sample: false,
    licenseSummary: null,
    sodSummary: null,
    selectedActivityIds: [],
    method: null,
    methodLocked: false,
    sync: { status: "idle", progress: 0, message: "", live: false },
    ...roles,
    orgLevels: initialOrgLevels(false),
    creation: creationFor(false),
    creationLive: false,
    taxFailurePending: true,
    sodDecisions: {},
    approval: approvalFor("Draft"),
    steps,
  };
}

export function seedDesignations(): DesignationRuntime[] {
  return designations.map((seed) => {
    const steps = stepsFor(seed.status);
    const method = methodFor(seed.id, seed.status);
    const roles = roleState(steps.roles, method.method);
    return {
      id: seed.id,
      name: seed.name,
      businessArea: seed.businessArea,
      status: seed.status,
      updatedAt: seed.updatedAt,
      sample: seed.sample,
      licenseSummary: seed.license ?? null,
      sodSummary: seed.sodSummary ?? null,
      selectedActivityIds: activitiesFor(seed.id, seed.status),
      method: method.method,
      methodLocked: method.methodLocked,
      sync: syncFor(seed.status),
      ...roles,
      orgLevels: initialOrgLevels(steps.roles),
      creation: creationFor(steps.roles),
      creationLive: false,
      taxFailurePending: !steps.roles,
      sodDecisions: sodDecisionsFor(seed.id),
      approval: approvalFor(seed.status),
      steps,
    };
  });
}

export function settleInterrupted(designation: DesignationRuntime): DesignationRuntime {
  let next = designation;
  if (next.sync.live && next.sync.status === "running") {
    next = {
      ...next,
      status: "Draft",
      sync: { status: "failed", progress: next.sync.progress, message: "Failed", live: false },
    };
  }
  if (next.approval.licenseLive && next.approval.license === "running") {
    next = {
      ...next,
      status: "Analysis failed",
      approval: { ...next.approval, license: "failed", licenseLive: false },
      steps: { ...next.steps, license: false },
    };
  }
  if (next.creationLive) {
    const roleStatuses = { ...next.roleStatuses };
    for (const [roleId, status] of Object.entries(roleStatuses)) {
      if (status === "Creating" || status === "Queued") {
        roleStatuses[roleId] = "Failed";
      }
    }
    const failed = Object.values(roleStatuses).filter((status) => status === "Failed").length;
    next = {
      ...next,
      creationLive: false,
      roleStatuses,
      creation: { ...next.creation, failed },
    };
  }
  return next;
}
