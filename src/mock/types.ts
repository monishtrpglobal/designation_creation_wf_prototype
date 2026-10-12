export const lifecycleStatuses = [
  "Draft",
  "In progress",
  "Completed",
  "Syncing to Dev",
  "Awaiting TR approval",
  "Moving to Quality",
  "License analysis running",
  "Awaiting final approval",
  "Analysis failed",
  "Rejected",
  "Published",
] as const;

export type LifecycleStatus = (typeof lifecycleStatuses)[number];

export type LicenseSummary = {
  beforeLabel: string;
  afterLabel: string;
  savingLabel: string;
  savingPercent: number;
  /** ISO time of the last completed run. Omitted seeds fall back to the row's updated time. */
  lastRunAt?: string;
};

export type SodSummary = {
  high: number;
  medium: number;
  low: number;
};

export type DesignationSeed = {
  id: string;
  name: string;
  businessArea: string;
  status: LifecycleStatus;
  updatedAt: string;
  sample: boolean;
  license?: LicenseSummary;
  sodSummary?: SodSummary;
};

export type TCode = {
  id: string;
  code: string;
  description: string;
  manual: boolean;
};

export type AuthClass = "AAAB" | "FI" | "SD" | "CO" | "BC";

export type AuthObjectStatus = "Standard" | "Maintained" | "Changed" | "Manual" | "Inactive";

export type AuthObject = {
  id: string;
  name: string;
  class: AuthClass;
  description: string;
  status: AuthObjectStatus;
  sample: boolean;
};

export type OrgLevelState = "open" | "values" | "range" | "wildcard";

export type OrgLevel = {
  id: string;
  name: string;
  state: OrgLevelState;
  values: string[];
  from?: string;
  to?: string;
  sample: boolean;
};

export type Plant = {
  value: string;
  label: string;
  sample: boolean;
};

export type Activity = {
  id: string;
  name: string;
  description: string;
  tcodeIds: string[];
  authObjectIds: string[];
  orgLevelIds: string[];
  sample: boolean;
};

export type ActivitiesFile = {
  tcodes: TCode[];
  authObjects: AuthObject[];
  orgLevels: OrgLevel[];
  plants: Plant[];
  activities: Activity[];
};

export type RoleKind = "new" | "existing";

export type RoleCatalogueStatus = "Ready" | "Name clash" | "Too long" | "Error";

export type RoleSeed = {
  id: string;
  kind: RoleKind;
  businessLabel: string;
  sapRoleName: string;
  activityId: string;
  status: RoleCatalogueStatus;
  sample: boolean;
  match?: number;
  included?: boolean;
};

export type RolesFile = {
  newRoles: RoleSeed[];
  existingRoles: RoleSeed[];
};

export type SodRisk = "High" | "Medium" | "Low";

export type SodStage = "accepted" | "new";
export type SodResolution = "whitelisted" | "remediated" | "open";

export type SodConflict = {
  id: string;
  designationId: string;
  roleAId: string;
  roleBId: string;
  roleALabel: string;
  roleBLabel: string;
  risk: SodRisk;
  justification: string;
  whitelisted: boolean;
  whitelistedBy: string | null;
  whitelistedAt: string | null;
  sample: boolean;
  tcodes?: string;
  initialDecision?: "pending" | "whitelist" | "mitigate";
  /** Accepted during creation, or found when SoD re-runs at approval. */
  stage?: SodStage;
  resolution?: SodResolution;
};

export type FinalizationConflict = SodConflict & {
  tcodes: string;
  initialDecision: "pending" | "whitelist" | "mitigate";
};

export type FinalizationFile = {
  conflicts: FinalizationConflict[];
};

export type SodFile = {
  conflicts: SodConflict[];
};

export type LicenseLine = {
  id: string;
  userType: string;
  beforeCount: number;
  afterCount: number;
  beforeLakhs: number;
  afterLakhs: number;
  sample: boolean;
};

export type LicenseChange = "downgrade" | "unchanged" | "flagged";

export type LicenseRoleLine = {
  id: string;
  roleName: string;
  sapRoleName: string;
  currentLicense: string;
  recommendedLicense: string;
  change: LicenseChange;
  savingLabel: string | null;
  savingPercent: number | null;
  sample: boolean;
};

export type LicenseMixSegment = {
  key: "professional" | "limited" | "other";
  label: string;
  beforeCount: number;
  afterCount: number;
};

export type LicenseAnalysisSeed = {
  designationId: string;
  status: "completed";
  beforeLabel: string;
  afterLabel: string;
  savingLabel: string;
  savingPercent: number;
  beforeLakhs: number;
  afterLakhs: number;
  savingLakhs: number;
  sample: boolean;
  lines: LicenseLine[];
  mix?: LicenseMixSegment[];
  roles?: LicenseRoleLine[];
};

export type LicenseFile = {
  analyses: LicenseAnalysisSeed[];
};

export type RoleAuthEditor = "checklist" | "range";

export type RoleEditorAuth = {
  id: string;
  name: string;
  class: AuthClass;
  description: string;
  status: AuthObjectStatus | "Open";
  isNew: boolean;
  fields: string;
  sample: boolean;
  editor: RoleAuthEditor;
};

export type RoleEditorTcode = {
  id: string;
  code: string;
  description: string;
  manual: boolean;
  authCount: number;
  sample: boolean;
};

export type RoleEditorActivity = {
  id: string;
  label: string;
  detail: string;
  badge?: string;
};

export type RoleEditorObjectChoice = {
  id: string;
  label: string;
  detail: string;
  required: boolean;
  shared: string;
};

export type RoleEditorFile = {
  sample: boolean;
  knownTcodes: { code: string; description: string }[];
  fieldCounts: Record<string, number>;
  orgOrder: string[];
  revenue: { roleId: string; changes: number; tcodeIds: string[]; authObjects: RoleEditorAuth[] };
  lease: { roleId: string; changes: number; tcodeIds: string[]; authIds: string[]; orgLevelIds: string[] };
  tcodes: RoleEditorTcode[];
  activities: Record<string, RoleEditorActivity[]>;
  va02Objects: RoleEditorObjectChoice[];
  defaultActivities: Record<string, string[]>;
  defaultRange: { mode: "one" | "range" | "all"; from: string; to: string };
  bukrsOverride: string[];
};
