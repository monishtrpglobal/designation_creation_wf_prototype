import type { AuthClass, AuthObjectStatus, LicenseSummary, LifecycleStatus, SodRisk, SodSummary } from "@/mock";

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
  | "Error"
  | "Queued"
  | "Creating"
  | "Syncing"
  | "Created"
  | "Failed"
  | "Needed"
  | "Awaiting SAP"
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

export type SodSimulation = {
  status: "idle" | "running" | "completed";
  checked: number;
  conflictsFound: number;
  clearedIds: string[];
};

export type ApprovalState = {
  tr: "none" | "awaiting" | "approved";
  trNumber: string | null;
  /** How many of the 50 transport requests have been imported into Quality. */
  trImported: number;
  /** True while a movement started in this session is still importing. */
  trImportLive: boolean;
  trRejectReason: string;
  license: "none" | "running" | "completed" | "failed";
  licenseProgress: number;
  licenseLive: boolean;
  final: "none" | "awaiting" | "published" | "rejected";
  finalComment: string;
  /** Admin ticked the SoD acknowledgement on Screen 16. */
  finalAcknowledged: boolean;
  finalAcknowledgedBy: string | null;
  finalAcknowledgedAt: string | null;
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

export type AuthRangeValue = { mode: "one" | "range" | "all"; from: string; to: string };

export type AddedAuthObject = {
  id: string;
  name: string;
  class: AuthClass;
  description: string;
};

export type RoleEditorOverride = {
  addedTcodeIds: string[];
  removedTcodeIds: string[];
  inactiveAuthIds: string[];
  removedAuthIds: string[];
  addedAuth: AddedAuthObject[];
  tcodeObjects: Record<string, string[]>;
  authActivities: Record<string, string[]>;
  authRanges: Record<string, AuthRangeValue>;
  extraChanges: number;
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
  roleRetried: Record<string, boolean>;
  roleSapNames: Record<string, string>;
  roleDescriptions: Record<string, string>;
  optionBRoleIds: Record<string, string>;
  optionBGapReportSent?: boolean;
  orgLevels: Record<string, OrgValue>;
  roleEditors: Record<string, RoleEditorOverride>;
  creation: CreationProgress;
  creationLive: boolean;
  taxFailurePending: boolean;
  sodSim: SodSimulation;
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
