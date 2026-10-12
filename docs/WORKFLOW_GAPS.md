# Workflow gaps

Business rules are in [FLOW_GUIDE.md](FLOW_GUIDE.md) (section 6 and the screen gates). This file lists places where the running prototype does not match those rules. Fix them one by one. Do not treat the open questions at the bottom as defects.

Each gap has a Playwright scenario marked `test.fixme` in [e2e/gaps.spec.ts](../e2e/gaps.spec.ts). Those scenarios are skipped so `npm run test:e2e` stays green. When a gap is fixed, remove `fixme` from that test and assert the expected behaviour.

## Confirmed gaps

### G1 — Save as draft is missing on the name step

- **Rule:** section 6, rule 8. Save as draft is always available.
- **Expected:** Screen 2 offers Save as draft, the same way later wizard steps do.
- **Now:** [NamePage.tsx](../src/features/designation/name/NamePage.tsx) has no Save as draft control. Activities, sync, roles, review, link, and finalize each call `saveDraft`.
- **Fixme:** `G1 name step offers Save as draft`

### G2 — Screen 4 cannot deactivate or delete authorizations

- **Rule:** section 6, rule 5. Pre-filled auth objects can only be deactivated. Delete is only for Manual objects, and it asks for confirmation.
- **Expected:** Edit activity (Screen 4) authorizations tab has Deactivate / Activate, and Delete with a confirmation dialog for Manual objects.
- **Now:** [EditActivityDialog.tsx](../src/features/designation/activities/EditActivityDialog.tsx) only offers Edit on that tab. Screen 8 does the rule in [RoleEditor.tsx](../src/features/designation/review/RoleEditor.tsx) (`authColumns`, `DeleteAuthDialog`).
- **Fixme:** `G2 activity authorizations can be deactivated or deleted`

### G3 — Catalogue does not show Option B pending statuses

- **Rule:** Screen 9. While Option B is pending, the catalogue shows “Awaiting SAP” or “Gaps found”.
- **Expected:** Those texts appear as the designation status (text plus badge), not only as role chips.
- **Now:** Role chips on the link screen use those texts. Catalogue lifecycle badges stay Draft, Completed, and the other statuses in [catalogueView.ts](../src/features/designation/catalogue/catalogueView.ts). [seed.ts](../src/state/seed.ts) notes this with `TODO(confirm)` inside `seedDesignations`. Sample rows: `general-ledger-steward` (awaiting), `cost-controller` (gaps).
- **Fixme:** `G3 catalogue shows Awaiting SAP or Gaps found`

### G4 — License route is an unfinished shell

- **Rule:** Screen 14, license analysis cell states.
- **Expected:** `/designation/{id}/license` shows the license analysis states (running, done, failed, flagged).
- **Now:** [src/app/designation/[id]/license/page.tsx](../src/app/designation/[id]/license/page.tsx) renders [ScreenFrame.tsx](../src/features/designation/ScreenFrame.tsx) with “This screen is not built yet.” Cell states and Re-run analysis live on the catalogue (`licenceCell`, `canRerunLicense`).
- **Fixme:** `G4 license route shows analysis states`

### G5 — Activity auth wildcard does not require confirmation

- **Rule:** section 6, rule 11. Higher-risk activities (Delete, Reverse) show a Warning. A wildcard (`*`) needs a stronger Warning and a confirm checkbox before save.
- **Expected:** Saving an activity authorization that uses `*`, Delete, or Reverse stays off until the user confirms.
- **Now:** [ActivityDrawers.tsx](../src/features/designation/activities/ActivityDrawers.tsx) `EditAuthDrawer` shows “Higher-risk activity” for `*` and still allows Save. Delete and Reverse are not named there. Org-level wildcards in the same file and in [RoleEditorDrawers.tsx](../src/features/designation/review/RoleEditorDrawers.tsx) do disable Save until the checkbox is ticked.
- **Fixme:** `G5 activity auth wildcard requires confirmation`

### G6 — Create roles is not the Screen 7 footer action

- **Rule:** Screen 7. The footer primary action is “Create N roles”, enabled only when every new role is Ready (and open org levels are set).
- **Expected:** Screen 7 footer is “Create 50 roles”, with the lock helper and a link to the problem.
- **Now:** Screen 7 ([RolesPage.tsx](../src/features/designation/roles/RolesPage.tsx)) only offers “Review & Configure (Option A)”. “Create 50 roles” is the Screen 8 footer in [ReviewPage.tsx](../src/features/designation/review/ReviewPage.tsx). The Ready and open-org lock itself is implemented there (`createDisabled`, `orgLevelsBlockCreate`).
- **Fixme:** `G6 Screen 7 footer is Create roles`

### G7 — Creation filter is labelled Issues

