"use client";

import { rolesFile } from "@/mock";
import { Alert } from "@/ds/Alert";
import { AppFrame } from "@/ds/AppFrame";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Dialog } from "@/ds/Dialog";
import { FlowShell } from "@/ds/FlowShell";
import { IconClose, IconUserCircle } from "@/ds/icons";
import { Link } from "@/ds/Link";
import { Pagination } from "@/ds/Pagination";
import { StepCard, type StepCardState } from "@/ds/StepCard";
import { Table, type TableColumn } from "@/ds/Table";
import { Tabs } from "@/ds/Tabs";
import { TextField } from "@/ds/TextField";
import { flowSteps } from "@/features/designation/flowSteps";
import { badgeLabel, badgeVariant, countLabel, optionBPhase } from "@/features/designation/roles/rolesView";
import { guardRedirect, pathFor } from "@/state/access";
import { useFlowStore } from "@/state/flowStore";
import type { RoleRuntimeStatus } from "@/state/model";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { PasteRoleIdsDrawer } from "./PasteRoleIdsDrawer";
import {
  gapSentence,
  linkPageSize,
  needsAttention,
  phaseBadge,
  sampleRoleIdPaste,
  sapRoleIdMax,
  type PasteRow,
} from "./linkView";

const labelL2 = {
  fontFamily: "var(--font-family-lato-regular)",
  lineHeight: "var(--font-line-height-label-l1)",
} as const;

type LinkFilter = "all" | "attention";

type LinkRow = {
  id: string;
  label: string;
  sapRoleId: string;
  status: RoleRuntimeStatus;
};

function stepAnchor(step: number) {
  return `link-step-${step}`;
}

