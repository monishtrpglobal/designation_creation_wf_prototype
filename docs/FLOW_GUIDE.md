# CURSOR_AGENT_GUIDE.md: Designation Creation, purpose and screen flow

> The app is already built. This file explains **what the product is for and how the screens flow**, so Cursor can implement or adjust the screens in the existing codebase without guessing.
> Start every chat with: **"Read CURSOR_AGENT_GUIDE.md fully. Use the existing code structure and components. Work only on the screen I name."**
> Visual source of truth: Figma file **Designation Flow Hi-Fi** (`UVuqMleArgUwsltkPjAtRX`). Node ids are listed per screen. Always check the Figma frame before changing a screen.

---

## 1. Purpose of the app

An **SAP access-governance platform**. Companies map a **job designation** (for example "Head of Accountant") to the **SAP roles** a person in that job needs, so access is not handed out by hand.

The flow takes a designation from an idea to a **published, approved** designation:

1. Name the designation and pick the **business activities** it performs (Accounts Payable, Revenue Recognition, Tax, …).
2. **Sync** from SAP to learn which T-codes and authorization objects each activity needs.
3. The system **recommends SAP roles**. Existing roles are reused; missing ones must be **created** (new roles).
4. New roles are created in one of two ways:
   - **Option A, Build:** the platform creates them in SAP through the SAP Integration Flow API.
   - **Option B, Link:** the security team builds them manually in SAP (PFCG), then the platform links and validates them.
5. **Finalize:** run a Segregation-of-Duties (SoD) simulation, fix or whitelist conflicts.
6. Technical user **approves the transport (TR) movement** into the quality landscape.
7. **License optimization** analysis shows cost saving.
8. An **Admin gives final approval**, then the designation is **published** (or rejected).

## 2. Who uses it

| Person | What they do |
|---|---|
| Designation owner (business/security analyst) | Creates the designation, picks activities, reviews roles, finalizes, submits |
| Security team | In Option B, builds roles in SAP outside the platform |
| Technical user | Approves TR movement, re-runs failed license analysis |
| Admin | Reviews license report, final approval or rejection |

## 3. The wizard at a glance

Every wizard screen (2 to 9, 11 to 16) sits inside the same **Flow Shell**:

```
[ Prev ]  1 Designation Name – 2 Business Activities – 3 Run Sync – 4 Role Recommendation – 5 Role Finalization  [ Next ]

                         ( screen content )

[ Save as draft ]   helper text (+ optional link)                          [ optional primary action ]
```

- **Prev / Next** are in the stepper row, not the footer. No Back button in the footer.
- **Next is disabled** until the screen's rule is met. The footer helper text says **why** and links to the problem when possible.
- **Save as draft** is always available. The catalogue then shows the pending status.
- Footer primary action (when present) is one button, e.g. "Create 50 roles", "Submit for TR approval".
- Screens 1 and 12 (the catalogue) are **outside** the wizard (no shell).

### Screen map

```
1/12 Catalogue ──► 2 Name ──► 3 Activities ──► 4 Edit activity (dialog)
                                  │
                                  ▼
                           6 Run sync ──► 7 Recommended roles (hub)
                                              │
                              ┌───────────────┴───────────────┐
                        Option A (Build)                 Option B (Link)
                    8 Review new roles                9 Link roles built in SAP
                    + batch status (on 7)                     │
                              └───────────────┬───────────────┘
                                              ▼
                                  11 Role finalization + SoD
                                              ▼
                           (catalogue 12: Awaiting TR approval)
                                              ▼
                                  13 Approve TR movement
                                              ▼
                              14 License analysis (cell states)
                                              ▼
                              15 License optimization report
                                              ▼
                                  16 Final approval ──► Published / Rejected
```

Note on numbering: the original wireframe's Screen 5 (auth objects) is merged into **Screen 4**, and Screen 10 (batch status) is merged into **Screen 7** for Option A. Screen 7 appears on both the Option A and Option B pages.

---

## 4. Screen by screen

### Screen 1: Designation catalogue (empty, first time)
- **Purpose:** landing page when no designations exist.
- **Shows:** empty table state and the button **Create a New Designation**.
- **Action:** button goes to Screen 2.
- **Rule:** with 1 or more designations, the catalogue is Screen 12.
- Figma: frame `265:11527`, notes `265:11563`.

