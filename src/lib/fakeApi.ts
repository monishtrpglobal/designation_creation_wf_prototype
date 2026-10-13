const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sodCheckSteps = [0, 8, 16, 28, 42, 56, 70] as const;

export async function runSodCheck(onChecked: (checked: number) => void, from = 0): Promise<void> {
  for (const checked of sodCheckSteps) {
    if (checked < from) {
      continue;
    }
    onChecked(checked);
    if (checked < 70) {
      await wait(400);
    }
  }
}

export async function runSync(onProgress: (progress: number) => void): Promise<void> {
  for (const progress of [0, 15, 35, 55, 75, 90, 100]) {
    onProgress(progress);
    await wait(350);
  }
}

export type RoleCreationResult =
  | { ok: true; trNumber: string }
  | { ok: false; message: string };

export function creationStep() {
  return wait(160);
}

export async function createRole(input: {
  roleId: string;
  sapRoleName: string;
  fail?: boolean;
}): Promise<RoleCreationResult> {
  await creationStep();
  if (input.fail) {
    return { ok: false, message: "SAP API: authorisation error" };
  }
  return { ok: true, trNumber: "DEVK900125" };
}

export function trImportStep() {
  return wait(200);
}

export async function runLicenseAnalysis(onProgress: (progress: number) => void): Promise<void> {
  for (const progress of [0, 25, 50, 75, 100]) {
    onProgress(progress);
    await wait(400);
  }
}
