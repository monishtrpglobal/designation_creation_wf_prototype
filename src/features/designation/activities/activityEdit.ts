import { activitiesFile, type Activity, type AuthObjectStatus, type TCode } from "@/mock";
import type { ActivityEdit } from "@/state/model";

export type ActivityDraft = ActivityEdit;
export type OrgDraft = ActivityEdit["orgLevels"][number];

export const activityActs = ["01", "02", "03", "06", "10", "85", "*"] as const;

const figmaObjectCounts: Record<string, number> = {
  FB60: 5,
  FB65: 4,
  FBL1N: 4,
  F110: 6,
  FK01: 3,
  FK02: 3,
  FK03: 2,
  MIRO: 5,
  MIR4: 3,
  "F-53": 5,
  FB01: 4,
  FB02: 4,
  FB03: 2,
  "F-43": 4,
};

export function tcodeById(id: string): TCode | undefined {
  return activitiesFile.tcodes.find((item) => item.id === id || item.code === id);
}

export function authById(id: string) {
  return activitiesFile.authObjects.find((item) => item.id === id);
}

export function orgById(id: string) {
  return activitiesFile.orgLevels.find((item) => item.id === id);
}

function objectsForCode(code: string, authIds: string[]): string[] {
  if (authIds.length === 0) {
    return [];
  }
  const preferred = figmaObjectCounts[code];
  const count = Math.min(authIds.length, preferred ?? 2 + (code.length % Math.min(4, authIds.length)));
  const start = code.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % authIds.length;
  const picked: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const id = authIds[(start + index) % authIds.length];
    if (id && !picked.includes(id)) {
      picked.push(id);
    }
  }
  return picked;
}

export function draftFromActivity(activity: Activity): ActivityDraft {
  const authObjectIds = [...activity.authObjectIds];
  const tcodeObjects: Record<string, string[]> = {};
  for (const id of activity.tcodeIds) {
    const code = tcodeById(id)?.code ?? id;
    tcodeObjects[id] = objectsForCode(code, authObjectIds);
  }
  const authActivities: Record<string, string[]> = {};
  const authStatus: Record<string, AuthObjectStatus> = {};
  for (const id of authObjectIds) {
    authActivities[id] = ["01", "02", "03"];
    authStatus[id] = authById(id)?.status ?? "Standard";
  }
  const orgLevels: OrgDraft[] = activity.orgLevelIds.flatMap((id) => {
    const level = orgById(id);
    if (!level) {
      return [];
    }
    return [
      {
        id: level.id,
        name: level.name,
        state: level.state,
        values: [...level.values],
        from: level.from,
        to: level.to,
      },
    ];
  });
  return {
    tcodeIds: [...activity.tcodeIds],
    authObjectIds,
    orgLevels,
    tcodeObjects,
    authActivities,
    authStatus,
  };
}

export function cloneDraft(draft: ActivityDraft): ActivityDraft {
  return {
    tcodeIds: [...draft.tcodeIds],
    authObjectIds: [...draft.authObjectIds],
    orgLevels: draft.orgLevels.map((level) => ({ ...level, values: [...level.values] })),
    tcodeObjects: Object.fromEntries(Object.entries(draft.tcodeObjects).map(([id, ids]) => [id, [...ids]])),
    authActivities: Object.fromEntries(
      Object.entries(draft.authActivities).map(([id, ids]) => [id, [...ids]]),
    ),
    authStatus: { ...draft.authStatus },
  };
}

export function draftsEqual(left: ActivityDraft, right: ActivityDraft) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function openOrgCount(draft: ActivityDraft) {
  return draft.orgLevels.filter((level) => level.state === "open").length;
}

export function summaryLine(draft: ActivityDraft) {
  const open = openOrgCount(draft);
  const org =
    open > 0
      ? `${draft.orgLevels.length} org levels · ${open} open`
      : `${draft.orgLevels.length} org levels`;
  return `${draft.tcodeIds.length} T-codes · ${draft.authObjectIds.length} auth objects · ${org}`;
}

export function catalogueTcodes(): TCode[] {
  return activitiesFile.tcodes;
}