- **Rule:** Screen 7, after creation starts. The filter is “Failed only”.
- **Expected:** A filter whose visible name is “Failed only”.
- **Now:** [RolesPage.tsx](../src/features/designation/roles/RolesPage.tsx) uses the pill label “Issues” for both the pre-create attention filter and the post-create failed filter.
- **Fixme:** `G7 creation filter is labelled Failed only`

G8 is not a gap. Send gap report already shows the alert “Gap report sent”. The Option B scenario asserts that.

### G9 — License failure cannot be started from the UI

- **Rule:** Screen 14. A failed analysis shows an Error badge and Re-run analysis.
- **Expected:** A user can reach a failed license run from the product, not only from seed data.
- **Now:** `startLicenseAnalysis(id, { fail: true })` exists in the store. Catalogue Re-run calls it without `fail`, so a re-run succeeds. The only Analysis failed row is the seed `tax-compliance-officer`. A refresh during a live run is settled to failed by `settleInterrupted` in [seed.ts](../src/state/seed.ts), which is not a user action.
- **Fixme:** `G9 license analysis can fail from the UI`

### G10 — One user can act as owner, technical user, and Admin

- **Rule:** Section 2. The technical user approves TR movement and re-runs license analysis. The Admin reviews the license report and gives final approval. The guide marks persona visibility as `TODO(confirm)` in [catalogueView.ts](../src/features/designation/catalogue/catalogueView.ts).
- **Expected:** Review TR, Re-run analysis, and Approve are not all available to the same unsigned-in user.
- **Now:** [catalogueView.ts](../src/features/designation/catalogue/catalogueView.ts) `rowAction` exposes all of them on one catalogue. There is no persona switch.
- **Fixme:** `G10 catalogue actions follow persona`

### G11 — Some edit drawers explain a disabled Save without a link

- **Rule:** section 6, rule 9. A disabled primary action says why, with a link to the problem.
- **Expected:** Drawer footers that say “Save is off: …” include a link to the field that is blocking save.
- **Now:** Wizard footers do include that link (sync, activities, roles, review, link, finalize, final approval). [RoleEditorDrawers.tsx](../src/features/designation/review/RoleEditorDrawers.tsx) `OrgLevelDrawer` uses “Save is off: choose a value” / “Save is off: confirm the wildcard” and its link is “Reset to previous values”, which does not point at the empty field. The same pattern appears on other drawers in that file (“Save is off: nothing has changed yet”).
- **Fixme:** `G11 drawer Save-is-off includes a link to the problem`

### G12 — Store can change a SoD decision after submit

- **Rule:** section 6, rule 10. Whitelists cannot change after submission.
- **Expected:** Every store write that sets a SoD decision refuses the change once `steps.finalize` is true.
- **Now:** The screen holds the rule. [FinalizePage.tsx](../src/features/designation/finalize/FinalizePage.tsx) disables the controls when submitted, and `applySodDecisions` returns false when `steps.finalize` is set. `setSodDecision` in [flowStore.ts](../src/state/flowStore.ts) does not check that flag. A browser test cannot call that action; the skipped scenario records the store gap.
- **Fixme:** `G12 setSodDecision refuses changes after submit`

## Already aligned (do not re-open)

These match the guide in the current store and screens:

- Method locks when creation starts (Option A) and when the requirement is sent (Option B). `chooseMethod` is a no-op once `methodLocked` is set.
- Designation name is checked only on Next: 3 to 60 characters, unique, case-insensitive. Next stays enabled. A passing Next creates the draft.
- Sync Next stays off until the sync status is completed. `step=sync&outcome=failed` keeps it off until Retry sync.
- Open KOKRS or WERKS blocks Create (`orgLevelsBlockCreate`). Name clash, Too long, and the seed Error are fixed by editing the SAP name on Screen 8. The SAP name max is 30 characters.
- Option B unlocks steps 1 → 2 → 3 → 4. Run sync stays off until every role id is 1–30 characters. Validated rows stay read-only. Next stays off until every role is Validated.
- SoD controls on Screen 11 stay disabled after Submit for TR approval.
- Lists are 50 new roles and 20 existing roles. Existing roles paginate.
- Final publish with SoD risk stays off until the confirm checkbox is ticked, and until a comment is entered when High risk is greater than 0.
- Send gap report shows an in-app alert, “Gap report sent”, on the link screen. Whether that should also export a file is still an open question, not a missing button.

## Open questions (not defects)

From FLOW_GUIDE section 11. Leave these until someone confirms them:

- Are SU24-proposed auth objects applied by default, and is the Screen 8 “New” tag enough?
- Can SAP provide value lists (F4), or is free entry correct?
- Where does catalogue Department come from?
- Who may whitelist a SoD conflict, and is a second approver required?
- Does a failed license analysis block Approve?
- Does a new High risk found at approval block Publish, or only require a comment? The prototype requires a comment and does not hard-block Publish (`TODO(confirm)` on `approveFinal`).
- Does “Send gap report” also need a file export? The screen already shows the sample alert “Gap report sent”.
- Does the SoD check re-run at approval?
