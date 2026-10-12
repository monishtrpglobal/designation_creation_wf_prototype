import { expect, test } from "@playwright/test";
import { reachRoles } from "./helpers";

const attentionRoles = [
  ["Procurement Clerk", "Z_E2E_CLERK"],
  ["Accounts Payable Reviewer", "Z_E2E_REVIEW"],
  ["Accounts Payable Approver", "Z_E2E_APPROVE"],
  ["Global Shared Services", "Z_E2E_SHARED"],
] as const;

test.describe("option A", () => {
  test("creates roles only after names and open org levels are fixed, then retries failures", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await reachRoles(page, "E2E Option A");
    await page.getByRole("button", { name: "Review & Configure (Option A)" }).first().click();
    await expect(page).toHaveURL(/step=review/);

    const create = page.getByRole("button", { name: "Create 50 roles" });
    await expect(create).toBeDisabled();
    await expect(page.getByText(/Create is locked:/)).toBeVisible();
    await expect(page.getByText(/KOKRS, WERKS/)).toBeVisible();

    const search = page.getByRole("textbox", { name: "Search roles" });
    const roleName = page.getByRole("textbox", { name: "Role name" });
    for (const [label, sapName] of attentionRoles) {
      await search.fill(label);
      await page.getByRole("option", { name: new RegExp(label) }).click();
      await roleName.fill(sapName);
      await expect(page.getByRole("option", { name: new RegExp(`${label}[\\s\\S]*Ready`) })).toBeVisible();
    }
    await search.fill("");

    await page.getByRole("link", { name: "Open org levels" }).click();
    await page.getByRole("link", { name: "Set values" }).first().click();
    await expect(page.getByRole("heading", { name: "Controlling area", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Enter a range or pattern instead" }).click();
    await page.getByRole("textbox", { name: "From" }).fill("1000");
    await page.getByRole("textbox", { name: "To" }).fill("1000");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await page.getByRole("link", { name: "Set values" }).click();
    await expect(page.getByRole("heading", { name: "Plant", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(create).toBeEnabled();
    await create.click();
    await expect(page).toHaveURL(/step=roles/, { timeout: 90_000 });
    await expect(page.getByText("48 of 50 created · 0 in progress · 2 failed")).toBeVisible({
      timeout: 90_000,
    });
    await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
    await expect(page.getByText("Method is locked: creation started.")).toBeVisible();

    await page.getByRole("button", { name: "Retry all failed" }).click();
    await expect(page.getByText("50 of 50 created and synced.")).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page).toHaveURL(/step=finalize/);
    await expect(page.getByRole("button", { name: "Submit for TR approval" })).toBeVisible();
  });
});
