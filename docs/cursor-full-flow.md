# Full flow build: Screens 1 to 16

Run each phase in a NEW Cursor chat (Agent mode). Every prompt starts with "Read .cursor/rules/project.mdc" so context is restored. Do not start a phase until the previous one passes review. Commit after each phase.

Figma screens file: UVuqMleArgUwsltkPjAtRX. DS file: l3QZ1x8fDQEkEimzgwPInE.

## Route map (Cursor must follow this)
| Route | Screen |
|---|---|
| /designations | 12 Catalogue (lifecycle). Shows Screen 1 empty state when there are no designations |
| /designation/new | 2 Designation name |
| /designation/[id]/activities | 3 Select business activities (+ 4 Edit activity dialog) |
| /designation/[id]/sync | 6 Run sync |
| /designation/[id]/roles | 7 Recommended roles hub (Option A creation progress is on this page; Screen 10 is merged here) |
| /designation/[id]/roles/review | 8 Review new roles, Option A (+ drawers) |
| /designation/[id]/roles/link | 9 Link roles built in SAP, Option B |
| /designation/[id]/finalize | 11 Role finalization + SoD simulation |
| /designation/[id]/tr | 13 Approve TR movement |
| /designation/[id]/license | 14 License analysis states, 15 License optimization report (Drawer XL) |
| /designation/[id]/approve | 16 Final approval (dialogs and results) |

Screen 5 is merged into Screen 4. Screen 10 is merged into Screen 7.

## Frame ids per screen (for get_design_context and get_screenshot)
- Shell: 10:1362
- 1: 265:11527 | 2: 171:14827 | 3: 207:871
- 4: T-codes 222:1689, 222:23593, 222:23865, 222:25356, 222:25628; Authorizations 233:25060, 233:26922, 233:27796, 233:28820, 233:29873, 233:30853; Org levels 241:28679, 241:29639, 241:30567, 241:30842
- 6: section 245:9798 (running, completed, failed, dialogs 253:10448, 253:11657, 253:12783)
- 7 Option A: 35:2509, 35:3896, 38:3489, 48:5306, 137:11997, 132:11460 | Option B: 152:1777, 148:12614, 152:3164, 155:2213, 155:3166, 155:4122
- 8: 54:3157, 54:3957, 102:11192, 90:9429, 91:10337, 95:10108, 64:4936, 76:5795, 77:6881, 86:8134, 87:8816
- 9: 158:19944, 158:20908, 162:8663, 163:19113, 163:4681, 163:6018
- 11: 280:33418, 281:1770 | 12: 264:11323, 265:32866, 279:1226, 279:1445 | 13: 294:12779, 294:13265 | 14: 310:2814 | 15: 319:2824 | 16: 332:3918, 333:3474, 336:3816, 337:4123, 337:4591, 341:4560

---

## Phase A: Foundation (components)
Split into three prompts (A1, A2, A3). Prompts 0 to 3 from cursor-prompts.md must be done first.

### A1: Alert, Link, Tooltip, Card, Text Field, Text Area, Select, Multi Select, Tags Field, Checkbox, Radio card
```
Read .cursor/rules/project.mdc.
Build these in src/ds, wrapping Mantine, matching the Figma iRM Design System (file l3QZ1x8fDQEkEimzgwPInE) variants and props exactly: Alert (types, compact, action slots), Link, Tooltip (default 240, wide 400, single-line), Card (content slot), TextField (default, search with clear, error, disabled), TextArea (counter, over limit + error state), Select, MultiSelect, TagsField, Checkbox (square and round, SM and MD, label optional), RadioCard (selected, disabled).
For each: get_design_context and get_screenshot the Figma component set first. Field border is --color-border-field, hover --color-border-field-hover. Focus ring --color-focus-link inside 2px.
Add every variant to /ds. No hardcoded values. Report what does not map cleanly. Stop.
```

### A2: Tabs, Segmented Control, Accordion, RowMenu, Table, Pagination, Progress
```
Read .cursor/rules/project.mdc.
Build in src/ds from the Figma DS: Tabs (underline and pill, count Badge slot), SegmentedControl, Accordion (two badge slots, panel slot), RowMenu (kebab Menu), Table (sortable header cell: sort off/idle/asc/desc; rows are plain token-bound; props for columns, rows, onRowClick), Pagination (numbered, 10/25/50 page size, optional range text "1-25 of 50", use at 760px or wider), ProgressRing (0 to 100 in steps, SM/MD/LG), ProgressLine (stretching track), ProgressTrack (node, connector, track for Creating, Profile and TR, Synced).
Fetch each Figma component first. Add to /ds. No hardcoded values. Stop.
```

