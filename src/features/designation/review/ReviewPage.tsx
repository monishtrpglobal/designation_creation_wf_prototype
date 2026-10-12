"use client";

import { rolesFile } from "@/mock";
import { AppFrame } from "@/ds/AppFrame";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { FlowShell } from "@/ds/FlowShell";
import { IconCircleCheck, IconClose, IconUserCircle } from "@/ds/icons";
import { Link } from "@/ds/Link";
import { Tabs } from "@/ds/Tabs";
import { TextField } from "@/ds/TextField";
import { flowSteps } from "@/features/designation/flowSteps";
import { RoleEditor } from "@/features/designation/review/RoleEditor";
import type { EditorTab } from "@/features/designation/review/roleEditorView";
import { editorOverride } from "@/features/designation/review/roleEditorView";
import { badgeLabel, badgeVariant, countLabel } from "@/features/designation/roles/rolesView";
import { guardRedirect, pathFor } from "@/state/access";
import { useFlowStore } from "@/state/flowStore";
import type { RoleRuntimeStatus } from "@/state/model";
import { defaultRoleDescription, openOrgRoleId } from "@/state/seed";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const labelL2 = {
  fontFamily: "var(--font-family-lato-regular)",
  lineHeight: "var(--font-line-height-label-l1)",
} as const;

const nameClashError = "Role already exists in SAP";
const sapNamePattern = /^Z_[A-Z0-9_]+$/;
const openOrgIds = ["KOKRS", "WERKS"] as const;

type ReviewFilter = "all" | "attention" | "ready";

type ReviewRow = {
  id: string;
  label: string;
  sapName: string;
  description: string;
  status: RoleRuntimeStatus;
};

function needsAttention(status: RoleRuntimeStatus) {
  return status === "Name clash" || status === "Too long" || status === "Error";
}

function CheckLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="flex items-center gap-s6">
      {ok ? (
        <IconCircleCheck size="s16" className="shrink-0 text-success-text" />
      ) : (
        <IconClose size="s16" className="shrink-0 text-error-border" />
      )}
      <span className={`text-l2 ${ok ? "text-body" : "text-error-text"}`} style={labelL2}>
        {label}
      </span>
    </span>
  );
}

