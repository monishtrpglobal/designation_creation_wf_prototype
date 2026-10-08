import activitiesJson from "./activities.json";
import designationsJson from "./designations.json";
import licenseJson from "./license.json";
import rolesJson from "./roles.json";
import sodJson from "./sod.json";
import type {
  ActivitiesFile,
  DesignationSeed,
  LicenseFile,
  RolesFile,
  SodFile,
} from "./types";

export const designations = designationsJson as DesignationSeed[];
export const activitiesFile = activitiesJson as ActivitiesFile;
export const rolesFile = rolesJson as RolesFile;
export const sodFile = sodJson as SodFile;
export const licenseFile = licenseJson as LicenseFile;

export type {
  Activity,
  AuthObject,
  DesignationSeed,
  LicenseAnalysisSeed,
  LicenseLine,
  LicenseSummary,
  LifecycleStatus,
  OrgLevel,
  RoleSeed,
  SodConflict,
  SodRisk,
  SodSummary,
  TCode,
} from "./types";