### Screen 2: Designation name
- **Purpose:** name the designation (example: "Head of Accountant").
- **Shows:** one text field, stepper at step 1. Prev is disabled here.
- **Rules:**
  - Validate **only when the user clicks Next**: 3 to 60 characters, unique, case-insensitive.
  - Next is **never disabled**.
  - A draft is created when Next passes (to confirm).
- Figma: `171:14827`, notes `171:21875`.

### Screen 3: Select business activities
- **Purpose:** pick which business activities the designation performs.
- **Shows:** cards: Account Payable, Account Receivable, General Ledger, Asset Accounting, Lease Accounting, Bank and Cash, Revenue Recognition, Inventory and Material Ledger, Tax. Each card has **Edit**.
- **Actions:** select or deselect cards; **Edit** opens Screen 4 for that activity.
- **Footer helper:** "5 activities selected" (count of selected).
- **Next:** goes to Run sync.
- Figma: `207:871`.

### Screen 4: Edit activity (dialog)
- **Purpose:** fine-tune the access an activity brings: T-codes, authorization objects, org levels.
- **Opens from:** Edit on an activity card (Screen 3).
- **Three tabs/areas** (15 frames, A to O):
  1. **T-codes** (frames `222:1689`, `222:23593`, `222:23865`, `222:25356`, `222:25628`): list with **Remove**, **Add T-code** (paste multiple). Added T-codes can be marked manual.
  2. **Authorizations** (`233:25060`, `233:26922`, `233:27796`, `233:28820`, `233:29873`, `233:30853`): auth objects grouped by class with status badges; **Edit**, kebab for Deactivate / Activate, **Delete** only for Manual objects (with confirmation).
  3. **Org levels** (`241:28679`, `241:29639`, `241:30567`, `241:30842`): fields like KOKRS, WERKS, BUKRS, VKORG; **Open** levels show **Set values**.
- **Rules:**
  - Pre-filled auth objects can only be **deactivated**, not deleted.
  - A **Warning banner for open org levels** appears only on frames L to O.
  - Wildcard values (`*`) need a stronger Warning and a confirm checkbox before saving.
- Figma sections: `222:1688`.

### Screen 6: Run sync
- **Purpose:** pull T-code / auth data from SAP for the chosen activities.
- **States:** **Running** (progress ring, steps Starting → Syncing → Completed), **Completed**, **Failed**.
- **Actions:** **View details** opens a dialog with sync details (3 dialogs: `253:10448`, `253:11657`, `253:12783`).
- **Rule:** **Next unlocks only when sync is Completed.**
- Figma section `245:9798`.

### Screen 7: Recommended roles (hub)
- **Purpose:** show the roles the system recommends for the designation and let the user decide how to create the missing ones.
- **Tabs:** **New roles** (50 sample) and **Existing roles** (20 sample, second page).
- **Shows:**
  - Existing roles: matches to reuse (no build needed).
  - New roles: suggested SAP name (max **30 characters**), status badge.
  - **Method choice** for all new roles: **Option A, Build** or **Option B, Link**.
  - Needs attention count (sample: 4 = 1 Error, 2 Name clash, 1 Too long).
- **Option A flow from here:**
  - **Review & Configure** opens Screen 8.
  - **Create N roles** (footer action) is enabled only when **every new role is Ready**.
  - Once creation starts: the method **locks**, page switches to **batch status**: each role shows a progress track **Creating → Profile & TR → Synced** with a chip (Queued, Creating, Created, Error).
  - Error rows show "SAP API: authorisation error" with **View error log** and **Retry**. **Retry all failed** re-calls only failed roles.
  - Summary bar (for example "32 of 40 created, 2 failed"), **Failed only** filter, completed rows collapsed.
  - TR number shown after Profile & TR (for example `DEVK900123`, "created on retry").
  - **Next** enabled only when all roles are Created and synced.
  - After creation starts, the method shows as one locked line and a **View creation progress** button.
- **Option B flow from here:** goes to Screen 9.
- **Footer helper examples:** "Create is locked: 4 roles need attention and 2 org levels (KOKRS, WERKS) are open in Revenue Recognition." with link **Open org levels**.
- Figma, Option A: `35:2509` (50 roles · before creation · New roles), `35:3896` (Existing roles), `38:3489` (tooltip hover), `48:5306`, `137:11997`, `132:11460`.
  Option B: `152:1777`, `148:12614`, `152:3164`, `155:2213`, `155:3166`, `155:4122`.

