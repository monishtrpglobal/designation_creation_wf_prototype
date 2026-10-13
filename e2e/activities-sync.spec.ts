import { expect, test } from "@playwright/test";
import { createDesignation, selectActivity, waitForSyncCompleted } from "./helpers";

test.describe("activities and sync", () => {
  test("keeps Next off until an activity is selected, then until sync completes", async ({ page }) => {
    await createDesignation(page, "E2E Activity Sync");
    const next = page.getByRole("button", { name: "Next", exact: true });
    await expect(next).toBeDisabled();
    await expect(page.getByRole("link", { name: "select at least one activity" })).toBeVisible();

    await selectActivity(page, "Account Payable");
    await expect(page.getByText("1 activity selected")).toBeVisible();
    await expect(next).toBeEnabled();
    await next.click();

    await expect(page).toHaveURL(/step=sync/);
    await expect(next).toBeDisabled();
    await waitForSyncCompleted(page);
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page).toHaveURL(/step=roles/);
  });

  test("keeps Next off after a failed sync until retry succeeds", async ({ page }) => {
    await createDesignation(page, "E2E Failed Sync");
    await selectActivity(page, "Account Payable");
    const url = new URL(page.url());
    const id = url.searchParams.get("id");
    await page.goto(`/designation/new?id=${id}&step=sync&outcome=failed`);
    await expect(page.getByText("SAP did not finish reading authorization values.")).toBeVisible({
      timeout: 20_000,
    });
    const next = page.getByRole("button", { name: "Next", exact: true });
    await expect(next).toBeDisabled();
    await page.getByRole("link", { name: "Retry sync" }).click();
    await expect(page.getByText("Sync completed")).toBeVisible({ timeout: 20_000 });
    await expect(next).toBeEnabled();
  });
});
