# Implementation plan: Designation Flow (Figma screens 1-16) to Next.js

This file is a handoff for an AI agent. Read it fully, then work phase by phase. Do not skip a review gate.

This repository has no `CLAUDE.md`. Project rules live in `.cursor/rules/project.mdc` (read that first). Routes, Figma frame ids, and the phase prompts for this app live in `docs/cursor-full-flow.md`. Next.js version notes live in `AGENTS.md`.

## 0. Goal and stack

Implement the Designation Flow hi-fi screens (1-16) as a web app.

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS + Mantine 7
- Mantine packages: `@mantine/core`, `@mantine/hooks`, `@mantine/notifications` (all v7, not v8)
- Tests: Vitest + Testing Library; screenshots and a11y: Playwright + `@axe-core/playwright`
- Build screen by screen. After each screen: verify, report, STOP for human approval, then continue.

## 1. Sources (paths relative to this repo root)

| What | Where |
|---|---|
| Project rules and decisions | `.cursor/rules/project.mdc` (read first). There is no `CLAUDE.md`. |
| Routes, frame ids, phase prompts | `docs/cursor-full-flow.md` |
| Next.js version notes | `AGENTS.md` |
| Component names and properties | `specs/design-system-components-final.md` |
| Design system inventory and issues | `specs/design-system-inventory.md`, `specs/design-system-issues.md`, `specs/ds-follow-ups.md` |
| Per-screen specs | `specs/screen-01.md` ... `specs/screen-16.md` |
| Screen 7 scale and Screen 8 editor decisions | `specs/screen-07-scale-proposal.md`, `specs/screen-08-editor-proposal.md` |
| Wireframe crops | `source/screens/` |
| Built Figma frames (visual truth) | Figma file key `UVuqMleArgUwsltkPjAtRX` (Designation-Flow-Hi-Fi) |
| Design system | Figma file key `l3QZ1x8fDQEkEimzgwPInE` (iRM Design System). READ ONLY. |

Rules for using Figma: read only (`get_design_context`, `get_screenshot`, `get_variable_defs`, `get_metadata`). Never write to either Figma file. Never invent colors, fonts, sizes or component names. If a component or token is missing, stop and report it.

## 2. Non-negotiable rules

These constraints are written here. They are not copied from a `CLAUDE.md`. Follow them together with `.cursor/rules/project.mdc`. That file wins on stack, layering, tokens, the component map, and the badge status map. The items below add screen-level constraints.

1. Colors only from semantic tokens (`color/*`). Spacing, radius and stroke from `space/*`, `radius/*`, `border/*`. No raw hex, no ad hoc px outside the token file.
2. Status is never shown by color alone. Always a text label.
3. Status chip map (Badge):
   - Ready, Validated, Created, Standard-maintained: Completed
   - Creating, Linking, Syncing: In progress (label text "In Progress" on the Step badge; screen chips use their own words)
   - Queued, Needed: Pending
   - Name clash, Awaiting SAP, Too long: Warning
   - Error, Gap found: Error
   - Screen 8 auth badges: Standard=Light, Maintained=Completed, Changed=Dot, Manual=Outline, Inactive=Pending, Open=Warning, Wildcard=Warning, Higher risk=Warning, SAP default=Light
4. Accessibility: text contrast at least 4.5:1; indicators at least 3:1; `warning/solid` and `in-progress/solid` are fills only, never text; focus uses `color/focus/link` as an inside stroke; never remove focus states.
5. No dark mode.
6. Shell (screens 2-11): 1440 wide, min height 900, hug height. Header, 5-step Stepper (Designation Name, Business Activities, Run Sync, Role Recommendation, Role Finalization), "Save as draft", "Next", helper text, content slot. Content area min height 656.
7. Sample data: design for 50+ always (50 new roles, 20 existing roles, a second page). SAP role names max 30 characters (example `Z_FI_AP_INVOICE_1000`), except exactly one deliberate "Too long" row. One state per structurally different case, not per data size. Do not build 3-item or 15-item variants.
8. Flow decisions: once creation starts, the method is locked and Screen 7 links to Screen 10. Open org levels block Create (annotate "to confirm"). SU24 proposed objects are applied by default, tagged "New", with an Alert; Create is not blocked.
9. Screen 8 editor: about 860 px wide, fixed column widths. Authorizations tab is ONE flat Table (Object, Class, Fields summary, Status, Source, Actions) with class filter pills and sortable headers. Field values are edited in the Drawer. Every table row has a visible Link "Edit"; the kebab is for secondary actions only; "Actions" header is 96 px. Pre-filled objects can only be deactivated; Delete only for Manual objects, with confirmation. Accordion badge: "Pre-filled" until edited, then "Edited . N changes". Fifth validation check: "Auth values complete". Lists of values: at most 4 chips plus "+N more" with a Tooltip.
10. Drawer frames: scrim uses `color/pure/black` at the `opacity/overlay/drawer` token; Drawer Right LG is 620 x 900; header band, body, footer band; header plus footer at most 40% of viewport height.
11. Known DS gaps (do not "fix"): Modal, Tabs and Table descriptions name primitives (check bindings before screens 3-6); Badge tiles read "Label"; no lock glyph in Icon set (use eye icon); no scrim token.

