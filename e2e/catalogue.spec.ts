import { expect, test } from "@playwright/test";
import { openApp, resetFlowStorage, seedEmptyCatalogue } from "./helpers";

test.describe("catalogue", () => {
  test("shows lifecycle filters and the row action for each status", async ({ page }) => {
    await resetFlowStorage(page);
    await openApp(page, "/designations");
    await expect(page.getByRole("heading", { name: "Designation catalogue" })).toBeVisible();

    for (const filter of [
      "Draft",
      "Awaiting TR approval",
      "Analysis failed",
      "Awaiting final approval",
      "Published",
      "Rejected",
    ]) {
      await expect(page.getByRole("tab", { name: new RegExp(filter) })).toBeVisible();
    }

    const search = page.getByRole("textbox", { name: "Search designations" });
    const cases: [string, string][] = [
      ["Head of Accountant", "Continue"],
      ["Procurement Lead", "Review TR"],
      ["Inventory Controller", "Approve"],
      ["Tax Compliance Officer", "Re-run analysis"],
      ["Credit Controller", "Reopen"],
      ["Asset Accounting Lead", "View"],
    ];
    for (const [designation, action] of cases) {
      await search.fill(designation);
      const row = page.getByRole("row", { name: new RegExp(designation) });
      await expect(row.getByRole("link", { name: action, exact: true })).toBeVisible();
    }

    await search.fill("zzzz-not-a-designation");
    await expect(page.getByText(/No designations match/)).toBeVisible();
  });

  test("empty catalogue starts a new designation", async ({ page }) => {
    await seedEmptyCatalogue(page);
    await openApp(page, "/designations");
    await expect(page.getByText("Create your first designation")).toBeVisible();
    await page.getByRole("button", { name: "Create a New Designation" }).click();
    await expect(page).toHaveURL(/\/designation\/new$/);
    await expect(page.getByRole("textbox", { name: "Designation name" })).toBeVisible();
  });
});
