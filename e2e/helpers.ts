import { expect, type Page } from "@playwright/test";
import rolesFile from "../src/mock/roles.json";

const storageKey = "irm-designation-flow";
const clearedFlag = "irm-e2e-storage-ready";

/** Cursor's browser instrumentation adds data-cursor-ref before React hydrates, which leaves the page on Loading. */
async function keepReactHydration(page: Page) {
  await page.addInitScript(() => {
    const attribute = "data-cursor-ref";
    const strip = (node: Node) => {
      if (!(node instanceof Element)) {
        return;
      }
      if (node.hasAttribute(attribute)) {
        node.removeAttribute(attribute);
      }
      for (const child of node.children) {
        strip(child);
      }
    };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.target instanceof Element && record.target.hasAttribute(attribute)) {
          record.target.removeAttribute(attribute);
        }
        for (const node of record.addedNodes) {
          strip(node);
        }
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [attribute],
      childList: true,
      subtree: true,
    });
    strip(document.documentElement);
  });
}

/** Drop persisted Zustand state on the first document of this tab only. */
export async function resetFlowStorage(page: Page) {
  await keepReactHydration(page);
  await page.addInitScript(
    ({ key, flag }) => {
      if (window.sessionStorage.getItem(flag)) {
        return;
      }
      window.localStorage.removeItem(key);
      window.sessionStorage.setItem(flag, "1");
    },
    { key: storageKey, flag: clearedFlag },
  );
}

/** Seed an empty catalogue before hydration. Later loads in the same tab keep what the app writes. */
export async function seedEmptyCatalogue(page: Page) {
  await keepReactHydration(page);
  await page.addInitScript(
    ({ key, flag }) => {
      if (window.sessionStorage.getItem(flag)) {
        return;
      }
      window.localStorage.setItem(
        key,
        JSON.stringify({
          state: { designations: [], currentDesignationId: null },
          version: 11,
        }),
      );
      window.sessionStorage.setItem(flag, "1");
    },
    { key: storageKey, flag: clearedFlag },
  );
}

export async function openApp(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByText("Loading", { exact: true })).toHaveCount(0);
}

export async function createDesignation(page: Page, name: string) {
  await resetFlowStorage(page);
  await openApp(page, "/designation/new");
  await page.getByRole("textbox", { name: "Designation name" }).fill(name);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/step=activities/);
}

export async function selectActivity(page: Page, activityName: string) {
  await page.getByRole("checkbox", { name: `Select ${activityName}` }).check();
}

export async function waitForSyncCompleted(page: Page) {
  await expect(page.getByText("Sync completed")).toBeVisible({ timeout: 20_000 });
}

/** Name, one activity, completed sync, then the roles hub. */
export async function reachRoles(page: Page, name: string) {
  await createDesignation(page, name);
  await selectActivity(page, "Account Payable");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await waitForSyncCompleted(page);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/step=roles/);
}

export function roleIdPaste(roles: { businessLabel: string }[] = rolesFile.newRoles) {
  return roles
    .map((role, index) => `${role.businessLabel}\tZ_E2E_${String(index).padStart(2, "0")}`)
    .join("\n");
}

export const newRoles = rolesFile.newRoles;