## 3. Repository layout (create under a new folder `designation-app/`, next to this plan, not inside `specs/`, `source/` or `scratch/`)

```
designation-app/
  src/app/                      routes (App Router)
  src/components/ds/            one wrapper per Figma DS component
  src/components/shell/         Designation Flow Shell
  src/features/<screen-NN>/     screen-specific components
  src/data/                     typed mock fixtures
  src/theme/tokens.ts           generated from Figma variables (single source of truth)
  src/theme/mantine-theme.ts
  tailwind.config.ts            reads the same tokens
  tests/                        unit + e2e
  PROGRESS.md                   checklist, updated after every step
```

## 4. Phase 0: Foundation (build once, then review)

Do these in order. Stop after 0.8 for human review.

- 0.1 Scaffold the app with the stack above. Strict TS. Tailwind `preflight: false` to avoid clashing with Mantine's reset.
- 0.2 Pull tokens from Figma (`get_variable_defs`) for color, space, radius, border, opacity, and text styles. Write `tokens.ts`. List any token you could not find in `PROGRESS.md`; do not guess.
- 0.3 Mantine theme from tokens (colors, radius, spacing, font sizes, default component props). Tailwind theme extends from the same file, via CSS variables.
- 0.4 DS wrappers in `components/ds/`. Prop names must match the Figma properties in `specs/design-system-components-final.md`. Build in this order:
  1. Button (Variant: Primary/Secondary/Warn; Size XS-LG; States incl. Loading, Disabled; Icon left/right)
  2. Badge (all variants; status map from section 2)
  3. Link, Alert (Info/Success/Warning/Error; title, dismissible, action)
  4. Text Field (Default/Search; error, read-only; show clear), Text Area, Select, Multi Select, Tags Field
  5. Checkbox (single, group, indeterminate), Radio card (selected, disabled, optional unavailable tag)
  6. Card (Flat/Hoverable/Border), Accordion (badge, panel content), Tabs (Pill/Underline), Segmented Control, Menu
  7. Progress (Line, Ring), Progress track (Creating, Profile and TR, Synced, Error), Step and Stepper
  8. Table (header cell with sort states, row hover/selected, empty/loading/error), Modal, Drawer, Tooltip
- 0.5 Designation Flow Shell: props `activeStep` (1-5), `helperText`, `showHelperText`, children. Header, Stepper, Save as draft, Next as exposed slots/props.
- 0.6 Mock data in `src/data/`: typed fixtures with 50 new roles, 20 existing roles, page 2, statuses per Screen 7 "Creation started" (Error 2, Creating 5, Syncing 5, Created 38), BUKRS 7 values (1000, 1010, 2000, 3000, 4000, 5000, 6000), open org levels KOKRS and WERKS, one "Too long" row.
- 0.7 State: a small flow store (React context or Zustand; choose one and record the choice) holding method (A/B/unset), creationStarted, per-role status, validation results.
- 0.8 Component gallery route `/dev/components` showing every wrapper in every state. Compare with Figma component frames. STOP for review.

## 5. Phase 1: Screen loop (repeat for each screen in section 6)

For each screen N, run these steps in order. Update `PROGRESS.md` after each.

1. READ: `specs/screen-NN.md`, the crop in `source/screens/`, the Figma frame (screenshot + design context). List components needed. If a wrapper or token is missing, STOP and report.
2. BUILD: create the route and `features/screen-NN/`. Use only DS wrappers and tokens. One route or Storybook-style state switch per structural state in the spec. Implement the "Button behaviour" table from the spec (what each control does, enabled/disabled rules, navigation).
3. VERIFY static: `tsc --noEmit`, ESLint, grep for raw hex (`#[0-9a-fA-F]{3,8}`), `rgb(`, and px values outside `tokens.ts`. Zero findings allowed.
4. VERIFY behaviour: Vitest/Testing Library tests for gating logic (Next disabled until..., locked method, validation checks, Create blocked by open org levels, etc.).
5. VERIFY visual: Playwright screenshot of every state at 1440 x 900; compare with Figma `get_screenshot` for the same frame; record differences (spacing, color token, copy, state missing).
6. VERIFY accessibility: axe has zero serious/critical violations; keyboard-only walkthrough; focus ring visible; status never color-only; contrast met.
7. REPORT (use the template in section 8) and STOP. Wait for the human to approve or request changes. Fix and re-verify on request. Only then start the next screen.

## 6. Screen order