### A3: Drawer, Dialog, Scrim, Step card, Scrollbar, SectionPatterns
```
Read .cursor/rules/project.mdc.
Build in src/ds:
- Drawer wrapping Mantine Drawer: sizes SM, MD, LG (620), XL (960), position right, slots Header, Body, Footer. Full viewport height, no page scrollbar. Header band and footer band use a tinted surface and a border; body is on the canvas colour. Use Figma frames 76:5795 and 319:2824 in file UVuqMleArgUwsltkPjAtRX as the reference.
- DrawerFooterSummary: label "What will be saved", result sentence, optional comparison line, status line with icon (always present: success, warning, secondary), divider, actions row (Link left, Secondary and Primary right, 40px, gap 12).
- Dialog wrapping Mantine Modal: 480 to 720 wide, fixed header and footer, scrolling body, scrim.
- StepCard: plain frame, white, 1px border, card radius, padding space-s16, gap space-s12; header has numbered circle, title, right-aligned state text with icon; states Done, Waiting, Required, Locked, Error with the colours from the rules (Done success + check, Waiting warning + clock + warning border, Required info, Locked neutral + disabled circle, Error error + alert icon + error border). Always with a text label.
- Add a /ds/patterns page showing all of them.
Stop.
```

**Review gate A:** open /ds and /ds/patterns, compare with Figma, run `next build`, grep for hex values. Commit "phase-a".

---

## Phase B: Data, state and routing
```
Read .cursor/rules/project.mdc and cursor-full-flow.md (route map).

1. src/mock: create typed mock data.
   - designations.json: 9 designations across lifecycle statuses (Draft, Syncing to Dev, Awaiting TR approval, Moving to Quality, License analysis running, Awaiting final approval, Analysis failed, Rejected, Published). Include Inventory Controller (Supply Chain) as the one used on Screens 13 to 16 (₹ 12.4 L to ₹ 9.6 L, saving ₹ 2.8 L, 23%; SoD High 1, Medium 2, Low 3).
   - activities.json: Account Payable, Account Receivable, General Ledger, Asset Accounting, Lease Accounting, Bank and Cash, Revenue Recognition, Inventory and Material Ledger, Tax, with T-codes (VA02, VA03, VA05 manual, VF03, VF44, VF45, VF46 manual, FB02, FB03, FBL3N, FBL5N manual, FAGLL03), 40 auth objects in 5 classes (AAAB 8, FI 14, SD 10, CO 4, BC 4) and 8 org levels (KOKRS and WERKS open; BUKRS 1000, 1010, 2000, 3000, 4000, 5000, 6000; VKORG 1000-1999; VTWEG 10, 20; SPART *; LGORT 0001; VSTEL 1000).
   - roles.json: 50 new roles (3 Name clash: Lease Accounting, Tax Reporting Approver, Asset Retirement Clerk; 1 Too long: "Corporate Treasury and Cash Positioning" at 34 characters; 46 Ready), 20 existing roles, all SAP role names max 30 characters except the one deliberate Too long. Revenue Recognition = Z_SD_REVREC_CHG_1000.
   - sod.json, license.json: for Screens 11, 14, 15, 16 (conflicts with role pair, risk, justification, whitelisted by (sample name) and date).
2. src/state/flowStore.ts: Zustand store with persist (localStorage). State: designations, current designation, method (A or B, locked flag), role statuses, org level values, creation progress, sync status, SoD decisions, approval state. Actions for each transition. A "Reset demo" button in a small dev bar.
3. src/lib/fakeApi.ts: async functions with delays (sync progress 0 to 100, role creation per role, license analysis). No real network.
4. Create all routes from the route map with placeholder pages that show the screen name and wrap content in FlowShell where the shell applies (steps 1 to 5).
5. Navigation guards: a step route cannot be opened before the previous step is complete (redirect to the last allowed step).
Stop. Do not build screen UI yet.
```
**Review gate B:** click through every route, reset demo works, state survives refresh.

---

## Phase C: Screens (one chat per group; ask Cursor to screenshot-compare each screen against its Figma frame)

### C1: Screens 12, 1, 2, 3
```
Read .cursor/rules/project.mdc and cursor-full-flow.md.
Build Screen 12 (catalogue; frames 264:11323, 265:32866 delete confirm, 279:1226 kebab open, 279:1445 no results), Screen 1 (empty state, frame 265:11527, shown when the store has no designations), Screen 2 (frame 171:14827), Screen 3 (frame 207:871), in file UVuqMleArgUwsltkPjAtRX. For each, call get_design_context and get_screenshot on the frame, build the page from src/ds only, wire to the store. Behaviour: Screen 12 row links per status (Continue, View, Review TR, Re-run analysis, Approve, Reopen), pill tabs with counts, search and sort, delete confirm dialog; Screen 2 validates only on Next (3 to 60 chars, unique case-insensitive), Next never disabled; Screen 3 selects activities and Edit opens the Screen 4 dialog (placeholder until C2). After each screen, compare with the screenshot and list differences. Stop after each screen until I say continue.
```

