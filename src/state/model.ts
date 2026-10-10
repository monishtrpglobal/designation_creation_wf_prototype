import type { AuthObjectStatus, LicenseSummary, LifecycleStatus, SodRisk, SodSummary } from "@/mock";

export type FlowMethod = "A" | "B";

export type SyncState = {
  status: "idle" | "running" | "completed" | "failed";
  progress: number;
  message: string;
  live: boolean;
};

export type RoleRuntimeStatus =
  | "Ready"
  | "Name clash"
  | "Too long"
  | "Queued"
  | "Creating"
  | "Created"
  | "Failed"
  | "Needed"
  | "ID entered"
  | "Validated"
  | "Gap found";

export type OrgValue =
  | { kind: "open" }
  | { kind: "wildcard"; values: string[] }
  | { kind: "values"; values: string[] }
  | { kind: "range"; from: string; to: string };

export type SodDecision = {
  conflictId: string;
  risk: SodRisk;
  decision: "pending" | "whitelist" | "mitigate" | "accept";
  justification: string;
  whitelistedBy: string | null;
  whitelistedAt: string | null;
};

export type ApprovalState = {
  tr: "none" | "awaiting" | "approved";
  trNumber: string | null;
  license: "none" | "running" | "completed" | "failed";
  licenseProgress: number;
  licenseLive: boolean;
  final: "none" | "awaiting" | "published" | "rejected";
  finalComment: string;
};

export type StepFlags = {
  name: boolean;
  activities: boolean;
  sync: boolean;
  roles: boolean;
  finalize: boolean;
  tr: boolean;
  license: boolean;
};

export type CreationProgress = {
  completed: number;
  total: number;
  failed: number;
};

export type ActivityEdit = {
  tcodeIds: string[];
  authObjectIds: string[];
  orgLevels: {
    id: string;
    name: string;
    state: "open" | "values" | "range" | "wildcard";
    values: string[];
    from?: string;
    to?: string;
  }[];
  tcodeObjects: Record<string, string[]>;
  authActivities: Record<string, string[]>;
  authStatus: Record<string, AuthObjectStatus>;
};

export type DesignationRuntime = {
  id: string;
  name: string;
  businessArea: string;
  status: LifecycleStatus;
  updatedAt: string;
  sample: boolean;
  licenseSummary: LicenseSummary | null;
  sodSummary: SodSummary | null;
  selectedActivityIds: string[];
  activityEdits?: Record<string, ActivityEdit>;
  method: FlowMethod | null;
  methodLocked: boolean;
  sync: SyncState;
  roleStatuses: Record<string, RoleRuntimeStatus>;
  roleSapNames: Record<string, string>;
  optionBRoleIds: Record<string, string>;
  orgLevels: Record<string, OrgValue>;
  creation: CreationProgress;
  creationLive: boolean;
  taxFailurePending: boolean;
  sodDecisions: Record<string, SodDecision>;
  approval: ApprovalState;
  steps: StepFlags;
};

export type FlowRoute =
  | "catalogue"
  | "name"
  | "activities"
  | "sync"
  | "roles"
  | "review"
  | "link"
  | "finalize"
  | "tr"
  | "license"
  | "approve";
