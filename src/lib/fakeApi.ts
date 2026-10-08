const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runSync(onProgress: (progress: number) => void): Promise<void> {
  for (const progress of [0, 15, 35, 55, 75, 90, 100]) {
    onProgress(progress);
    await wait(350);
  }
}

export type RoleCreationResult =
  | { ok: true; trNumber: string }
  | { ok: false; message: string };

export async function createRole(input: {
  roleId: string;
  sapRoleName: string;
  failOnce?: boolean;
}): Promise<RoleCreationResult> {
  await wait(280);
  if (input.failOnce) {
    return { ok: false, message: "SAP API: authorisation error" };
  }
  return { ok: true, trNumber: "DEVK900125" };
}

export async function runLicenseAnalysis(onProgress: (progress: number) => void): Promise<void> {
  for (const progress of [0, 25, 50, 75, 100]) {
    onProgress(progress);
    await wait(400);
  }
}