### C2: Screen 4 (Edit activity dialog, merged with old Screen 5) and Screen 6
```
Read .cursor/rules/project.mdc and cursor-full-flow.md.
Build the Edit activity dialog with tabs T-codes, Authorizations, Org levels (frames listed under Screen 4 in cursor-full-flow.md) and Screen 6 Run sync (section 245:9798: running ring, completed, failed, and the three View details dialogs). Behaviour: remove and add T-codes, auth object status badges (Standard, Maintained, Changed, Manual, Inactive), Deactivate for pre-filled objects, Delete only for Manual with confirmation, org level open values warning banner on the Org levels tab only if present in the frame. Sync progress runs via fakeApi (Starting, Syncing, Completed or Failed with retry); Next unlocks when sync completes. Compare each frame with its screenshot. Stop after each screen until I say continue.
```

### C3: Screen 7 (both options)
```
Read .cursor/rules/project.mdc and cursor-full-flow.md.
Build Screen 7 (Option A frames 35:2509, 35:3896, 38:3489, 48:5306, 137:11997, 132:11460; Option B frames 152:1777, 148:12614, 152:3164, 155:2213, 155:3166, 155:4122). One page with tabs New roles and Existing roles, method choice (Option A or B) for all new roles, 50 new roles with status badges and pagination. After creation starts (Option A): progress rows per role with ProgressTrack (Creating, Profile and TR, Synced), summary bar ("32 of 40 created, 2 failed"), Failed only filter, Retry all failed, completed rows collapsed, method shown as one locked line, error rows show "View error log" and Retry. Footer explains why Create is disabled and links to the problem. Stop.
```

### C4: Screen 8 and its drawers (Option A)
```
Read .cursor/rules/project.mdc and cursor-full-flow.md.
Build Screen 8 (frames 54:3157 valid role, 54:3957 invalid role, 102:11192, then editors 90:9429 T-codes, 91:10337 Add T-codes paste, 95:10108 Edit T-code, 64:4936 Authorizations, 76:5795 and 77:6881 Edit auth object, 86:8134 Org levels, 87:8816 Edit org level). Left role list scrolls ("Showing 1-9 of 50"), name clash is fixed here, validation row with 5 checks, Create is locked while roles need attention or org levels KOKRS and WERKS are open, with the footer sentence and Link "Open org levels". Drawers follow the Drawer spec in the rules. Compare frames and stop after the page, then after each drawer.
```

### C5: Screen 9 (Option B)
```
Read .cursor/rules/project.mdc and cursor-full-flow.md.
Build Screen 9 (frames 158:19944, 158:20908, 162:8663, 163:19113, 163:4681, 163:6018). 4 steps with StepCard states, 50 role-ID rows, bulk paste or CSV import, Needs attention filter and search, role ID max 30 chars, chips Needed, ID entered, Validated, Gap found. Unlock order 1 to 4. Run sync enabled when all IDs are entered. A gap affects only that role. Next enabled only when all are Validated. Gap report with Send gap report and Run sync again. Stop.
```

### C6: Proposed screens 11 to 16
```
Read .cursor/rules/project.mdc and cursor-full-flow.md.
Build Screen 11 (280:33418, 281:1770), Screen 13 (294:12779, 294:13265), Screen 14 (310:2814), Screen 15 (319:2824, Drawer XL), Screen 16 (332:3918, 333:3474, 336:3816, 337:4123, 337:4591, 341:4560). Follow the notes: whitelisted conflicts list, read-only drawer, checkbox plus comment enabling "Continue and publish" when High risk exists, Reject needs a comment, result dialogs over the catalogue with the row updated to Published or Rejected. Do one screen per message and stop after each.
```
**Review gate C:** after each screen compare with the Figma screenshot and fix before continuing.

---

## Phase D: Flow logic and polish
```
Read .cursor/rules/project.mdc and cursor-full-flow.md.
Connect the whole flow end to end using the store and fakeApi:
- Wizard: Screen 2 -> 3 -> 6 -> 7 -> (8 if Option A, 9 if Option B) -> 11 -> 13 -> 14/15 -> 16 -> Screen 12 with updated status.
- Option A creation simulation: roles move Queued -> Creating -> Created, Tax role fails once with "SAP API: authorisation error", Retry succeeds ("created on retry", TR number DEVK900125). Method locks once creation starts. Next is enabled only when all roles are Created and synced.
- Option B: send requirement locks the method; unlock order 1 to 4.
- Save as draft available everywhere; the catalogue status updates.
- Browser back and refresh keep state.
- Keyboard: Escape closes drawers and dialogs, focus returns to the trigger, focus is trapped inside.
Then run a full pass: next build, tsc, eslint, and list any hardcoded colours or px outside tokens. Stop.
```

## Phase E: QA against Figma
For each screen, ask Cursor: "Screenshot route X and compare with Figma frame Y. List differences in spacing, type, colour, copy and states." Fix in batches. Check the Figma-known gaps: Link "Override for this object only" wraps, drawer footers hug content, status never colour alone.

## Tips
- If Cursor skips items in a multi-item prompt, ask it to list which items it did not do.
- Fresh chat per phase. Do not ask "continue the earlier prompt".
- Commit before each phase so you can roll back.
- The Figma sample names (A. Rao, M. Iyer) are made up; keep them marked as sample data.