### Screen 8: Review new roles (Option A only)
- **Purpose:** check and fix each new role before creating them in SAP.
- **Layout:** left list of roles (scrolls, "Showing 1-9 of 50", half-cut row and scrollbar), right editor for the selected role.
- **Per role:** role name (max 30), description, T-codes and auth values (pre-filled), org levels, a **validation row with 5 checks** (naming convention, no duplicate roles, mandatory fields, auth values complete, …).
- **Name clash is fixed here**, not on Screen 7. A clash or "Too long" affects only that role.
- **Auth values complete** fails while org levels are open (for example KOKRS, WERKS).
- **Valid role vs invalid role** frames: `54:3157`, `54:3957`. Invalid shows the footer reason.
- **Sub-editors (drawers or dialogs):**
  - Authorizations table: `64:4936`
  - Edit auth object, checklist: `76:5795` (example F_BKPF_BUK)
  - Edit auth object, free entry: `77:6881` (example F_KNA1_GRP)
  - Org levels: `86:8134`; Edit org level (Plant): `87:8816`
  - T-codes: `90:9429`; Add T-codes (paste): `91:10337`; Edit T-code VA02: `95:10108`
  - Other: `102:11192`
- **Rule:** open org levels **block Create** (to confirm with the security team). SU24-proposed auth objects are applied by default and tagged "New" (to confirm).
- **Table pattern:** each row has a visible Link "Edit <object>"; a kebab menu appears only when secondary actions exist (Authorizations: Deactivate/Activate, Delete for Manual; T-codes: Remove T-code; Org levels: none). Row click also opens the drawer.

### Screen 9: Link roles built in SAP (Option B)
- **Purpose:** the security team builds roles in SAP; the user links them here and validates them.
- **Header chips** (overall state): Not started, Awaiting SAP, Linking roles, Gaps found, All validated.
- **Four numbered step cards** (unlock strictly 1 → 2 → 3 → 4):
  1. **Share requirement:** one package (roles, T-codes, auth values). Button **Send to security team**; later **View package** / resend.
  2. **Security team builds roles in SAP DEV (PFCG):** outside the platform; the user is notified when done.
  3. **Link roles in platform:** enter the **SAP role ID** (max 30 chars) per role. Row chips: **Needed**, **ID entered**, **Validated**, **Gap found**. At 50 roles: bulk paste / CSV import of role IDs, **Needs attention** filter, search.
  4. **Run sync and check recommendation:** **Run sync** enabled only when all role IDs are entered. A **gap report** (example "2 T-codes missing, 1 excess auth object") offers **Send gap report** and **Run sync again**.
- **Rules:** a gap affects only that role; validated roles are never reopened; **Next enabled only when all roles are Validated**. The catalogue shows "Awaiting SAP" or "Gaps found" while pending.
- Figma: `158:19944`, `158:20908`, `162:8663`, `163:19113`, `163:4681`, `163:6018`.

### Screen 11: Role finalization + SoD simulation
- **Purpose:** simulate Segregation-of-Duties conflicts between the designation's roles.
- **States:** **running** (`280:33418`) and **conflicts found** (`281:1770`).
- **Actions:** remediate or **whitelist** each conflict with a justification, then re-check. Whitelists **cannot change after submission**.
- **Footer action:** **Submit for TR approval**.
- Figma section `280:33669`; notes `282:34746`, `282:34755`.

### Screen 12: Catalogue (with designations)
- **Purpose:** list of all designations and where each is in the lifecycle.
- **Columns:** No, Designation, Department, Status, License / status, Saving, SoD risk, Last updated, Actions.
- **Status badges:**

| Status | Badge |
|---|---|
| Draft | Pending |
| Syncing to Dev, Moving to Quality, License analysis running | In progress |
| Awaiting TR approval, Awaiting final approval | Pending |
| Analysis failed, Rejected | Error |
| Published | Completed |

- **Row action links** depend on status: **Continue** (draft), **View**, **Review TR** (opens Screen 13), **Re-run analysis** (technical user), **Approve** (Admin, opens Screen 15), **Reopen** (Rejected, owner). Kebab appears only when secondary actions exist.
- **Other states:** delete confirmation dialog (`265:32866`), kebab open (`279:1226`), no results (`279:1445`). Pill filter tabs with counts for status.
- Figma: populated `264:11323`; section `275:728`.

