import { finalizationFile, rolesFile, type FinalizationConflict, type LicenseSummary } from "@/mock";
import { optionBGapRoleIds, shouldFailCreation } from "@/features/designation/roles/rolesView";
import { createRole, creationStep, runLicenseAnalysis, runSodCheck, runSync, trImportStep } from "@/lib/fakeApi";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ActivityEdit,
  DesignationRuntime,
  FlowMethod,
  OrgValue,
  RoleEditorOverride,
  RoleRuntimeStatus,
  SodDecision,
} from "./model";
import { buildDraft, defaultRoleDescription, emptySodSim, seedDesignations, settleInterrupted } from "./seed";

type FlowData = {
  designations: DesignationRuntime[];
  currentDesignationId: string | null;
  epoch: number;
  hydrated: boolean;
};

type FlowActions = {
  resetDemo: () => void;
  setHydrated: (hydrated: boolean) => void;
  setCurrentDesignation: (id: string | null) => void;
  createDesignation: (name: string) => string;
  renameDesignation: (id: string, name: string) => void;
  setSelectedActivities: (id: string, activityIds: string[]) => void;
  saveActivityEdit: (id: string, activityId: string, edit: ActivityEdit) => void;
  startSync: (id: string, options?: { fail?: boolean }) => Promise<void>;
  chooseMethod: (id: string, method: FlowMethod) => void;
  sendRequirement: (id: string) => void;
  setRoleSapName: (id: string, roleId: string, sapRoleName: string) => void;
  setRoleDescription: (id: string, roleId: string, description: string) => void;
  resetRoleEdits: (id: string) => void;
  setOrgLevel: (id: string, levelId: string, value: OrgValue) => void;
  updateRoleEditor: (
    id: string,
    roleId: string,
    recipe: (current: RoleEditorOverride) => RoleEditorOverride,
  ) => void;
  startRoleCreation: (id: string) => Promise<{ ok: boolean; reason?: string }>;
  retryRole: (id: string, roleId: string) => Promise<void>;
  retryFailedRoles: (id: string) => Promise<void>;
  setEnteredRoleId: (id: string, roleId: string, sapRoleId: string) => void;
  setLinkedRoleResult: (id: string, roleId: string, result: "Validated" | "Gap found") => void;
  receiveBuiltRoles: (id: string) => void;
  runLinkSync: (id: string) => boolean;
  sendGapReport: (id: string) => void;
  completeLinkedRoles: (id: string) => boolean;
  startSodSimulation: (id: string) => Promise<void>;
  rerunSodSimulation: (id: string) => Promise<void>;
  ensureFinalizationDecisions: (id: string) => void;
  applySodDecisions: (
    id: string,
    conflictIds: string[],
    decision: "whitelist" | "mitigate",
    justification: string,
  ) => boolean;
  setSodDecision: (
    id: string,
    conflictId: string,
    decision: "pending" | "whitelist" | "mitigate" | "accept",
    justification: string,
  ) => void;
  completeFinalize: (id: string) => boolean;
  approveTr: (id: string) => void;
  rejectTr: (id: string, reason: string) => boolean;
  startLicenseAnalysis: (id: string, options?: { fail?: boolean }) => Promise<void>;
  approveFinal: (id: string, input: { comment: string; highRiskAcknowledged: boolean }) => boolean;
  rejectFinal: (id: string, comment: string) => boolean;
  saveDraft: (id: string) => void;
  deleteDesignation: (id: string) => void;
  clearDesignations: () => void;
  reopenDesignation: (id: string) => void;
};

export type FlowState = FlowData & FlowActions;

function patch(
  designations: DesignationRuntime[],
  id: string,
  recipe: (current: DesignationRuntime) => DesignationRuntime,
) {
  return designations.map((item) => (item.id === id ? recipe(item) : item));
}

/** Sample result when a re-run has no prior summary. Not the Inventory Controller figures. */
const sampleRerunSummary: LicenseSummary = {
  beforeLabel: "₹ 4.2 L",
  afterLabel: "₹ 3.4 L",
  savingLabel: "₹ 0.8 L",
  savingPercent: 19,
};

