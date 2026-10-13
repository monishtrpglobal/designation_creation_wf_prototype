import type { DesignationRuntime, FlowRoute } from "./model";

const orderedRoutes = [
  "name",
  "activities",
  "sync",
  "roles",
  "finalize",
  "tr",
  "license",
  "approve",
] as const satisfies readonly FlowRoute[];

const wizardSteps = ["name", "activities", "sync", "roles", "review", "link", "finalize"] as const;

export type WizardStep = (typeof wizardSteps)[number];

export function isWizardStep(value: string | null): value is WizardStep {
  return wizardSteps.some((step) => step === value);
}

function wizardPath(step: WizardStep, id: string | null): string {
  if (step === "name" && !id) {
    return "/designation/new";
  }
  const params = new URLSearchParams();
  if (id) {
    params.set("id", id);
  }
  params.set("step", step);
  return `/designation/new?${params.toString()}`;
}

export function pathFor(route: FlowRoute, id: string | null): string {
  switch (route) {
    case "catalogue":
      return "/designations";
    case "name":
    case "activities":
    case "sync":
    case "roles":
    case "review":
    case "link":
    case "finalize":
      return wizardPath(route, id);
    case "tr":
      return `/designation/${id}/tr`;
    case "license":
      return `/designation/${id}/license`;
    case "approve":
      return `/designation/${id}/approve`;
    default:
      return "/designations";
  }
}

export function shellIndexFor(route: FlowRoute): number | null {
  switch (route) {
    case "name":
      return 0;
    case "activities":
      return 1;
    case "sync":
      return 2;
    case "roles":
    case "review":
    case "link":
      return 3;
    case "finalize":
      return 4;
    default:
      return null;
  }
}

export function screenTitle(route: FlowRoute): string {
  switch (route) {
    case "catalogue":
      return "Screen 12 Catalogue";
    case "name":
      return "Screen 2 Designation name";
    case "activities":
      return "Screen 3 Select business activities";
    case "sync":
      return "Screen 6 Run sync";
    case "roles":
      return "Screen 7 Recommended roles";
    case "review":
      return "Screen 8 Review new roles";
    case "link":
      return "Screen 9 Link roles built in SAP";
    case "finalize":
      return "Screen 11 Role finalization";
    case "tr":
      return "Screen 13 Approve TR movement";
    case "license":
      return "Screen 14 License analysis";
    case "approve":
      return "Screen 16 Final approval";
    default:
      return "Designation flow";
  }
}

export function lastAllowedRoute(designation: DesignationRuntime): FlowRoute {
  if (!designation.steps.name) {
    return "name";
  }
  if (!designation.steps.activities) {
    return "activities";
  }
  if (!designation.steps.sync) {
    return "sync";
  }
  if (!designation.steps.roles) {
    return "roles";
  }
  if (!designation.steps.finalize) {
    return "finalize";
  }
  if (!designation.steps.tr) {
    return "tr";
  }
  if (!designation.steps.license) {
    return "license";
  }
  return "approve";
}

function routeRank(route: FlowRoute): number {
  return orderedRoutes.indexOf(route as (typeof orderedRoutes)[number]);
}

export function canOpen(designation: DesignationRuntime, route: FlowRoute): boolean {
  if (route === "catalogue" || route === "name") {
    return true;
  }
  if (route === "review") {
    return designation.steps.sync && designation.method === "A";
  }
  if (route === "link") {
    return designation.steps.sync && designation.method === "B";
  }
  const last = lastAllowedRoute(designation);
  return routeRank(route) <= routeRank(last);
}

export function guardRedirect(designation: DesignationRuntime | undefined, route: FlowRoute): string | null {
  if (route === "catalogue" || route === "name") {
    return null;
  }
  if (!designation) {
    return "/designations";
  }
  if (canOpen(designation, route)) {
    return null;
  }
  if ((route === "review" || route === "link") && designation.steps.sync) {
    if (designation.method === "A") {
      return pathFor("review", designation.id);
    }
    if (designation.method === "B") {
      return pathFor("link", designation.id);
    }
    return pathFor("roles", designation.id);
  }
  return pathFor(lastAllowedRoute(designation), designation.id);
}