export function LinkPage({ designationId }: { designationId: string }) {
  const router = useRouter();
  const hydrated = useFlowStore((state) => state.hydrated);
  const designation = useFlowStore((state) => state.designations.find((item) => item.id === designationId));
  const setCurrentDesignation = useFlowStore((state) => state.setCurrentDesignation);
  const saveDraft = useFlowStore((state) => state.saveDraft);
  const sendRequirement = useFlowStore((state) => state.sendRequirement);
  const setEnteredRoleId = useFlowStore((state) => state.setEnteredRoleId);
  const receiveBuiltRoles = useFlowStore((state) => state.receiveBuiltRoles);
  const runLinkSync = useFlowStore((state) => state.runLinkSync);
  const sendGapReport = useFlowStore((state) => state.sendGapReport);
  const completeLinkedRoles = useFlowStore((state) => state.completeLinkedRoles);
  const redirect = hydrated ? guardRedirect(designation, "link") : null;

  const [filter, setFilter] = useState<LinkFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [packageOpen, setPackageOpen] = useState(false);
  const [resent, setResent] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState(sampleRoleIdPaste);
  const [autoCheck, setAutoCheck] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hydrated || !redirect) {
      return;
    }
    router.replace(redirect);
  }, [hydrated, redirect, router]);

  useEffect(() => {
    if (!hydrated || redirect || !designation) {
      return;
    }
    setCurrentDesignation(designationId);
  }, [hydrated, redirect, designation, designationId, setCurrentDesignation]);

  const statuses = designation?.roleStatuses;
  const enteredIds = designation?.optionBRoleIds;
  const phase = optionBPhase(designation?.method ?? null, designation?.methodLocked === true, Object.values(statuses ?? {}));

  const rows = useMemo<LinkRow[]>(() => {
    if (!statuses) {
      return [];
    }
    return rolesFile.newRoles.map((role) => ({
      id: role.id,
      label: role.businessLabel,
      sapRoleId: enteredIds?.[role.id] ?? "",
      status: statuses[role.id] ?? "Needed",
    }));
  }, [statuses, enteredIds]);

  const total = rolesFile.newRoles.length;
  const gapCount = rows.filter((row) => row.status === "Gap found").length;
  const attentionCount = rows.filter((row) => needsAttention(row.status)).length;
  const enteredCount = rows.filter((row) => {
    const id = row.sapRoleId.trim();
    return id.length > 0 && id.length <= sapRoleIdMax;
  }).length;
  const idsReady = rows.length > 0 && enteredCount === rows.length;
  const tableOpen = phase === "linking" || phase === "gaps" || phase === "validated";

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === "attention" && !needsAttention(row.status)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return row.label.toLowerCase().includes(needle) || row.sapRoleId.toLowerCase().includes(needle);
    });
  }, [rows, filter, query]);

  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * linkPageSize + 1;
  const rangeEnd = Math.min(page * linkPageSize, filtered.length);
  const visible = filtered.slice((page - 1) * linkPageSize, page * linkPageSize);

  if (!hydrated || redirect || !designation || !phase) {
    return (
      <AppFrame>
        <main className="p-s24">
          <p className="text-body-b2 text-body">Loading</p>
        </main>
      </AppFrame>
    );
  }

  const badge = phaseBadge(phase);
  const sent = phase !== "before-send";
  const built = phase === "linking" || phase === "gaps" || phase === "validated";
  const gapRole = rows.find((row) => row.status === "Gap found");

  function showStep(step: number) {
    document.getElementById(stepAnchor(step))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showAttention() {
    setFilter("attention");
    setPage(1);
    showStep(3);
  }

  function openPaste() {
    setPasteText((current) => (current.trim().length > 0 ? current : sampleRoleIdPaste));
    setPasteOpen(true);
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    void file.text().then((text) => {
      setPasteText(text);
      setAutoCheck(true);
      setPasteOpen(true);
    });
  }

  function applyPaste(matched: PasteRow[]) {
    for (const row of matched) {
      if (row.roleId) {
        setEnteredRoleId(designationId, row.roleId, row.sapRoleId);
      }
    }
    setPasteOpen(false);
  }

  const columns: TableColumn<LinkRow>[] = [
    {
      key: "label",
      label: "Role",
      width: "62%",
      render: (row) => (
        <span className="block whitespace-normal text-strong" style={{ fontFamily: "var(--font-family-label-l1)" }}>
          {row.label}
        </span>
      ),
    },
    {
      key: "sapRoleId",
      label: "SAP role ID",
      width: "27%",
      render: (row) => (
        <TextField
          size="sm"
          ariaLabel={`SAP role ID for ${row.label}`}
          value={row.sapRoleId}
          clearable={false}
          readOnly={row.status === "Validated"}
          disabled={row.status === "Validated"}
          error={row.status === "Too long" ? `SAP role ID is ${row.sapRoleId.length} characters. Maximum is ${sapRoleIdMax}.` : undefined}
          placeholder="SAP role ID"
          onChange={(value) => setEnteredRoleId(designationId, row.id, value)}
        />
      ),
    },
    {
      key: "status",
      label: "Status",
      width: "11%",
      render: (row) => (
        <Badge size="md" variant={badgeVariant(row.status)}>
          {badgeLabel(row.status)}
        </Badge>
      ),
    },
  ];

  const step1: StepCardState = sent ? "done" : "required";
  const step2: StepCardState = built ? "done" : sent ? "waiting" : "locked";
  const step3: StepCardState = phase === "validated" ? "done" : phase === "gaps" ? "error" : built ? "required" : "locked";
  const step4: StepCardState = phase === "validated" ? "done" : phase === "gaps" ? "error" : idsReady ? "required" : "locked";

  const helper =
    phase === "validated" ? (
      `All ${total} roles validated. Validated roles are locked.`
    ) : phase === "before-send" ? (
      <>
        Next is locked: send the requirement to the security team first.{" "}
        <Link
          href={`#${stepAnchor(1)}`}
          onClick={(event) => {
            event.preventDefault();
            showStep(1);
          }}
        >
          Go to step 1
        </Link>
      </>
    ) : phase === "awaiting" ? (
      <>
        Next is locked: waiting for the security team to build the roles in SAP.{" "}
        <Link
          href={`#${stepAnchor(2)}`}
          onClick={(event) => {
            event.preventDefault();
            showStep(2);
          }}
        >
          Go to step 2
        </Link>
      </>
    ) : phase === "linking" ? (
      <>
        {`Next is locked: ${countLabel(total - enteredCount, "role")} still ${total - enteredCount === 1 ? "needs" : "need"} a SAP role ID. `}
        <Link
          href={`#${stepAnchor(3)}`}
          onClick={(event) => {
            event.preventDefault();
            showAttention();
          }}
        >
          Show roles that need an ID
        </Link>
      </>
    ) : (
      <>
        {`Next is locked: ${countLabel(gapCount, "role")} ${gapCount === 1 ? "has" : "have"} gaps. `}
        <Link
          href={`#${stepAnchor(3)}`}
          onClick={(event) => {
            event.preventDefault();
            showAttention();
          }}
        >
          Show gaps
        </Link>
      </>
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
        stepPrevVariant="primary"
        helperAlign="start"
        showFooterPrimary={false}
        primaryLabel="Next"
        primaryDisabled={phase !== "validated"}
        onPrimaryClick={() => {
          if (completeLinkedRoles(designationId)) {
            router.push(pathFor("finalize", designationId));
          }
        }}
        helperText={helper}
      >
        <div className="flex w-full flex-col gap-s16">
          <div className="flex w-full items-start justify-between gap-s16">
            <div className="flex min-w-0 flex-col gap-s4">
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
              <Link href={pathFor("roles", designationId)}>Back to Recommended Roles</Link>
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

          <div className="flex flex-wrap items-center gap-s12">
            <h2 className="m-0 text-heading-h2 text-strong" style={{ fontFamily: "var(--font-family-heading-h2)" }}>
              Link roles built in SAP
            </h2>
            <Badge size="md" variant="light">
              {`Applies to all ${total} new roles`}
            </Badge>
            <Badge size="md" variant={badge.variant}>
              {badge.label}
            </Badge>
          </div>

          <div className="flex flex-col gap-s12">
            <div id={stepAnchor(1)}>
              <StepCard
                step={1}
                title={sent ? "Requirement package sent" : "Share requirement"}
                state={step1}
                stateLabel={sent ? "Done" : "Required"}
                actions={
                  sent ? (
                    <>
                      <Link
                        href="#view-package"
                        onClick={(event) => {
                          event.preventDefault();
                          setPackageOpen(true);
                        }}
                      >
                        View package
                      </Link>
                      <Link
                        href="#resend-package"
                        onClick={(event) => {
                          event.preventDefault();
                          setResent(true);
                        }}
                      >
                        Resend
                      </Link>
                    </>
                  ) : null
                }
              >
                {sent ? (
                  resent ? (
                    <Alert type="success" title="Package sent again">
                      The same package was sent to the security team. No new package was created.
                    </Alert>
                  ) : null
                ) : (
                  <div className="flex flex-col items-start gap-s12">
                    <p className="m-0 text-l2 text-body" style={labelL2}>
                      {`One package: ${total} roles, T-codes and auth values.`}
                    </p>
                    <Button variant="primary" size="md" onClick={() => sendRequirement(designationId)}>
                      Send to security team
                    </Button>
                  </div>
                )}
              </StepCard>
            </div>

            <div id={stepAnchor(2)}>
              <StepCard
                step={2}
                title="Security team builds roles in SAP DEV (PFCG)"
                state={step2}
                stateLabel={built ? "Done" : sent ? "Waiting" : "Locked"}
              >
                {built ? null : (
                  <div className="flex flex-col items-start gap-s8">
                    <p className="m-0 text-l2 text-body" style={labelL2}>
                      {sent
                        ? "Outside the platform. You are notified when it is done."
                        : "Unlocks after the package is sent."}
                    </p>
                    {sent ? (
                      <Link
                        href="#roles-built"
                        onClick={(event) => {
                          event.preventDefault();
                          receiveBuiltRoles(designationId);
                        }}
                      >
                        Security team is done (sample)
                      </Link>
                    ) : null}
                  </div>
                )}
              </StepCard>
            </div>

            <div id={stepAnchor(3)}>
              <StepCard
                step={3}
                title="Link roles in platform"
                state={step3}
                stateLabel={
                  phase === "validated"
                    ? "Done"
                    : phase === "gaps"
                      ? countLabel(gapCount, "gap")
                      : built
                        ? `${enteredCount} of ${total} entered`
                        : "Locked"
                }
              >
                {tableOpen ? (
                  <div className="flex flex-col gap-s12">
                    <div className="flex flex-wrap items-center justify-between gap-s12">
                      <Tabs
                        variant="pill"
                        showPanels={false}
                        value={filter}
                        onChange={(value) => {
                          setFilter(value === "attention" ? "attention" : "all");
                          setPage(1);
                        }}
                        items={[
                          { value: "all", label: "All", count: <Badge size="sm" variant="light">{total}</Badge> },
                          {
                            value: "attention",
                            label: "Needs attention",
                            count: <Badge size="sm" variant={attentionCount > 0 ? "warning" : "light"}>{attentionCount}</Badge>,
                          },
                        ]}
                      />
                      <div className="flex flex-wrap items-center gap-s8">
                        <Button variant="secondary" size="sm" onClick={openPaste}>
                          Paste role IDs
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                          Import CSV
                        </Button>
                        <div className="shrink-0" style={{ width: "calc(var(--space-s80) * 4)" }}>
                          <TextField
                            type="search"
                            placeholder="Search roles"
                            value={query}
                            onChange={(value) => {
                              setQuery(value);
                              setPage(1);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <Table columns={columns} rows={visible} getRowKey={(row) => row.id} />
                    <Pagination
                      page={page}
                      total={filtered.length}
                      pageSize={linkPageSize}
                      onPageChange={setPage}
                      range={filtered.length === 0 ? "0 of 0" : `${rangeStart}–${rangeEnd} of ${filtered.length}`}
                    />
                  </div>
                ) : (
                  <p className="m-0 text-l2 text-body" style={labelL2}>
                    Unlocks after the security team builds the roles.
                  </p>
                )}
              </StepCard>
            </div>

            <div id={stepAnchor(4)}>
              <StepCard
                step={4}
                title="Run sync and check recommendation"
                state={step4}
                stateLabel={phase === "validated" ? "Done" : phase === "gaps" ? countLabel(gapCount, "gap") : idsReady ? "Required" : "Locked"}
              >
                {phase === "validated" ? (
                  <p className="m-0 text-l2 text-body" style={labelL2}>
                    {`All ${total} roles match the requirement.`}
                  </p>
                ) : phase === "gaps" ? (
                  <div className="flex flex-col items-start gap-s12">
                    <p className="m-0 text-l2 text-body" style={labelL2}>
                      {`${countLabel(gapCount, "role")} ${gapCount === 1 ? "does" : "do"} not match the requirement. ${gapRole ? gapSentence(gapRole.id) : "Review the gap rows."} Validated roles stay locked.`}
                    </p>
                    {designation.optionBGapReportSent ? (
                      <Alert type="success" title="Gap report sent">
                        The gap report was shared with the security team. Sample only.
                      </Alert>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-s8">
                      <Button variant="secondary" size="sm" onClick={() => sendGapReport(designationId)}>
                        Send gap report
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => runLinkSync(designationId)}>
                        Run sync again
                      </Button>
                    </div>
                  </div>
                ) : idsReady ? (
                  <div className="flex flex-col items-start gap-s12">
                    <p className="m-0 text-l2 text-body" style={labelL2}>
                      {`All ${total} SAP role IDs are entered. Run sync to check them against the requirement.`}
                    </p>
                    <Button variant="primary" size="md" onClick={() => runLinkSync(designationId)}>
                      Run sync
                    </Button>
                  </div>
                ) : (
                  <p className="m-0 text-l2 text-body" style={labelL2}>
                    {`Unlocks when all ${total} role IDs are entered.`}
                  </p>
                )}
              </StepCard>
            </div>
          </div>
        </div>
      </FlowShell>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv,.txt,text/plain"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={onFile}
      />

      <PasteRoleIdsDrawer
        opened={pasteOpen}
        text={pasteText}
        roles={rows.map((row) => ({ id: row.id, label: row.label, status: row.status }))}
        onTextChange={(value) => {
          setPasteText(value);
          setAutoCheck(false);
        }}
        onClose={() => setPasteOpen(false)}
        onApply={applyPaste}
        onImport={() => fileRef.current?.click()}
        autoCheck={autoCheck}
      />

      <Dialog
        opened={packageOpen}
        onClose={() => setPackageOpen(false)}
        size="lg"
        header={
          <div className="flex items-center justify-between gap-s12">
            <h2 className="m-0 text-heading-h2 text-strong" style={{ fontFamily: "var(--font-family-heading-h2)" }}>
              Requirement package
            </h2>
            <Button
              variant="ghost"
              size="xs"
              aria-label="Close requirement package"
              onClick={() => setPackageOpen(false)}
              leftIcon={<IconClose size="s16" />}
            >
              Close
            </Button>
          </div>
        }
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" size="md" onClick={() => setPackageOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-s12">
          <p className="m-0 text-l2 text-body" style={labelL2}>
            {`One package: ${total} roles, T-codes and auth values. Sample data.`}
          </p>
          <ul className="m-0 flex list-none flex-col gap-s8 p-0">
            {rolesFile.newRoles.map((role) => (
              <li key={role.id} className="flex flex-wrap items-baseline justify-between gap-s8">
                <span className="text-l2 text-body" style={{ fontFamily: "var(--font-family-label-l1)" }}>
                  {role.businessLabel}
                </span>
                <span className="text-l2 text-body" style={labelL2}>
                  {designation.roleSapNames[role.id] ?? role.sapRoleName}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Dialog>
    </AppFrame>
  );
}
