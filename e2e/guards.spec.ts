import { expect, test } from "@playwright/test";
import { openApp, resetFlowStorage } from "./helpers";

test.describe("step guards and draft", () => {
  test.beforeEach(async ({ page }) => {
    await resetFlowStorage(page);
  });

  test("sends a deep link back to the last allowed step", async ({ page }) => {
    await openApp(page, "/designation/new?id=head-of-accountant&step=finalize");
    await expect(page).toHaveURL(/id=head-of-accountant&step=activities/);

    await openApp(page, "/designation/new?id=senior-ap-specialist&step=link");
    await expect(page).toHaveURL(/id=senior-ap-specialist&step=review/);

    await openApp(page, "/designation/new?id=general-ledger-steward&step=review");
    await expect(page).toHaveURL(/id=general-ledger-steward&step=link/);
  });

  test("saves a draft from activities and returns to the catalogue", async ({ page }) => {
    await openApp(page, "/designation/new?id=head-of-accountant&step=activities");
    await page.getByRole("button", { name: "Save as draft" }).click();
    await expect(page).toHaveURL(/\/designations$/);
    await page.getByRole("textbox", { name: "Search designations" }).fill("Head of Accountant");
    const row = page.getByRole("row", { name: /Head of Accountant/ });
    await expect(row.getByText("Draft", { exact: true })).toBeVisible();
    await expect(row.getByRole("link", { name: "Continue" })).toBeVisible();
  });
});