function licenseSummaryAfterRun(current: LicenseSummary | null, finishedAt: string): LicenseSummary {
  return { ...(current ?? sampleRerunSummary), lastRunAt: finishedAt };
}

function nameClashes(designation: DesignationRuntime, roleId: string, sapRoleName: string) {
  const existing = rolesFile.existingRoles.some((role) => role.sapRoleName === sapRoleName);
  const duplicate = Object.entries(designation.roleSapNames).some(
    ([otherId, name]) => otherId !== roleId && name === sapRoleName,
  );
  return existing || duplicate;
}

function statusForSapName(
  designation: DesignationRuntime,
  roleId: string,
  sapRoleName: string,
): RoleRuntimeStatus {
  const seed = rolesFile.newRoles.find((role) => role.id === roleId);
  if (seed?.status === "Error" && sapRoleName === seed.sapRoleName) {
    return "Error";
  }
  if (sapRoleName.length > 30) {
    return "Too long";
  }
  if (sapRoleName.length === 0 || nameClashes(designation, roleId, sapRoleName)) {
    return "Name clash";
  }
  return "Ready";
}

function orgLevelsBlockCreate(designation: DesignationRuntime) {
  return designation.orgLevels.KOKRS?.kind === "open" || designation.orgLevels.WERKS?.kind === "open";
}

function rolesNeedAttention(designation: DesignationRuntime) {
  return Object.values(designation.roleStatuses).some(
    (status) => status === "Name clash" || status === "Too long" || status === "Error",
  );
}

export function emptyRoleEditor(): RoleEditorOverride {
  return {
    addedTcodeIds: [],
    removedTcodeIds: [],
    inactiveAuthIds: [],
    removedAuthIds: [],
    addedAuth: [],
    tcodeObjects: {},
    authActivities: {},
    authRanges: {},
    extraChanges: 0,
  };
}

const sodInFlight = new Set<string>();

function visibleFinalization(clearedIds: string[]) {
  const cleared = new Set(clearedIds);
  return finalizationFile.conflicts.filter((conflict) => !cleared.has(conflict.id));
}

function conflictsFoundFor(checked: number, visible: number) {
  const midpoint = Math.min(12, visible);
  if (checked >= 70) {
    return visible;
  }
  if (checked <= 28) {
    return Math.min(visible, Math.round((checked / 28) * midpoint));
  }
  const extra = visible - midpoint;
  return Math.min(visible, midpoint + Math.round(((checked - 28) / (70 - 28)) * extra));
}

function decisionFromSeed(conflict: FinalizationConflict): SodDecision {
  return {
    conflictId: conflict.id,
    risk: conflict.risk,
    decision: conflict.initialDecision,
    justification: conflict.justification,
    whitelistedBy: conflict.whitelistedBy,
    whitelistedAt: conflict.whitelistedAt,
  };
}

function withFinalizationDecisions(current: DesignationRuntime) {
  const cleared = new Set(current.sodSim.clearedIds);
  const next = { ...current.sodDecisions };
  for (const conflict of finalizationFile.conflicts) {
    if (cleared.has(conflict.id) || next[conflict.id]) {
      continue;
    }
    next[conflict.id] = decisionFromSeed(conflict);
  }
  return next;
}

function conflictOpen(current: DesignationRuntime, conflict: FinalizationConflict) {
  const decision = current.sodDecisions[conflict.id]?.decision ?? conflict.initialDecision;
  return decision === "pending" || decision === "mitigate" || decision === "accept";
}

function sodCounts(designation: DesignationRuntime) {
  return {
    high: designation.sodSummary?.high ?? 0,
    medium: designation.sodSummary?.medium ?? 0,
    low: designation.sodSummary?.low ?? 0,
  };
}

function countCreation(roleStatuses: Record<string, RoleRuntimeStatus>) {
  const values = Object.values(roleStatuses);
  return {
    completed: values.filter((status) => status === "Created").length,
    total: values.length,
    failed: values.filter((status) => status === "Failed").length,
  };
}

