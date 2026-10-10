"use client";

import { activitiesFile, type Activity } from "@/mock";
import { Alert } from "@/ds/Alert";
import { AppFrame } from "@/ds/AppFrame";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { FlowShell } from "@/ds/FlowShell";
import { IconEye, IconUserCircle } from "@/ds/icons";
import { Link } from "@/ds/Link";
import { ProgressRing, ProgressTrackConnector, ProgressTrackNode, type ProgressNodeState } from "@/ds/Progress";
import { flowSteps } from "@/features/designation/flowSteps";
import { guardRedirect, pathFor } from "@/state/access";
import { useFlowStore } from "@/state/flowStore";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EditActivityDialog } from "../activities/EditActivityDialog";

type RowPhase = "synced" | "syncing" | "queued" | "failed";

function phaseFor(index: number, total: number, progress: number, failed: boolean): RowPhase {
  if (total === 0) {
    return "queued";
  }
  const done = Math.min(total, Math.floor((progress / 100) * total));
  if (failed && index === Math.min(done, total - 1)) {
    return "failed";
  }
  if (index < done) {
    return "synced";
  }
  if (!failed && progress < 100 && index === done) {
    return "syncing";
  }
  return "queued";
}

function formatElapsed(progress: number) {
  const seconds = Math.round((progress / 100) * 200);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) {
    return `${rest} s`;
  }
  return `${minutes} min ${rest} s`;
}