### Screen 13: Approve TR movement
- **Purpose:** technical user approves moving the created roles (transport request) into the **quality** landscape.
- **States:** approve (`294:12779`), moving (`294:13265`).
- **Result:** designation status moves to In progress ("Moving to Quality"), then License analysis.
- Figma section `294:12778`.

### Screen 14: License analysis (cell states)
- **Purpose:** the License column states in the catalogue and report (running, done, failed, flagged).
- A failed analysis shows an Error badge and a **Re-run analysis** link (technical user).
- Figma `310:2814`, notes `310:2995`.

### Screen 15: License optimization report
- **Purpose:** show the Admin how much license cost the designation saves.
- **Opens from:** **Approve** link in the catalogue. Wide drawer (960).
- **Sample:** Inventory Controller (Supply Chain), ₹ 12.4 L → ₹ 9.6 L, saving ₹ 2.8 L (23%).
- **Actions:** **Approve** opens Screen 16; **Reject** requires a comment and gives the Rejected result. **Re-run** is shown disabled with its reason for the Admin.
- Figma: `319:2824`, notes `325:3269`.

### Screen 16: Final approval
- **Purpose:** last confirmation before publishing.
- **Two variants:**
  - **With SoD risk:** panel "Accepted during creation" lists each whitelisted conflict (role pair, risk label, justification, "Whitelisted by <name> · date"). "New since request was submitted" lists conflicts found when SoD re-runs at approval. The Admin must tick a **confirm checkbox**, and add a **comment** (required when High risk > 0), to enable **Continue and publish** (a warning-style button). A reason line says what is still missing. "Read more" and "View SoD details (read-only)" open a read-only drawer.
  - **No risk:** Cancel + **Publish**.
- **Results** (dialog over the catalogue with row 8 updated and pill counts changed): **Published** or **Rejected**.
- Figma section `332:3917`: `332:3918`, `333:3474`, `336:3816`, `337:4123`, `337:4591`, `341:4560`.
- Sample SoD: High 1, Medium 2, Low 3 (5 accepted: 3 whitelisted + 2 remediated; 1 new = the High).

---

## 5. Status vocabulary (always text + badge, never colour alone)

| Text | Badge |
|---|---|
| Ready, Validated, Created | Completed (green) |
| Creating, Linking, Syncing, ID entered | In progress (mint) |
| Queued, Needed | Pending (neutral) |
| Name clash, Too long, Awaiting SAP, Open, Wildcard, Higher risk | Warning |
| Error, Gap found | Error |
| Auth object: Standard | Light |
| Auth object: Maintained | Completed |
| Auth object: Changed | Dot |
| Auth object: Manual | Outline |
| Auth object: Inactive | Pending |
| "SAP default" | Light |

## 6. Business rules (checklist)

1. **Method lock:** Option A/B is chosen once for all new roles; locks when creation starts (A) or when the requirement is sent (B). *(to confirm)*
2. **Create N roles** enabled only when every new role is Ready.
3. **Name clash** and **Too long** are fixed on Screen 8, per role. SAP role name max **30 characters**.
4. **Open org levels block Create** *(to confirm)*; SU24-proposed auth objects applied by default, tagged "New" *(to confirm)*.
5. **Pre-filled auth objects** can only be deactivated; **Delete** only for Manual objects, with confirmation.
6. **Option A:** errors affect one role; created roles are never re-created; Retry re-calls the API for the failed role only; Next only when all Created and synced.
7. **Option B:** unlock order 1→2→3→4; Run sync only when all role IDs entered; validated roles never reopened; Next only when all Validated.
8. **Save as draft** always available; catalogue shows the pending status.
9. **Disabled primary actions** always explain why in the footer, with a link to the problem.
10. **Whitelists** (SoD) cannot change after submission.
11. **Higher-risk activities** (Delete, Reverse): Warning alert. **Wildcards** (`*`): stronger Warning + required confirm checkbox before save.
12. **Sample/demo data is always 50+ rows** for lists (50 new roles, 20 existing, second page); smaller counts appear only in annotations.

## 7. Drawer pattern (all edit drawers)