async function createOne(
  get: () => FlowState,
  set: (partial: Partial<FlowState> | ((state: FlowState) => Partial<FlowState>)) => void,
  epoch: number,
  designationId: string,
  roleId: string,
) {
  const applyStatus = (status: RoleRuntimeStatus) => {
    if (get().epoch !== epoch) {
      return false;
    }
    set((state) => ({
      designations: patch(state.designations, designationId, (item) => {
        const roleStatuses = { ...item.roleStatuses, [roleId]: status };
        const allCreated = Object.values(roleStatuses).every((value) => value === "Created");
        return {
          ...item,
          roleStatuses,
          creation: countCreation(roleStatuses),
          steps: { ...item.steps, roles: allCreated },
        };
      }),
    }));
    return get().epoch === epoch;
  };

  if (!applyStatus("Creating")) {
    return;
  }
  await creationStep();
  const current = get().designations.find((item) => item.id === designationId);
  const retried = current?.roleRetried?.[roleId] === true;
  if (shouldFailCreation(roleId, retried)) {
    applyStatus("Failed");
    return;
  }
  if (!applyStatus("Syncing")) {
    return;
  }
  const result = await createRole({
    roleId,
    sapRoleName: current?.roleSapNames[roleId] ?? "",
    fail: false,
  });
  applyStatus(result.ok ? "Created" : "Failed");
}

