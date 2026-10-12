import activitiesJson from "./activities.json";
import designationsJson from "./designations.json";
import licenseJson from "./license.json";
import roleEditorJson from "./roleEditor.json";
import rolesJson from "./roles.json";
import finalizationJson from "./sod-finalization.json";
import sodJson from "./sod.json";
import type {
  ActivitiesFile,
  DesignationSeed,
  FinalizationFile,
  LicenseFile,
  RoleEditorFile,
  RolesFile,
  SodFile,
} from "./types";

export const designations = designationsJson as DesignationSeed[];
export const activitiesFile = activitiesJson as ActivitiesFile;
export const rolesFile = rolesJson as RolesFile;
export const sodFile = sodJson as SodFile;
export const finalizationFile = finalizationJson as FinalizationFile;
export const licenseFile = licenseJson as LicenseFile;
export const roleEditorFile = roleEditorJson as RoleEditorFile;

export type {
  Activity,
  AuthClass,
  AuthObject,
  AuthObjectStatus,
  DesignationSeed,
  LicenseAnalysisSeed,
  LicenseChange,
  LicenseLine,
  LicenseMixSegment,
  LicenseRoleLine,
  LicenseSummary,
  LifecycleStatus,
  OrgLevel,
  RoleSeed,
  FinalizationConflict,
  SodConflict,
  SodResolution,
  SodStage,
  SodRisk,
  SodSummary,
  TCode,
} from "./types";