| # | Screen | Notes |
|---|---|---|
| 1 | Setup start | Setup page (no Shell). First form fields. |
| 2 | Designation name | First screen using the Shell. Text Field states. |
| 3 | Business activities | Table, Tabs, Modal. Check DS binding gap first. |
| 4 | Run Sync | Progress track with its stages. |
| 5 | Sync results | Table with row states and status badges. |
| 6 | Setup review | Accordion, Alert, footer gating. |
| 7 | Recommended Roles hub | Option A (build) / Option B (link) Radio cards; 50 + 20 roles; "Creation started" locked state; link to Screen 10. |
| 8 | Option A editor | Largest. Split into 8a Org levels, 8b T-codes, 8c Authorizations table, 8d Drawer (Set values), 8e Validation + Create footer. Stop after each sub-step. |
| 9 | Option B link roles | Linking and validation states. |
| 10 | Creation progress | Per-role Progress track, Error rows, reached from Screen 7. |
| 11 | Role Finalization + SoD | PROPOSED. Conflicts and "no conflicts" states, remediate/whitelist, justification, submit toast. |
| 12-16 | See `specs/screen-12.md` to `screen-16.md` | PROPOSED. Same loop. Where the spec has no wireframe, state assumptions in the report. |

### Validation against the current Figma file (8 Oct 2026)

Checked the pages that already exist in this repo against file `UVuqMleArgUwsltkPjAtRX`. Most frame ids in `docs/cursor-full-flow.md` are gone. The Setup page now has Screen 1 (empty catalogue), Screen 2 (designation name), Screen 3 (activities), Screen 4 (edit activity), and Screen 6 (run sync). Screen 12 survives only as `265:32866` (populated catalogue behind the delete-draft dialog).

Updated 8 Oct 2026 after the fix pass: the three built views were re-measured at 1728 wide and DPR 1.

| Built route | Figma frame | Result |
|---|---|---|
| `/designations` empty | `374:17028` | Matches. Panel 1310 x 306, dashed `border/input` border, 24px icon, 340px body, heading gap 10. |
| `/designations` with data | `265:32866` | Matches, with the exceptions below. 54 designations (All 54, Draft 6, In progress 4, Completed 8, Syncing 3, TR 2, Quality 2, License running 2, Failed 1, Final approval 4, Published 20, Rejected 2). Summary 4 / ₹ 38.5 L / 5 / 1. Rows 64 px, row and header borders `neutral/border`, columns at frame widths, tabs 36 px tall, dates "28 Sep 2026", kebab on Draft and Awaiting final approval rows, delete-draft dialog 480 x 186 on a flat black 50% scrim. |
| `/designation/new` | `369:11368` | Matches. Demo actions moved out of the sidebar to a Prototype controls bar below the app frame. |

Open items on the catalogue:

- Pagination shows all 6 pages (54 rows at 10 per page). The frame shows pages 1 to 5 and no sixth. Kept honest; confirm with design.
- The Awaiting final approval kebab is marked "secondary actions (to confirm)" on the frame. It holds one placeholder item, "View designation".
- "In progress" and "Completed" are now lifecycle statuses (wizard under way, wizard finished before TR). The frame does not define "Completed"; this is an assumption.
- Rows 11 to 54 are invented sample data (marked `sample`). Inventory Controller is now `Awaiting final approval` as on the frame, not `Awaiting TR approval`; Screens 13 and 14 will need a different designation (Procurement Lead is the Awaiting TR row).
- DS changes made for this pass: `Dialog` got `variant="confirm"` (the frame uses a plain card, not banded); `TextField` now passes `data-irm-type` and `data-irm-size` to the wrapper (they were on the input, so the search layout rules never applied); `Tabs` pill padding and count-badge margin; `Table` row height 64 and `neutral/border`; `Pagination` no longer centres the page-size control.

`/designation/[id]/activities`, `sync`, `roles`, `roles/review`, `roles/link`, `finalize`, `tr`, `license`, and `approve` render the placeholder "This screen is not built yet." Screens 3, 4, and 6 in Figma are not built.

After screen 10 and again after screen 16, run an end-to-end pass of the whole flow (Back, Next, Save as draft, locked method, deep links) and report.

## 7. Definition of done (per screen)

- Compiles with no TS or ESLint errors; tests pass.
- Zero raw colors or sizes outside the token file.
- Every state in the spec exists and matches Figma, with remaining differences listed.
- axe clean; keyboard and focus verified.
- Mock data follows section 2 item 7.
- Human approved.

## 8. Report template (post after each screen, then stop)

```
Screen N: <name>  -> route <path>
States built: <list>
Components used: <wrappers>
Created new (not in DS): <list or none>
Hardcoded values: <list or none>
Deviations from Figma: <list or none>
Assumptions / open questions: <list>
Checks: tsc [pass/fail] | lint | tests (n/n) | visual | axe
Screenshots: <paths>
```

## 9. Agent roles (if the runner supports sub-agents)

- Orchestrator: owns `PROGRESS.md`, runs the loop, never skips a gate.
- Spec reader: step 1 only, read only.
- Builder: steps 2 and 7 fixes; only role allowed to edit code.
- Checker: steps 3-4.
- Visual and a11y reviewer: steps 5-6, read only, returns a difference list.

## 10. Items for the human to decide before Phase 0

1. There is no `CLAUDE.md`, so the old gates from that file ("do not generate code" and "do not build Proposed screens 11-16 until I say so") are not in force. Code generation is allowed under `.cursor/rules/project.mdc`. Whether to build screens 11-16 is still item 4.
2. Confirm app location (default `designation-app/` beside this file).
3. State choice: React context or Zustand.
4. Screens 11-16 are Proposed with no approved wireframes: build from specs only, or wait for design sign-off.
