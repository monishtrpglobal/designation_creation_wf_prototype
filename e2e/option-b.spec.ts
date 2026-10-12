import { expect, test } from "@playwright/test";
import { reachRoles, roleIdPaste } from "./helpers";

test.describe("option B", () => {
  test("locks the method on send, then validates every role id before Next", async ({ page }) => {
    test.setTimeout(90_000);
    await reachRoles(page, "E2E Option B");
    await page.getByRole("radio", { name: /Option B/ }).click();
    await page.getByRole("button", { name: "Link roles built in SAP (Option B)" }).first().click();
    await expect(page).toHaveURL(/step=link/);

    const next = page.getByRole("button", { name: "Next", exact: true });
    await expect(next).toBeDisabled();
    await expect(page.getByText("Next is locked: send the requirement to the security team first.")).toBeVisible();

    await page.getByRole("button", { name: "Send to security team" }).click();
    await page.getByRole("button", { name: "Prev", exact: true }).click();
    await expect(page).toHaveURL(/step=roles/);
    await expect(page.getByText("Method is locked: Option B · Link roles built in SAP")).toBeVisible();

    await page.getByRole("button", { name: "Continue linking roles" }).first().click();
    await page.getByRole("link", { name: "Security team is done (sample)" }).click();
    await expect(page.getByText("Unlocks when all 50 role IDs are entered.")).toBeVisible();

    await page.getByRole("button", { name: "Paste role IDs" }).click();
    const paste = page.getByRole("textbox", { name: "Role names and SAP role IDs" });
    await paste.fill("Procurement Analyst\tZ_FI_TREASURY_CASH_NETTING_POSITION_DRAFT");
    await page.getByRole("button", { name: "Check the result" }).click();
    await expect(page.getByText("Too long", { exact: true }).first()).toBeVisible();

    await paste.fill(roleIdPaste());
    await page.getByRole("button", { name: "Check the result" }).click();
    await page.getByRole("button", { name: "Apply 50 role IDs" }).click();
    await expect(page.getByRole("button", { name: "Run sync", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Run sync", exact: true }).click();

    await expect(page.getByText("Gap found").first()).toBeVisible();
    await expect(page.getByRole("textbox", { name: "SAP role ID for Accounts Receivable Clerk" })).toBeDisabled();
    await expect(next).toBeDisabled();
    await page.getByRole("button", { name: "Send gap report" }).click();
    await expect(page.getByText("Gap report sent")).toBeVisible();

    await page.getByRole("button", { name: "Run sync again" }).click();
    await expect(page.getByText(/All 50 roles validated/)).toBeVisible();
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page).toHaveURL(/step=finalize/);
  });
});
