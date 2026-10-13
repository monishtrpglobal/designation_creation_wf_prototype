import { test } from "@playwright/test";

/**
 * Skipped until the matching item in docs/WORKFLOW_GAPS.md is fixed.
 * Remove `fixme` on that test and assert the expected behaviour.
 */
test.describe("workflow gaps", () => {
  test.fixme("G1 name step offers Save as draft", async () => {
    // Screen 2 should show Save as draft and return to the catalogue as Draft.
  });

  test.fixme("G2 activity authorizations can be deactivated or deleted", async () => {
    // Edit Account Payable, Authorizations: Deactivate a pre-filled object, and Delete a Manual object after confirmation.
  });

  test.fixme("G3 catalogue shows Awaiting SAP or Gaps found", async () => {
    // general-ledger-steward and cost-controller should show those statuses on /designations.
  });

  test.fixme("G4 license analysis stays on the catalogue", async () => {
    // License analysis states stay on /designations. View must not open /designation/{id}/license.
  });

  test.fixme("G5 activity auth wildcard requires confirmation", async () => {
    // Saving * , Delete, or Reverse on an activity authorization stays off until the confirm checkbox is ticked.
  });

  test.fixme("G6 Screen 7 footer is Create roles", async () => {
    // The roles hub footer should be Create 50 roles, locked while any new role needs attention.
  });

  test.fixme("G7 creation filter is labelled Failed only", async () => {
    // After creation starts, the failed-role filter should read Failed only.
  });

  test.fixme("G9 license analysis can fail from the UI", async () => {
    // A user action should be able to finish license analysis as Analysis failed.
  });

  test.fixme("G10 catalogue actions follow persona", async () => {
    // Review TR, Re-run analysis, and Approve should not all be available to the same user.
  });

  test.fixme("G11 drawer Save-is-off includes a link to the problem", async () => {
    // An org-level drawer with nothing chosen should link to the empty field, not only explain Save is off.
  });

  test.fixme("G12 setSodDecision refuses changes after submit", async () => {
    // setSodDecision in the store should no-op once steps.finalize is true. The screen already disables the controls.
  });

  test.fixme("G13 TR approval stays on the catalogue", async () => {
    // Review TR and Moving to Quality View open the TR dialog on /designations.
  });

  test.fixme("G14 license report and final approval stay on the catalogue", async () => {
    // Approve opens the report drawer and final-approval dialog on /designations. Published View stays there.
  });
});