export function ReviewPage({ designationId }: { designationId: string }) {
  const router = useRouter();
  const hydrated = useFlowStore((state) => state.hydrated);
  const designation = useFlowStore((state) => state.designations.find((item) => item.id === designationId));
  const setCurrentDesignation = useFlowStore((state) => state.setCurrentDesignation);
  const saveDraft = useFlowStore((state) => state.saveDraft);
  const setRoleSapName = useFlowStore((state) => state.setRoleSapName);
  const setRoleDescription = useFlowStore((state) => state.setRoleDescription);
  const updateRoleEditor = useFlowStore((state) => state.updateRoleEditor);
  const setOrgLevel = useFlowStore((state) => state.setOrgLevel);
  const resetRoleEdits = useFlowStore((state) => state.resetRoleEdits);
  const startRoleCreation = useFlowStore((state) => state.startRoleCreation);
  const redirect = hydrated ? guardRedirect(designation, "review") : null;

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [selectedId, setSelectedId] = useState(openOrgRoleId);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>("tcodes");
  const [range, setRange] = useState({ start: 1, end: 1 });
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated || !redirect) {
      return;
    }
    router.replace(redirect);
  }, [hydrated, redirect, router]);

  useEffect(() => {
    if (!hydrated || redirect) {
      return;
    }
    setCurrentDesignation(designationId);
  }, [hydrated, redirect, designationId, setCurrentDesignation]);

  const rows = useMemo<ReviewRow[]>(() => {
    if (!designation) {
      return [];
    }
    return rolesFile.newRoles.map((role) => ({
      id: role.id,
      label: role.businessLabel,
      sapName: designation.roleSapNames[role.id] ?? role.sapRoleName,
      description: designation.roleDescriptions[role.id] ?? defaultRoleDescription(role),
      status: designation.roleStatuses[role.id] ?? role.status,
    }));
  }, [designation]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === "attention" && !needsAttention(row.status)) {
        return false;
      }
      if (filter === "ready" && row.status !== "Ready") {
        return false;
      }
      if (!needle) {
        return true;
      }
      return row.label.toLowerCase().includes(needle) || row.sapName.toLowerCase().includes(needle);
    });
  }, [rows, filter, query]);

  useEffect(() => {
    if (filtered.length === 0) {
      return;
    }
    if (!filtered.some((row) => row.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    const root = listRef.current;
    if (!root) {
      return;
    }
    const measure = () => {
      const items = [...root.querySelectorAll<HTMLElement>("[data-review-row]")];
      if (items.length === 0) {
        setRange({ start: 0, end: 0 });
        return;
      }
      const box = root.getBoundingClientRect();
      let start = 0;
      let end = 0;
      items.forEach((item, index) => {
        const itemBox = item.getBoundingClientRect();
        const visible = itemBox.bottom > box.top && itemBox.top < box.bottom;
        if (!visible) {
          return;
        }
        if (start === 0) {
          start = index + 1;
        }
        end = index + 1;
      });
      setRange({ start, end });
    };
    measure();
    root.addEventListener("scroll", measure);
    window.addEventListener("resize", measure);
    return () => {
      root.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [filtered]);

  useEffect(() => {
    document.getElementById(`review-role-${selectedId}`)?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  if (!hydrated || redirect || !designation) {
    return (
      <AppFrame>
        <main className="p-s24">
          <p className="text-body-b4 text-body" style={{ fontFamily: "var(--font-family-body-b4)" }}>
            Loading
          </p>
        </main>
      </AppFrame>
    );
  }

  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  const selectedIndex = filtered.findIndex((row) => row.id === selected?.id);
  const attentionCount = rows.filter((row) => needsAttention(row.status)).length;
  const readyCount = rows.filter((row) => row.status === "Ready").length;
  const allReady = rows.length > 0 && readyCount === rows.length && attentionCount === 0;
  const openLevels = openOrgIds.filter((levelId) => designation.orgLevels[levelId]?.kind === "open");
  const sampleRole = rows.find((row) => row.id === openOrgRoleId);
  const sampleHasOpenLevels = selected?.id === openOrgRoleId && openLevels.length > 0;
  const started = designation.methodLocked && designation.method === "A";
  const allCreated = rows.length > 0 && rows.every((row) => row.status === "Created");
  const createDisabled = attentionCount > 0 || openLevels.length > 0 || started;
  const showLockHelper = (attentionCount > 0 || openLevels.length > 0) && !allCreated;
  const editsLocked = started || selected?.status === "Created";

  const namingOk = selected ? sapNamePattern.test(selected.sapName) : false;
  const duplicateOk = selected ? selected.status !== "Name clash" && selected.sapName.length > 0 : false;
  const lengthOk = selected ? selected.sapName.length > 0 && selected.sapName.length <= 30 : false;
  const mandatoryOk = selected ? selected.sapName.trim().length > 0 && selected.description.trim().length > 0 : false;
  const authOk = !sampleHasOpenLevels;

  function focusOrgLevels(roleId?: string) {
    if (roleId) {
      setQuery("");
      setFilter("all");
      setSelectedId(roleId);
    }
    setEditorOpen(true);
    setEditorTab("org");
    window.requestAnimationFrame(() => {
      document.getElementById("review-org-levels")?.querySelector("button")?.focus();
    });
  }

  function showNextAttention() {
    if (!selected) {
      return;
    }
    const start = rows.findIndex((row) => row.id === selected.id);
    const order = [...rows.slice(start + 1), ...rows.slice(0, start + 1)];
    const next = order.find((row) => needsAttention(row.status));
    if (!next) {
      return;
    }
    setQuery("");
    setFilter("all");
    setSelectedId(next.id);
  }

  function move(step: number) {
    const next = filtered[selectedIndex + step];
    if (next) {
      setSelectedId(next.id);
    }
  }

  async function createRoles() {
    const result = await startRoleCreation(designationId);
    if (result.ok) {
      router.push(pathFor("roles", designationId));
    }
  }

  const lockParts = [
    attentionCount > 0
      ? attentionCount === 1
        ? "1 role needs attention"
        : `${attentionCount} roles need attention`
      : null,
    openLevels.length > 0
      ? `${openLevels.length} org ${openLevels.length === 1 ? "level" : "levels"} (${openLevels.join(", ")}) ${openLevels.length === 1 ? "is" : "are"} open in ${sampleRole?.label ?? "Revenue Recognition"}`
      : null,
  ].filter((part): part is string => part !== null);

  const lockHelper = (
    <span className="flex flex-wrap items-center gap-s16" style={{ color: "var(--color-text-body)" }}>
      <span>Create is locked: {lockParts.join(" and ")}.</span>
      {openLevels.length > 0 ? (
        <Link
          href="#review-org-levels"
          onClick={(event) => {
            event.preventDefault();
            focusOrgLevels(openOrgRoleId);
          }}
        >
          Open org levels
        </Link>
      ) : null}
    </span>
  );

  return (
    <AppFrame>
      <FlowShell
        title="Create a New Designation"
        steps={flowSteps}
        activeIndex={3}
        contentSurface="white"
        pageSurface="white"
        onBack={() => router.push(pathFor("roles", designationId))}
        onStepPrev={() => router.push(pathFor("roles", designationId))}
        stepPrevVariant="primary"
        helperAlign="start"
        primaryLabel="Next"
        primaryDisabled={showLockHelper}
        helperText={
          showLockHelper ? lockHelper : createDisabled ? undefined : "Method locks once creation starts."
        }
        stepNextDisabled={!allCreated}
        onStepNext={() => router.push(pathFor("finalize", designationId))}
        footerPrimaryLabel={`Create ${rolesFile.newRoles.length} roles`}
        footerPrimaryDisabled={createDisabled}
        onFooterPrimaryClick={() => {
          void createRoles();
        }}
      >
        <div className="flex w-full flex-col gap-s16">
          <div className="flex w-full items-center justify-between gap-s16">
            <div className="flex min-w-0 items-center gap-s8">
              <span className="inline-flex shrink-0 text-body">
                <IconUserCircle size="s16" />
              </span>
              <span className="shrink-0 text-l2 text-body" style={labelL2}>
                Designation:
              </span>
              <span
                className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-l2 text-body"
                style={{
                  ...labelL2,
                  maxWidth: "calc(var(--space-s80) * 7 + var(--space-s40))",
                  fontFamily: "var(--font-family-label-l1)",
                  fontWeight: "var(--font-weight-label-l1)",
                }}
              >
                {designation.name}
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                saveDraft(designationId);
                router.push("/designations");
              }}
            >
              Save as draft
            </Button>
          </div>
          <Link
            href={pathFor("roles", designationId)}
            onClick={(event) => {
              event.preventDefault();
              router.push(pathFor("roles", designationId));
            }}
          >
            Back to Recommended Roles
          </Link>

          <div className="grid w-full items-start gap-s24" style={{ gridTemplateColumns: "calc(var(--space-s80) * 5) minmax(0, 1fr)" }}>
            <section className="flex min-w-0 flex-col gap-s12 rounded-s12 border border-solid border-neutral-border bg-surface p-s16">
              <h2 className="m-0 text-l1 text-strong" style={{ fontFamily: "var(--font-family-label-l1)" }}>
                New roles · {rolesFile.newRoles.length}
              </h2>
              {allReady ? (
                <p className="m-0 text-l2 text-body" style={labelL2}>
                  All {rolesFile.newRoles.length} roles ready
                </p>
              ) : null}
              <TextField
                type="search"
                size="sm"
                label="Search roles"
                showInfo
                placeholder="Search roles or suggested names"
                value={query}
                onChange={setQuery}
              />
              <Tabs
                variant="pill"
                showPanels={false}
                value={filter}
                onChange={(value) => setFilter((value as ReviewFilter) ?? "all")}
                items={[
                  {
                    value: "all",
                    label: "All",
                    count: (
                      <Badge size="sm" variant="light">
                        {rows.length}
                      </Badge>
                    ),
                  },
                  {
                    value: "attention",
                    label: "Needs attention",
                    count: (
                      <Badge size="sm" variant="warning">
                        {attentionCount}
                      </Badge>
                    ),
                  },
                  {
                    value: "ready",
                    label: "Ready",
                    count: (
                      <Badge size="sm" variant="completed">
                        {readyCount}
                      </Badge>
                    ),
                  },
                ]}
              />
              <p className="m-0 text-l2 text-body" style={labelL2}>
                {filtered.length === 0
                  ? "Showing 0 of 0"
                  : `Showing ${Math.min(range.start, filtered.length)}–${Math.min(range.end, filtered.length)} of ${filtered.length}`}
              </p>
              <div
                ref={listRef}
                className="flex flex-col overflow-y-auto"
                style={{ height: 348 }}
                role="listbox"
                aria-label="New roles"
              >
                {filtered.map((row) => {
                  const current = row.id === selected?.id;
                  return (
                    <button
                      key={row.id}
                      id={`review-role-${row.id}`}
                      type="button"
                      role="option"
                      data-review-row
                      aria-selected={current}
                      className={`flex w-full cursor-pointer items-center gap-s8 py-s8 text-left ${current ? "rounded-s8 border-0 bg-info-bg" : "border-x-0 border-t-0 border-b border-solid border-neutral-border bg-transparent px-s12"}`}
                      style={
                        current
                          ? {
                              borderLeftWidth: 3,
                              borderLeftStyle: "solid",
                              borderLeftColor: "var(--color-brand-primary)",
                              paddingLeft: 9,
                              paddingRight: "var(--space-s12)",
                            }
                          : undefined
                      }
                      onClick={() => setSelectedId(row.id)}
                    >
                      <span
                        className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-l2 text-body"
                        style={labelL2}
                      >
                        {row.label}
                      </span>
                      <Badge size="md" variant={badgeVariant(row.status)}>
                        {badgeLabel(row.status)}
                      </Badge>
                    </button>
                  );
                })}
              </div>
              {attentionCount > 0 ? (
                <Button variant="secondary" size="sm" fullWidth onClick={showNextAttention}>
                  Next role needing attention
                </Button>
              ) : null}
              <div className="flex flex-col gap-s8 border-x-0 border-b-0 border-t border-solid border-neutral-border pt-s12">
                <p className="m-0 text-l2 text-body" style={labelL2}>
                  Method for all new roles: Option A · Build
                </p>
                <p className="m-0 flex flex-wrap items-center gap-s8 text-l2 text-body" style={labelL2}>
                  <Link
                    href={pathFor("roles", designationId)}
                    disabled={started}
                    onClick={(event) => {
                      event.preventDefault();
                      if (started) {
                        return;
                      }
                      resetRoleEdits(designationId);
                      router.push(pathFor("roles", designationId));
                    }}
                  >
                    Change method
                  </Link>
                  <span>(resets entries below)</span>
                </p>
              </div>
            </section>

            {selected ? (
              <section className="flex min-w-0 flex-col gap-s24 rounded-s12 border border-solid border-neutral-border bg-surface p-s20">
                <div className="flex flex-wrap items-center gap-s12">
                  <h2
                    className="m-0 text-heading-h2 text-strong"
                    style={{ fontFamily: "var(--font-family-heading-h2)" }}
                  >
                    {selected.label}
                  </h2>
                  <Badge variant="light">New role</Badge>
                </div>
                <p className="m-0 text-l2 text-body" style={labelL2}>
                  Built from the platform via SAP Integration Flow API
                </p>
                <TextField
                  id="review-role-name"
                  label="Role name"
                  required
                  showInfo
                  tooltip="SAP role name. Maximum 30 characters."
                  value={selected.sapName}
                  disabled={editsLocked}
                  showCounter
                  maxLength={30}
                  error={selected.status === "Name clash" ? nameClashError : undefined}
                  onChange={(value) => setRoleSapName(designationId, selected.id, value)}
                />
                <TextField
                  id="review-role-description"
                  label="Description"
                  required
                  showInfo
                  tooltip="Shown on the role in SAP."
                  value={selected.description}
                  disabled={editsLocked}
                  onChange={(value) => setRoleDescription(designationId, selected.id, value)}
                />
                <RoleEditor
                  roleId={selected.id}
                  roleLabel={selected.label}
                  sapName={selected.sapName}
                  expanded={editorOpen}
                  tab={editorTab}
                  onExpandedChange={setEditorOpen}
                  onTabChange={setEditorTab}
                  orgLevels={designation.orgLevels}
                  editor={editorOverride(designation.roleEditors, selected.id)}
                  locked={editsLocked}
                  showOpenWarning={sampleHasOpenLevels}
                  onOrgSave={(levelId, value) => setOrgLevel(designationId, levelId, value)}
                  onEditor={(recipe) => updateRoleEditor(designationId, selected.id, recipe)}
                />
                <div className="flex flex-col gap-s8">
                  <p className="m-0 text-l1 text-strong" style={{ fontFamily: "var(--font-family-label-l1)" }}>
                    Validation
                  </p>
                  <div className="flex flex-wrap gap-x-s24 gap-y-s8">
                    <CheckLine ok={namingOk} label="Naming convention" />
                    <CheckLine ok={duplicateOk} label="No duplicate roles" />
                    <CheckLine ok={lengthOk} label="Max 30 characters" />
                    <CheckLine ok={mandatoryOk} label="Mandatory fields" />
                    <CheckLine
                      ok={authOk}
                      label={
                        sampleHasOpenLevels
                          ? `Auth values complete: ${countLabel(openLevels.length, "org level")} open`
                          : "Auth values complete"
                      }
                    />
                  </div>
                  {sampleHasOpenLevels ? (
                    <Link
                      href="#review-org-levels"
                      onClick={(event) => {
                        event.preventDefault();
                        focusOrgLevels();
                      }}
                    >
                      Open org levels
                    </Link>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-s12">
                  <Button variant="secondary" size="md" disabled={selectedIndex <= 0} onClick={() => move(-1)}>
                    ← Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    disabled={selectedIndex < 0 || selectedIndex >= filtered.length - 1}
                    onClick={() => move(1)}
                  >
                    Next role →
                  </Button>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </FlowShell>
    </AppFrame>
  );
}
