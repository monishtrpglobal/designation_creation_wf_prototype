import { rolesFile } from "@/mock";
import { createRole, runLicenseAnalysis, runSync } from "@/lib/fakeApi";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DesignationRuntime, FlowMethod, OrgValue, RoleRuntimeStatus } from "./model";
import { buildDraft, seedDesignations, settleInterrupted } from "./seed";

const taxRoleId =
  rolesFile.newRoles.find((role) => role.businessLabel === "Tax Return Preparer")?.id ?? "";

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
  startSync: (id: string, options?: { fail?: boolean }) => Promise<void>;
  chooseMethod: (id: string, method: FlowMethod) => void;
  sendRequirement: (id: string) => void;
  setRoleSapName: (id: string, roleId: string, sapRoleName: string) => void;
  setOrgLevel: (id: string, levelId: string, value: OrgValue) => void;
  startRoleCreation: (id: string) => Promise<{ ok: boolean; reason?: string }>;
  retryRole: (id: string, roleId: string) => Promise<void>;
  retryFailedRoles: (id: string) => Promise<void>;
  setEnteredRoleId: (id: string, roleId: string, sapRoleId: string) => void;
  setLinkedRoleResult: (id: string, roleId: string, result: "Validated" | "Gap found") => void;
  completeLinkedRoles: (id: string) => boolean;
  setSodDecision: (
    id: string,
    conflictId: string,
    decision: "pending" | "whitelist" | "mitigate" | "accept",
    justification: string,
  ) => void;
  completeFinalize: (id: string) => void;
  approveTr: (id: string) => void;
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
    (status) => status === "Name clash" || status === "Too long",
  );
}

function highRiskOpen(designation: DesignationRuntime) {
  return Object.values(designation.sodDecisions).some(
    (decision) =>
      decision.risk === "High" && decision.decision !== "whitelist" && decision.decision !== "mitigate",
  );
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
  if (get().epoch !== epoch) {
    return;
  }
  set((state) => ({
    designations: patch(state.designations, designationId, (current) => ({
      ...current,
      roleStatuses: { ...current.roleStatuses, [roleId]: "Creating" },
    })),
  }));
  const current = get().designations.find((item) => item.id === designationId);
  const failOnce = current?.taxFailurePending === true && roleId === taxRoleId;
  const result = await createRole({
    roleId,
    sapRoleName: current?.roleSapNames[roleId] ?? "",
    failOnce,
  });
  if (get().epoch !== epoch) {
    return;
  }
  set((state) => ({
    designations: patch(state.designations, designationId, (item) => {
      const roleStatuses = {
        ...item.roleStatuses,
        [roleId]: result.ok ? "Created" : "Failed",
      } as Record<string, RoleRuntimeStatus>;
      const allCreated = Object.values(roleStatuses).every((status) => status === "Created");
      return {
        ...item,
        taxFailurePending: failOnce ? false : item.taxFailurePending,
        roleStatuses,
        creation: countCreation(roleStatuses),
        steps: { ...item.steps, roles: allCreated },
      };
    }),
  }));
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
      sendRequirement: (id) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => {
            if (current.methodLocked && current.method !== "B") {
              return current;
            }
            const roleStatuses = { ...current.roleStatuses };
            for (const roleId of Object.keys(roleStatuses)) {
              if (roleStatuses[roleId] !== "Validated" && roleStatuses[roleId] !== "Gap found") {
                roleStatuses[roleId] = current.optionBRoleIds[roleId] ? "ID entered" : "Needed";
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
      setOrgLevel: (id, levelId, value) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => ({
            ...current,
            orgLevels: { ...current.orgLevels, [levelId]: value },
          })),
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
                whitelistedBy:
                  decision === "whitelist" ? (current.sodDecisions[conflictId]?.whitelistedBy ?? null) : null,
                whitelistedAt:
                  decision === "whitelist" ? (current.sodDecisions[conflictId]?.whitelistedAt ?? null) : null,
              },
            },
          })),
        })),
      completeFinalize: (id) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => ({
            ...current,
            status: "Awaiting TR approval",
            steps: { ...current.steps, finalize: true },
            approval: { ...current.approval, tr: "awaiting" },
            updatedAt: new Date().toISOString(),
          })),
        })),
      approveTr: (id) =>
        set((state) => ({
          designations: patch(state.designations, id, (current) => ({
            ...current,
            status: "Moving to Quality",
            steps: { ...current.steps, tr: true },
            approval: { ...current.approval, tr: "approved", trNumber: "DEVK900125" },
            updatedAt: new Date().toISOString(),
          })),
        })),
      startLicenseAnalysis: async (id, options) => {
        const epoch = get().epoch;
        const current = get().designations.find((item) => item.id === id);
        if (!current?.steps.tr) {
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
        const summary = current.licenseSummary;
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            status: "Awaiting final approval",
            licenseSummary: summary ?? item.licenseSummary,
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
        if (highRiskOpen(current) && !input.highRiskAcknowledged) {
          return false;
        }
        set((state) => ({
          designations: patch(state.designations, id, (item) => ({
            ...item,
            status: "Published",
            approval: { ...item.approval, final: "published", finalComment: input.comment },
            updatedAt: new Date().toISOString(),
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
            approval: { ...current.approval, final: "none", finalComment: "" },
            updatedAt: new Date().toISOString(),
          })),
        })),
    }),
    {
      name: "irm-designation-flow",
      version: 2,
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