- Side drawer, full height, dimmed scrim, 620 wide (960 for Screen 15), no outer scrollbar.
- **Header band:** plain-language title + close, sub line with technical name + status badge, one-line info alert.
- **Body:** **step cards**, each with a numbered circle, a verb title and a right-aligned state ("4 selected", "Set", "Required", "Check values", "Wildcard"). A card still needing input has a warning border. Read-only context is flat (no card).
- **Footer band:** "What will be saved", result sentence, optional comparison line, **status line always present** ("Ready to save" / "Save is off: <why>" / "Save is off: nothing has changed yet"), then Link left, **Cancel** + **Save** right.
- Value lists show at most 4 chips plus "+N more" (with tooltip); long summaries show a count ("in 7 company codes").

## 8. Step-card states (Screen 9 and drawers)

| State | Text | Icon | Border |
|---|---|---|---|
| Done | success | check | default |
| Waiting | warning | clock | 1px warning |
| Required / in progress | info | | default |
| Locked | neutral | lock | default |
| Error | error | alert | error |

## 9. Sample data for demos and tests

- **Designation:** Head of Accountant (Screens 2 to 6).
- **New roles (Screen 7):** 50: 1 Error (Accounts Payable Approver), 2 Name clash (Procurement Clerk, Accounts Payable Reviewer), 1 Too long (Global Shared Services…, 34 chars), 46 Ready. Needs attention: 4.
- **Role example:** Revenue Recognition, `Z_SD_REVREC_CHG_1000` (20 of 30 chars).
- **Editor sample:** 12 T-codes (VA02, VA03, VA05 manual, VF03, VF44, VF45, VF46 manual, FB02, FB03, FBL3N, FBL5N manual, FAGLL03); 40 auth objects in 5 classes (AAAB 8, FI 14, SD 10, CO 4, BC 4); 8 org levels; "Edited · 5 changes".
- **Org levels:** KOKRS Not set (Open, 5 fields); WERKS Not set (Open, 9); BUKRS 1000, 1010, 2000, 3000, 4000, 5000, 6000 (12 fields, table shows 3 + "+4"); VKORG 1000-1999 (7); VTWEG 10 and 20 (4); SPART `*` (Wildcard, 6); LGORT 0001 (3); VSTEL 1000 (3). Open levels are always KOKRS and WERKS.
- **Plants:** 1000 Hamburg, 1010 Berlin, 2000 New York, 3000 Singapore, 4000 Shanghai.
- **Creation started (Screen 7):** Error 2, Creating 5, Syncing 5, Created 38 = 50.
- **Final approval sample:** Inventory Controller (Supply Chain), ₹ 12.4 L → ₹ 9.6 L, saving ₹ 2.8 L (23%), SoD High 1 / Medium 2 / Low 3. Names like A. Rao, M. Iyer are made-up sample data.

## 10. How Cursor should work on this app

1. Read the **screen section** above and the Figma frames for that screen (including the right-margin annotation frame: those notes are for developers, not for rendering).
2. **Reuse what is already in the codebase:** existing layout, shell, components and API calls. Do not create a parallel structure. Search the repo for the closest existing screen or component first.
3. If something in Figma is not in the app yet, add it in the place that matches how similar screens are organized.
4. Implement each Figma frame as a real state of the screen (for example name clash, all ready, creation started, partial failure, all created).
5. Apply the rules in section 6 exactly. If code and Figma disagree, report the difference instead of choosing silently.
6. Keep status always **text + badge** (and an icon where Figma shows one); keep keyboard focus visible; meaningful text uses the body text colour, not the muted one.
7. Make one screen or one pattern per task and finish with a short summary of what changed.

## 11. Open questions (mark `TODO(confirm)` in code, do not block)

- Do open org levels always block Create? Are SU24 objects applied by default? Does the method lock on "Send to security team" in Option B?
- Is merging batch status (old Screen 10) into Screen 7 acceptable?
- Can SAP provide value lists (F4 help) for fields? If not, values are free entry.
- Does "Send gap report" notify inside the platform or export a file?
- Catalogue: where does Department come from? Who besides the Admin can see **Approve**?
- Finalization and approval: who may whitelist SoD conflicts, and is a second approver needed? Does a failed license analysis block Approve? Does a new High risk found at approval block Publish or only require a comment? Does the SoD check re-run at approval?
- Confirmed: the SAP Integration Flow API sends T-codes, auth objects and values, org levels and object status; SAP role name limit is 30 characters; whitelist justification and whitelister name are visible to the approver.
