import { expect, test } from "@playwright/test";
import { openApp, resetFlowStorage } from "./helpers";

test.describe("TR and final approval", () => {
  test.beforeEach(async ({ page }) => {
    await resetFlowStorage(page);
  });

  test("approves a seeded transport into Moving to Quality", async ({ page }) => {
    await openApp(page, "/designation/procurement-lead/tr");
    await expect(page.getByRole("heading", { name: "Approve TR movement" })).toBeVisible();
    await page.getByRole("button", { name: "Approve and move to Quality" }).click();
    await expect(page.getByText("Moving to Quality").first()).toBeVisible();
  });

  test("rejects the license report only when a comment is entered", async ({ page }) => {
    await openApp(page, "/designation/finance-business-partner/approve");
    await page.getByRole("button", { name: "Reject", exact: true }).click();
    await expect(page.getByText("Enter a comment to reject")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Designation catalogue" })).toBeVisible();

    await page.getByRole("textbox", { name: /Comment \(required to reject\)/ }).fill("Sample rejection for the e2e suite.");
    await page.getByRole("button", { name: "Reject", exact: true }).click();
    await expect(page.getByText("Rejected.", { exact: true })).toBeVisible();
    await page.getByRole("textbox", { name: "Search designations" }).fill("Finance Business Partner");
    await expect(page.getByRole("row", { name: /Finance Business Partner/ }).getByText("Rejected")).toBeVisible();
  });

  test("publishes Inventory Controller only after the SoD checkbox and comment", async ({ page }) => {
    await openApp(page, "/designation/inventory-controller/approve");
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    const publish = page.getByRole("button", { name: "Continue and publish" });
    await expect(publish).toBeDisabled();
    await expect(page.getByText(/Continue is off:/)).toBeVisible();

    await page.getByRole("checkbox", { name: "I understand these risks and want to publish anyway." }).check();
    await expect(publish).toBeDisabled();
    await page.getByRole("textbox", { name: /Comment \(required: 1 High risk\)/ }).fill("Accepted for the sample designation.");
    await expect(publish).toBeEnabled();
    await publish.click();
    await expect(page.getByText("Designation published.")).toBeVisible();
  });

  test("reopens a rejected designation as a draft", async ({ page }) => {
    await openApp(page, "/designations");
    await page.getByRole("textbox", { name: "Search designations" }).fill("Credit Controller");
    await page.getByRole("link", { name: "Reopen", exact: true }).click();
    await expect(page).toHaveURL(/id=credit-controller&step=activities/);
    await page.goto("/designations");
    await page.getByRole("textbox", { name: "Search designations" }).fill("Credit Controller");
    const row = page.getByRole("row", { name: /Credit Controller/ });
    await expect(row.getByText("Draft", { exact: true })).toBeVisible();
    await expect(row.getByRole("link", { name: "Continue" })).toBeVisible();
  });
});