export function SyncPage({ designationId }: { designationId: string }) {
  const router = useRouter();
  const hydrated = useFlowStore((state) => state.hydrated);
  const designation = useFlowStore((state) => state.designations.find((item) => item.id === designationId));
  const setCurrentDesignation = useFlowStore((state) => state.setCurrentDesignation);
  const startSync = useFlowStore((state) => state.startSync);
  const saveDraft = useFlowStore((state) => state.saveDraft);
  const redirect = hydrated ? guardRedirect(designation, "sync") : null;
  const [viewing, setViewing] = useState<Activity | null>(null);
  const failOnStart = useSearchParams().get("outcome") === "failed";
  const started = useRef(false);

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

  useEffect(() => {
    if (!hydrated || redirect || !designation || designation.sync.status !== "idle" || started.current) {
      return;
    }
    started.current = true;
    void startSync(designationId, { fail: failOnStart });
  }, [hydrated, redirect, designation, designationId, startSync, failOnStart]);

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

  const selected = activitiesFile.activities.filter((activity) =>
    designation.selectedActivityIds.includes(activity.id),
  );
  const failed = designation.sync.status === "failed";
  const completed = designation.sync.status === "completed";
  const progress = designation.sync.progress;
  const phases = selected.map((_, index) => phaseFor(index, selected.length, progress, failed));
  const syncedCount = phases.filter((phase) => phase === "synced").length;
  const tcodeRead = selected.reduce(
    (sum, activity, index) => (phases[index] === "synced" ? sum + activity.tcodeIds.length : sum),
    0,
  );
  const authRead = selected.reduce(
    (sum, activity, index) => (phases[index] === "synced" ? sum + activity.authObjectIds.length : sum),
    0,
  );

  const track: [ProgressNodeState, ProgressNodeState, ProgressNodeState] = completed
    ? ["done", "done", "done"]
    : failed
      ? ["done", "error", "pending"]
      : progress > 0
        ? ["done", "active", "pending"]
        : ["active", "pending", "pending"];

  function retry() {
    void startSync(designationId);
  }

  return (
    <AppFrame>
      <FlowShell
        title="Create a New Designation"
        steps={flowSteps}
        activeIndex={2}
        contentSurface="white"
        pageSurface="white"
        onBack={() => router.push(pathFor("activities", designationId))}
        stepPrevVariant="primary"
        helperAlign="start"
        showFooterPrimary={false}
        primaryLabel="Next"
        primaryDisabled={!completed}
        onPrimaryClick={() => router.push(pathFor("roles", designationId))}
        helperText={
          completed ? undefined : failed ? (
            <>
              Next is off until the sync completes.{" "}
              <Link
                href="#retry-sync"
                onClick={(event) => {
                  event.preventDefault();
                  retry();
                }}
              >
                Retry sync
              </Link>
            </>
          ) : (
            "Next unlocks when the sync completes."
          )
        }
      >
        <div className="flex w-full flex-1 flex-col gap-s16">
          <div className="flex w-full flex-col gap-s10">
            <div className="flex w-full flex-col gap-s4">
              <div className="flex w-full items-center justify-between gap-s16">
                <div className="flex min-w-0 items-center gap-s8">
                  <span className="inline-flex shrink-0 text-body">
                    <IconUserCircle size="s16" />
                  </span>
                  <span
                    className="shrink-0 text-l2 text-body"
                    style={{
                      fontFamily: "var(--font-family-lato-regular)",
                      lineHeight: "var(--font-line-height-label-l1)",
                    }}
                  >
                    Designation:
                  </span>
                  <span
                    className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-l2 text-body"
                    style={{
                      maxWidth: "calc(var(--space-s80) * 7 + var(--space-s40))",
                      fontFamily: "var(--font-family-label-l1)",
                      fontWeight: "var(--font-weight-label-l1)",
                      lineHeight: "var(--font-line-height-label-l1)",
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
              <h2
                className="m-0 text-heading-h2 text-in-progress-text"
                style={{ fontFamily: "var(--font-family-heading-h2)" }}
              >
                Run sync
              </h2>
            </div>
            <p
              className="m-0 text-l2 text-body"
              style={{ fontFamily: "var(--font-family-lato-regular)", lineHeight: "var(--font-line-height-label-l1)" }}
            >
              Get the T-codes and auth values of your {selected.length}{" "}
              {selected.length === 1 ? "activity" : "activities"} from SAP.
            </p>
          </div>

          {completed ? (
            <Alert type="success" title="Sync completed">
              SAP returned T-codes and authorization values for every selected activity.
            </Alert>
          ) : null}
          {failed ? (
            <Alert type="error" title="Sync failed">
              SAP did not finish reading authorization values. Retry the sync to continue.
            </Alert>
          ) : null}

          <div className="flex w-full flex-1 items-start gap-s16">
            <section
              className="flex shrink-0 flex-col gap-s16 self-start rounded-s12 border border-solid border-subtle bg-surface-white p-s24"
              style={{ width: "calc(var(--space-s96) * 5 + var(--space-s80))" }}
            >
              <div className="flex w-full items-center gap-s8">
                <h3
                  className="m-0 min-w-0 flex-1 text-label-l1 text-strong"
                  style={{ fontFamily: "var(--font-family-label-l1)" }}
                >
                  Business activities
                </h3>
                <Badge size="md" variant="light">
                  {syncedCount} of {selected.length} synced
                </Badge>
              </div>
              <ul className="m-0 flex w-full list-none flex-col p-0">
                {selected.map((activity, index) => {
                  const phase = phases[index] ?? "queued";
                  return (
                    <li
                      key={activity.id}
                      className="flex w-full items-center self-stretch gap-s12 border-b border-solid border-subtle px-s0 py-s8"
                      style={{ minHeight: "var(--space-s96)" }}
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-s2">
                        <span className="text-label-l1 text-strong" style={{ fontFamily: "var(--font-family-label-l1)" }}>
                          {activity.name}
                        </span>
                        <span
                          className="text-control-sm text-body"
                          style={{ fontFamily: "var(--font-family-lato-semibold)" }}
                        >
                          {phase === "syncing"
                            ? "Reading auth values…"
                            : phase === "queued"
                              ? "Waiting to start"
                              : phase === "failed"
                                ? "Sync stopped on this activity"
                                : `${activity.tcodeIds.length} T-codes · ${activity.authObjectIds.length} auth objects`}
                        </span>
                      </span>
                      <span
                        className="flex shrink-0 items-center"
                        style={{ width: "calc(var(--space-s80) + var(--space-s8))" }}
                      >
                        <Badge
                          size="md"
                          variant={
                            phase === "synced" ? "completed" : phase === "syncing" ? "in-progress" : phase === "failed" ? "error" : "pending"
                          }
                        >
                          {phase === "synced" ? "Synced" : phase === "syncing" ? "Syncing" : phase === "failed" ? "Error" : "Queued"}
                        </Badge>
                      </span>
                      <span
                        className="flex shrink-0 items-center justify-end"
                        style={{ width: "calc(var(--space-s80) + var(--space-s8))" }}
                      >
                        <Link
                          href="#view-details"
                          onClick={(event) => {
                            event.preventDefault();
                            setViewing(activity);
                          }}
                        >
                          View details
                        </Link>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p
                className="m-0 flex items-center gap-s8 text-l2 text-body"
                style={{ fontFamily: "var(--font-family-lato-regular)", lineHeight: "var(--font-line-height-label-l1)" }}
              >
                <span className="inline-flex h-s20 w-s20 shrink-0 items-center justify-center text-body">
                  <IconEye size="s16" />
                </span>
                <span>
                  {selected.length === 1 ? "1 activity selected" : `${selected.length} activities selected`} · locked
                  during sync
                </span>
              </p>
            </section>

            <section className="flex h-full min-w-0 flex-1 flex-col items-center gap-s16 rounded-s12 border border-solid border-subtle bg-surface-white p-s24">
              <h3
                className="m-0 w-full text-label-l1 text-strong"
                style={{ fontFamily: "var(--font-family-label-l1)" }}
              >
                Synchronization progress
              </h3>
              <ProgressRing value={failed ? progress : completed ? 100 : progress} size="lg" />
              <p
                className="m-0 text-center text-body-b3 text-strong"
                style={{ fontFamily: "var(--font-family-lato-semibold)" }}
              >
                {completed ? "Synchronization completed" : failed ? "Synchronization failed" : "Running synchronization…"}
              </p>
              <p
                className="m-0 text-center text-l2 text-body"
                style={{ fontFamily: "var(--font-family-lato-regular)", lineHeight: "var(--font-line-height-label-l1)" }}
              >
                {syncedCount} of {selected.length} {selected.length === 1 ? "activity" : "activities"} synced
              </p>
              <div className="flex w-full items-start gap-s12">
                {[
                  ["T-codes read", String(tcodeRead)],
                  ["Auth objects read", String(authRead)],
                  ["Elapsed", formatElapsed(completed ? 100 : progress)],
                ].map(([label, value]) => (
                  <div key={label} className="flex min-w-0 flex-1 flex-col gap-s4 rounded-s8 bg-surface p-s12">
                    <span
                      className="text-control-sm text-body"
                      style={{ fontFamily: "var(--font-family-lato-semibold)" }}
                    >
                      {label}
                    </span>
                    <span
                      className="text-body-b3 text-strong"
                      style={{ fontFamily: "var(--font-family-lato-semibold)" }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="flex items-start"
                style={{ width: "calc(var(--space-s96) * 5)" }}
              >
                <ProgressTrackNode label="Starting" number="1" state={track[0]} />
                <ProgressTrackConnector state={track[0] === "done" ? "done" : "pending"} />
                <ProgressTrackNode label="Syncing" number="2" state={track[1]} />
                <ProgressTrackConnector state={track[1] === "done" ? "done" : "pending"} />
                <ProgressTrackNode label="Completed" number="3" state={track[2]} />
              </div>
            </section>
          </div>
        </div>
      </FlowShell>
      <EditActivityDialog
        opened={viewing !== null}
        onClose={() => setViewing(null)}
        activity={viewing}
        saved={viewing ? designation.activityEdits?.[viewing.id] : undefined}
        readOnly
      />
    </AppFrame>
  );
}