async function advanceTrImport(id: string) {
  const epoch = useFlowStore.getState().epoch;
  const total = rolesFile.newRoles.length;
  while (useFlowStore.getState().epoch === epoch) {
    const current = useFlowStore.getState().designations.find((item) => item.id === id);
    if (!current?.approval.trImportLive) {
      return;
    }
    if (current.approval.trImported >= total) {
      void useFlowStore.getState().startLicenseAnalysis(id);
      return;
    }
    await trImportStep();
    if (useFlowStore.getState().epoch !== epoch) {
      return;
    }
    const latest = useFlowStore.getState().designations.find((item) => item.id === id);
    if (!latest?.approval.trImportLive) {
      return;
    }
    const nextCount = Math.min(total, latest.approval.trImported + 1);
    const done = nextCount >= total;
    useFlowStore.setState((state) => ({
      designations: patch(state.designations, id, (item) => ({
        ...item,
        approval: { ...item.approval, trImported: nextCount, trImportLive: !done },
      })),
    }));
    if (done) {
      void useFlowStore.getState().startLicenseAnalysis(id);
      return;
    }
  }
}

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      designations: seedDesignations(),
      currentDesignationId: null,
      epoch: 0,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      resetDemo: () =>
        set({
          designations: seedDesignations(),
          currentDesignationId: null,
          epoch: get().epoch + 1,
        }),
      setCurrentDesignation: (id) => set({ currentDesignationId: id }),
      createDesignation: (name) => {
        const id = `des-${crypto.randomUUID()}`;
        const designation = buildDraft(id, name.trim());
        set({
          designations: [designation, ...get().designations],
          currentDesignationId: id,
        });
        return id;
      },
      renameDesignation: (id, name) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => ({
            ...current,
            name: name.trim(),
            steps: { ...current.steps, name: name.trim().length > 0 },
            updatedAt: new Date().toISOString(),
          })),
        })),
      setSelectedActivities: (id, activityIds) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => ({
            ...current,
            selectedActivityIds: activityIds,
            steps: { ...current.steps, activities: activityIds.length > 0 },
            updatedAt: new Date().toISOString(),
          })),
        })),
      saveActivityEdit: (id, activityId, edit) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => ({
            ...current,
            activityEdits: { ...current.activityEdits, [activityId]: edit },
            updatedAt: new Date().toISOString(),
          })),
        })),
      startSync: async (id, options) => {
        const epoch = get().epoch;
        const current = get().designations.find((item) => item.id === id);
        if (!current?.steps.activities) {
          return;
        }
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            status: item.steps.finalize ? item.status : "Syncing to Dev",
            sync: { status: "running", progress: 0, message: "Starting", live: true },
          })),
        }));
        await runSync((progress) => {
          if (get().epoch !== epoch) {
            return;
          }
          const message = progress === 0 ? "Starting" : progress === 100 ? "Completed" : "Syncing";
          set((state) => ({
            designations: patch(state.designations, id, (item) => ({
              ...item,
              sync: { ...item.sync, progress, message, status: "running", live: true },
            })),
          }));
        });
        if (get().epoch !== epoch) {
          return;
        }
        if (options?.fail) {
          set((state) => ({
            designations: patch(state.designations, id, (item) => ({
              ...item,
              status: item.steps.finalize ? item.status : "Draft",
              sync: { status: "failed", progress: item.sync.progress, message: "Failed", live: false },
            })),
          }));
          return;
        }
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            status: item.steps.finalize ? item.status : "Draft",
            sync: { status: "completed", progress: 100, message: "Completed", live: false },
            steps: { ...item.steps, sync: true },
          })),
        }));
      },
      chooseMethod: (id, method) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) =>
            current.methodLocked ? current : { ...current, method },
          ),
        })),
      // TODO(confirm): method locks once Send to security team is pressed.
      sendRequirement: (id) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => {
            if (current.methodLocked && current.method !== "B") {
              return current;
            }
            const roleStatuses = { ...current.roleStatuses };
            for (const roleId of Object.keys(roleStatuses)) {
              if (roleStatuses[roleId] !== "Validated" && roleStatuses[roleId] !== "Gap found") {
                roleStatuses[roleId] = "Awaiting SAP";
              }
            }
            return {
              ...current,
              method: "B",
              methodLocked: true,
              roleStatuses,
            };
          }),
        })),
      setRoleSapName: (id, roleId, sapRoleName) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => {
            const roleSapNames = { ...current.roleSapNames, [roleId]: sapRoleName };
            const next = { ...current, roleSapNames };
            return {
              ...next,
              roleStatuses: {
                ...current.roleStatuses,
                [roleId]: statusForSapName(next, roleId, sapRoleName),
              },
            };
          }),
        })),
      setRoleDescription: (id, roleId, description) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => ({
            ...current,
            roleDescriptions: { ...current.roleDescriptions, [roleId]: description },
          })),
        })),
      resetRoleEdits: (id) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => {
            if (current.methodLocked) {
              return current;
            }
            const roleSapNames = { ...current.roleSapNames };
            const roleStatuses = { ...current.roleStatuses };
            const roleDescriptions = { ...current.roleDescriptions };
            for (const role of rolesFile.newRoles) {
              roleSapNames[role.id] = role.sapRoleName;
              roleStatuses[role.id] = role.status;
              roleDescriptions[role.id] = defaultRoleDescription(role);
            }
            return { ...current, roleSapNames, roleStatuses, roleDescriptions, roleEditors: {} };
          }),
        })),
      setOrgLevel: (id, levelId, value) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => ({
            ...current,
            orgLevels: { ...current.orgLevels, [levelId]: value },
          })),
        })),
      updateRoleEditor: (id, roleId, recipe) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => {
            const currentEditor = current.roleEditors?.[roleId] ?? emptyRoleEditor();
            return {
              ...current,
              roleEditors: {
                ...(current.roleEditors ?? {}),
                [roleId]: recipe(currentEditor),
              },
            };
          }),
        })),
      startRoleCreation: async (id) => {
        const epoch = get().epoch;
        const current = get().designations.find((item) => item.id === id);
        if (!current || !current.steps.sync) {
          return { ok: false, reason: "Sync is not complete" };
        }
        if (current.methodLocked && current.method === "B") {
          return { ok: false, reason: "Method B is locked" };
        }
        if (rolesNeedAttention(current) || orgLevelsBlockCreate(current)) {
          return { ok: false, reason: "Roles or org levels still need attention" };
        }
        const roleStatuses = { ...current.roleStatuses };
        for (const roleId of Object.keys(roleStatuses)) {
          if (roleStatuses[roleId] !== "Created") {
            roleStatuses[roleId] = "Queued";
          }
        }
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            method: "A",
            methodLocked: true,
            creationLive: true,
            roleStatuses,
            creation: countCreation(roleStatuses),
          })),
        }));
        for (const roleId of Object.keys(roleStatuses)) {
          if (get().epoch !== epoch) {
            return { ok: false, reason: "Reset" };
          }
          const latest = get().designations.find((item) => item.id === id);
          if (latest?.roleStatuses[roleId] === "Created") {
            continue;
          }
          await createOne(get, set, epoch, id, roleId);
        }
        if (get().epoch !== epoch) {
          return { ok: false, reason: "Reset" };
        }
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({ ...item, creationLive: false })),
        }));
        return { ok: true };
      },
      retryRole: async (id, roleId) => {
        const epoch = get().epoch;
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            creationLive: true,
            roleRetried: { ...item.roleRetried, [roleId]: true },
            roleStatuses: { ...item.roleStatuses, [roleId]: "Queued" },
          })),
        }));
        await createOne(get, set, epoch, id, roleId);
        if (get().epoch !== epoch) {
          return;
        }
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({ ...item, creationLive: false })),
        }));
      },
      retryFailedRoles: async (id) => {
        const failed = Object.entries(
          get().designations.find((item) => item.id === id)?.roleStatuses ?? {},
        )
          .filter(([, status]) => status === "Failed")
          .map(([roleId]) => roleId);
        for (const roleId of failed) {
          await get().retryRole(id, roleId);
        }
      },
      setEnteredRoleId: (id, roleId, sapRoleId) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => {
            if (current.roleStatuses[roleId] === "Validated") {
              return current;
            }
            const trimmed = sapRoleId.trim();
            let status: RoleRuntimeStatus = "Needed";
            if (trimmed.length > 30) {
              status = "Too long";
            } else if (trimmed.length > 0) {
              status = "ID entered";
            }
            return {
              ...current,
              optionBRoleIds: { ...current.optionBRoleIds, [roleId]: trimmed },
              roleStatuses: { ...current.roleStatuses, [roleId]: status },
            };
          }),
        })),
      setLinkedRoleResult: (id, roleId, result) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => ({
            ...current,
            roleStatuses: { ...current.roleStatuses, [roleId]: result },
          })),
        })),
      receiveBuiltRoles: (id) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => {
            if (current.method !== "B" || !current.methodLocked) {
              return current;
            }
            const roleStatuses = { ...current.roleStatuses };
            for (const roleId of Object.keys(roleStatuses)) {
              if (roleStatuses[roleId] === "Awaiting SAP") {
                roleStatuses[roleId] = "Needed";
              }
            }
            return { ...current, roleStatuses };
          }),
        })),
      runLinkSync: (id) => {
        const current = get().designations.find((item) => item.id === id);
        if (!current || current.method !== "B") {
          return false;
        }
        const ready = rolesFile.newRoles.every((role) => {
          const entered = (current.optionBRoleIds[role.id] ?? "").trim();
          return entered.length > 0 && entered.length <= 30;
        });
        if (!ready) {
          return false;
        }
        const checked = rolesFile.newRoles.some((role) => {
          const status = current.roleStatuses[role.id];
          return status === "Gap found" || status === "Validated";
        });
        const gapIds = new Set<string>(optionBGapRoleIds);
        const roleStatuses = { ...current.roleStatuses };
        for (const role of rolesFile.newRoles) {
          if (roleStatuses[role.id] === "Validated") {
            continue;
          }
          roleStatuses[role.id] = !checked && gapIds.has(role.id) ? "Gap found" : "Validated";
        }
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({ ...item, roleStatuses })),
        }));
        return true;
      },
      // TODO(confirm): Send gap report notifies inside the platform or exports a file.
      sendGapReport: (id) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => ({
            ...current,
            optionBGapReportSent: true,
          })),
        })),
      completeLinkedRoles: (id) => {
        const current = get().designations.find((item) => item.id === id);
        if (!current) {
          return false;
        }
        const ready = Object.values(current.roleStatuses).every((status) => status === "Validated");
        if (!ready) {
          return false;
        }
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            steps: { ...item.steps, roles: true },
          })),
        }));
        return true;
      },
      startSodSimulation: async (id) => {
        if (sodInFlight.has(id)) {
          return;
        }
        const current = get().designations.find((item) => item.id === id);
        if (!current?.steps.roles || current.steps.finalize || current.sodSim.status === "completed") {
          return;
        }
        sodInFlight.add(id);
        const epoch = get().epoch;
        const from = current.sodSim.status === "running" ? current.sodSim.checked : 0;
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            sodSim: { ...item.sodSim, status: "running", checked: from },
          })),
        }));
        try {
          await runSodCheck((checked) => {
            if (get().epoch !== epoch) {
              return;
            }
            const latest = get().designations.find((item) => item.id === id);
            const visible = visibleFinalization(latest?.sodSim.clearedIds ?? []);
            set((state) => ({
              designations: patch(state.designations, id, (item) => ({
                ...item,
                sodSim: {
                  ...item.sodSim,
                  status: "running",
                  checked,
                  conflictsFound: conflictsFoundFor(checked, visible.length),
                },
              })),
            }));
          }, from);
          if (get().epoch !== epoch) {
            return;
          }
          set((state) => ({
            designations: patch(state.designations, id, (item) => {
              const visible = visibleFinalization(item.sodSim.clearedIds);
              const seeded = withFinalizationDecisions(item);
              return {
                ...item,
                sodDecisions: seeded,
                sodSim: {
                  ...item.sodSim,
                  status: "completed",
                  checked: 70,
                  conflictsFound: visible.length,
                },
              };
            }),
          }));
        } finally {
          sodInFlight.delete(id);
        }
      },
      rerunSodSimulation: async (id) => {
        const current = get().designations.find((item) => item.id === id);
        if (!current || current.steps.finalize || current.sodSim.status === "running" || sodInFlight.has(id)) {
          return;
        }
        const cleared = new Set(current.sodSim.clearedIds);
        for (const conflict of finalizationFile.conflicts) {
          if (cleared.has(conflict.id)) {
            continue;
          }
          const decision = current.sodDecisions[conflict.id]?.decision ?? conflict.initialDecision;
          if (decision === "mitigate") {
            cleared.add(conflict.id);
          }
        }
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            sodSim: { status: "idle", checked: 0, conflictsFound: 0, clearedIds: [...cleared] },
          })),
        }));
        await get().startSodSimulation(id);
      },
      ensureFinalizationDecisions: (id) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => {
            if (current.sodSim.status !== "completed") {
              return current;
            }
            return { ...current, sodDecisions: withFinalizationDecisions(current) };
          }),
        })),
      applySodDecisions: (id, conflictIds, decision, justification) => {
        const text = justification.trim();
        if (decision === "whitelist" && text.length === 0) {
          return false;
        }
        const current = get().designations.find((item) => item.id === id);
        if (!current || current.steps.finalize || conflictIds.length === 0) {
          return false;
        }
        const today = new Date().toISOString().slice(0, 10);
        set((state) => ({
          designations: patch(state.designations, id, (item) => {
            const sodDecisions = { ...item.sodDecisions };
            for (const conflictId of conflictIds) {
              const seed = finalizationFile.conflicts.find((conflict) => conflict.id === conflictId);
              const previous = sodDecisions[conflictId];
              sodDecisions[conflictId] = {
                conflictId,
                risk: previous?.risk ?? seed?.risk ?? "Low",
                decision,
                justification: decision === "whitelist" ? text : "",
                // TODO(confirm): who may whitelist, and does a whitelist need a second approver?
                whitelistedBy:
                  decision === "whitelist" ? (previous?.whitelistedBy ?? "A. Rao (sample data)") : null,
                whitelistedAt: decision === "whitelist" ? (previous?.whitelistedAt ?? today) : null,
              };
            }
            return { ...item, sodDecisions };
          }),
        }));
        return true;
      },
      setSodDecision: (id, conflictId, decision, justification) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => ({
            ...current,
            sodDecisions: {
              ...current.sodDecisions,
              [conflictId]: {
                ...(current.sodDecisions[conflictId] ?? {
                  conflictId,
                  risk: "Low",
                  whitelistedBy: null,
                  whitelistedAt: null,
                }),
                decision,
                justification,
                // TODO(confirm): who may whitelist, and does a whitelist need a second approver?
                whitelistedBy:
                  decision === "whitelist"
                    ? (current.sodDecisions[conflictId]?.whitelistedBy ?? "A. Rao (sample data)")
                    : null,
                whitelistedAt:
                  decision === "whitelist"
                    ? (current.sodDecisions[conflictId]?.whitelistedAt ?? new Date().toISOString().slice(0, 10))
                    : null,
              },
            },
          })),
        })),
      completeFinalize: (id) => {
        const current = get().designations.find((item) => item.id === id);
        if (!current || current.steps.finalize || current.sodSim.status !== "completed") {
          return false;
        }
        const visible = visibleFinalization(current.sodSim.clearedIds);
        if (visible.some((conflict) => conflictOpen(current, conflict))) {
          return false;
        }
        const sodSummary = { high: 0, medium: 0, low: 0 };
        for (const conflict of visible) {
          if (conflict.risk === "High") {
            sodSummary.high += 1;
          } else if (conflict.risk === "Medium") {
            sodSummary.medium += 1;
          } else {
            sodSummary.low += 1;
          }
        }
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            status: "Awaiting TR approval",
            sodSummary,
            steps: { ...item.steps, finalize: true },
            approval: { ...item.approval, tr: "awaiting" },
            updatedAt: new Date().toISOString(),
          })),
        }));
        return true;
      },
      approveTr: (id) => {
        const current = get().designations.find((item) => item.id === id);
        if (!current || current.status !== "Awaiting TR approval") {
          return;
        }
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            status: "Moving to Quality",
            steps: { ...item.steps, tr: true },
            approval: {
              ...item.approval,
              tr: "approved",
              trNumber: "DEVK900125",
              trImported: 0,
              trImportLive: true,
            },
            updatedAt: new Date().toISOString(),
          })),
        }));
        void advanceTrImport(id);
      },
      rejectTr: (id, reason) => {
        const trimmed = reason.trim();
        if (trimmed.length === 0) {
          return false;
        }
        const current = get().designations.find((item) => item.id === id);
        if (!current || current.status !== "Awaiting TR approval") {
          return false;
        }
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            status: "Rejected",
            approval: { ...item.approval, trRejectReason: trimmed },
            updatedAt: new Date().toISOString(),
          })),
        }));
        return true;
      },
      startLicenseAnalysis: async (id, options) => {
        const epoch = get().epoch;
        const current = get().designations.find((item) => item.id === id);
        const license = current?.approval.license;
        const canStart = license === "none" || license === "failed" || license === "completed";
        if (!current?.steps.tr || !canStart || current.approval.licenseLive) {
          return;
        }
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            status: "License analysis running",
            approval: { ...item.approval, license: "running", licenseProgress: 0, licenseLive: true },
          })),
        }));
        await runLicenseAnalysis((progress) => {
          if (get().epoch !== epoch) {
            return;
          }
          set((state) => ({
            designations: patch(state.designations, id, (item) => ({
              ...item,
              approval: { ...item.approval, licenseProgress: progress, license: "running", licenseLive: true },
            })),
          }));
        });
        if (get().epoch !== epoch) {
          return;
        }
        if (options?.fail) {
          set((state) => ({
            designations: patch(state.designations, id, (item) => ({
              ...item,
              status: "Analysis failed",
              steps: { ...item.steps, license: false },
              approval: { ...item.approval, license: "failed", licenseLive: false, licenseProgress: 100 },
            })),
          }));
          return;
        }
        const finishedAt = new Date().toISOString();
        const summary = licenseSummaryAfterRun(current.licenseSummary, finishedAt);
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            status: "Awaiting final approval",
            licenseSummary: summary,
            steps: { ...item.steps, license: true },
            approval: {
              ...item.approval,
              license: "completed",
              licenseLive: false,
              licenseProgress: 100,
              final: "awaiting",
            },
            updatedAt: new Date().toISOString(),
          })),
        }));
      },
      approveFinal: (id, input) => {
        const current = get().designations.find((item) => item.id === id);
        if (!current?.steps.license) {
          return false;
        }
        const counts = sodCounts(current);
        const hasRisk = counts.high + counts.medium + counts.low > 0;
        if (hasRisk && !input.highRiskAcknowledged) {
          return false;
        }
        // TODO(confirm): a new High risk requires a comment and does not hard-block publish.
        if (counts.high > 0 && input.comment.trim().length === 0) {
          return false;
        }
        const acknowledgedAt = new Date().toISOString();
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            status: "Published",
            approval: {
              ...item.approval,
              final: "published",
              finalComment: input.comment.trim(),
              finalAcknowledged: hasRisk ? input.highRiskAcknowledged : false,
              finalAcknowledgedBy: hasRisk ? "Monish" : null,
              finalAcknowledgedAt: hasRisk ? acknowledgedAt : null,
            },
            updatedAt: acknowledgedAt,
          })),
        }));
        return true;
      },
      rejectFinal: (id, comment) => {
        if (comment.trim().length === 0) {
          return false;
        }
        const current = get().designations.find((item) => item.id === id);
        if (!current?.steps.license) {
          return false;
        }
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            status: "Rejected",
            approval: { ...item.approval, final: "rejected", finalComment: comment.trim() },
            updatedAt: new Date().toISOString(),
          })),
        }));
        return true;
      },
      saveDraft: (id) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => {
            const postWizard =
              current.steps.finalize ||
              current.status === "Rejected" ||
              current.status === "Published";
            return {
              ...current,
              status: postWizard ? current.status : "Draft",
              updatedAt: new Date().toISOString(),
            };
          }),
        })),
      deleteDesignation: (id) =>
        set((state) => ({
          designations: state.designations.filter((item) => item.id !== id),
          currentDesignationId: state.currentDesignationId === id ? null : state.currentDesignationId,
        })),
      clearDesignations: () => set({ designations: [], currentDesignationId: null }),
      reopenDesignation: (id) =>
        set((state) => ({
          currentDesignationId: id,
          designations: patch(state.designations, id, (current) => ({
            ...current,
            status: "Draft",
            steps: {
              name: true,
              activities: false,
              sync: false,
              roles: false,
              finalize: false,
              tr: false,
              license: false,
            },
            approval: {
              ...current.approval,
              final: "none",
              finalComment: "",
              finalAcknowledged: false,
              finalAcknowledgedBy: null,
              finalAcknowledgedAt: null,
            },
            sodSim: emptySodSim(),
            sodDecisions: {},
            sodSummary: null,
            updatedAt: new Date().toISOString(),
          })),
        })),
    }),
    {
      name: "irm-designation-flow",
      version: 11,
      migrate: () => ({ designations: seedDesignations(), currentDesignationId: null }),
      skipHydration: true,
      partialize: (state) => ({
        designations: state.designations,
        currentDesignationId: state.currentDesignationId,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<Pick<FlowState, "designations" | "currentDesignationId">>;
        return {
          ...current,
          designations: (saved.designations ?? current.designations).map(settleInterrupted),
          currentDesignationId: saved.currentDesignationId ?? null,
        };
      },
    },
  ),
);

export function selectDesignation(id: string | undefined) {
  if (!id) {
    return undefined;
  }
  return useFlowStore.getState().designations.find((item) => item.id === id);
}
