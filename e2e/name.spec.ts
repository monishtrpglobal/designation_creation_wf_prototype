import { expect, test } from "@playwright/test";
import { openApp, resetFlowStorage } from "./helpers";

test.describe("designation name", () => {
  test.beforeEach(async ({ page }) => {
    await resetFlowStorage(page);
    await openApp(page, "/designation/new");
  });

  test("keeps Next enabled and rejects short, long, and duplicate names", async ({ page }) => {
    const next = page.getByRole("button", { name: "Next", exact: true });
    const name = page.getByRole("textbox", { name: "Designation name" });
    await expect(next).toBeEnabled();

    await name.fill("Ab");
    await next.click();
    await expect(page.getByText("Use at least 3 characters.")).toBeVisible();
    await expect(page).toHaveURL(/\/designation\/new$/);

    await name.fill("A".repeat(61));
    await next.click();
    await expect(page.getByText("Use 60 characters or fewer.")).toBeVisible();
    await expect(page).toHaveURL(/\/designation\/new$/);

    await name.fill("head of accountant");
    await next.click();
    await expect(page.getByText(/already exists/)).toBeVisible();
    await expect(page).toHaveURL(/\/designation\/new$/);
    await expect(next).toBeEnabled();
  });

  test("creates a draft and opens activities for a unique name", async ({ page }) => {
    const designation = "E2E Payroll Owner";
    await page.getByRole("textbox", { name: "Designation name" }).fill(designation);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page).toHaveURL(/step=activities/);
    await expect(page.getByText(designation)).toBeVisible();

    await page.goto("/designations");
    await page.getByRole("textbox", { name: "Search designations" }).fill(designation);
    const row = page.getByRole("row", { name: new RegExp(designation) });
    await expect(row.getByText("Draft", { exact: true })).toBeVisible();
    await expect(row.getByRole("link", { name: "Continue" })).toBeVisible();
  });
});
