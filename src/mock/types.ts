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
};

export type LicenseFile = {
  analyses: LicenseAnalysisSeed[];
};
