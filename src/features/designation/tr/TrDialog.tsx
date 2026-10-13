"use client";

import { Alert } from "@/ds/Alert";
import { Badge, type BadgeVariant } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Dialog } from "@/ds/Dialog";
import { IconCircleCheck, IconClose } from "@/ds/icons";
import { ProgressTrackConnector, ProgressTrackNode } from "@/ds/Progress";
import { Table, type TableColumn } from "@/ds/Table";
import { TextArea } from "@/ds/TextArea";
import { useFlowStore } from "@/state/flowStore";
import type { DesignationRuntime } from "@/state/model";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type UIEvent } from "react";
import {
  importCounts,
  movementTrack,
  trRequestId,
  trRouteLabel,
  trRows,
  trTotal,
  trWindowSize,
  visibleRange,
  scrollTopForWindow,
  type TrRow,
  type TrRowStatus,
} from "./trView";

const label: CSSProperties = {
  fontFamily: "var(--font-family-lato-regular)",
  fontSize: "var(--font-size-l2)",
  fontWeight: "var(--font-weight-body-b4)",
  lineHeight: "var(--font-line-height-label-l1)",
  color: "var(--color-text-body)",
};

const value: CSSProperties = {
  fontFamily: "var(--font-family-lato-bold)",
  fontSize: "var(--font-size-l1)",
  fontWeight: "var(--font-weight-label-l1)",
  lineHeight: "var(--font-line-height-label-l1)",
  color: "var(--color-text-strong)",
};

const listHeight = "calc(var(--space-s40) + (var(--space-s40) + var(--space-s4)) * 5)";

const checks = [
  `${trTotal} of ${trTotal} TRs released`,
  "No import-queue conflicts",
  "Target system reachable (SAP QUALITY)",
];

function statusVariant(status: TrRowStatus): BadgeVariant {
  if (status === "Importing") {
    return "in-progress";
  }
  if (status === "Queued") {
    return "pending";
  }
  return "completed";
}

function Meta({ labelText, children }: { labelText: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-s4">
      <span style={label}>{labelText}</span>
      {children}
    </div>
  );
}

function Tile({ labelText, amount }: { labelText: string; amount: number }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-s4 rounded-s8 border border-solid border-subtle bg-surface-raised px-s12 py-s12">
      <span style={label}>{labelText}</span>
      <span style={{ ...value, fontSize: "var(--font-size-heading-h2)" }}>{amount}</span>
    </div>
  );
}

export function TrDialog({
  designation,
  onClose,
}: {
  designation: DesignationRuntime;
  onClose: () => void;
}) {
  const approveTr = useFlowStore((state) => state.approveTr);
  const rejectTr = useFlowStore((state) => state.rejectTr);
  const phase = designation.status === "Awaiting TR approval" ? "approve" : "moving";
  const dismissed = designation.status === "Rejected";
  const imported = designation.approval.trImported;
  const counts = importCounts(imported);
  const done = imported >= trTotal;
  const rows = useMemo(
    () => trRows(designation.method, phase === "approve" ? null : imported),
    [designation.method, phase, imported],
  );
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [range, setRange] = useState({ start: 1, end: Math.min(trWindowSize, trTotal) });
  const scroller = useRef<HTMLDivElement>(null);
  const positioned = useRef(false);

  function syncRange(node: HTMLDivElement) {
    const row = node.querySelector("tbody tr");
    const height = row?.getBoundingClientRect().height ?? 0;
    setRange(visibleRange(node.scrollTop, height));
  }

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (dismissed) {
      onCloseRef.current();
    }
  }, [dismissed]);

  const importedAtOpen = useRef(imported);
  if (!positioned.current) {
    importedAtOpen.current = imported;
  }

  useLayoutEffect(() => {
    if (phase !== "moving" || positioned.current) {
      return;
    }
    let frame = 0;
    let cancelled = false;
    function place() {
      if (cancelled) {
        return;
      }
      const node = scroller.current;
      const row = node?.querySelector("tbody tr");
      const height = row?.getBoundingClientRect().height ?? 0;
      if (!node || height === 0) {
        frame = requestAnimationFrame(place);
        return;
      }
      node.scrollTop =
        importedAtOpen.current > 1 ? scrollTopForWindow(importedAtOpen.current, height) : 0;
      positioned.current = true;
      setRange(visibleRange(node.scrollTop, height));
    }
    place();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [phase, rows.length]);

  function onScroll(event: UIEvent<HTMLDivElement>) {
    syncRange(event.currentTarget);
  }

  const columns = useMemo<TableColumn<TrRow>[]>(() => {
    const statusColumn: TableColumn<TrRow> = {
      key: "status",
      label: "Status",
      width: phase === "approve" ? "calc(var(--space-s96) + var(--space-s24))" : "calc(var(--space-s80) * 2)",
      render: (row) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
    };
    const shared: TableColumn<TrRow>[] = [
      {
        key: "number",
        label: "TR number",
        width: "calc(var(--space-s96) + var(--space-s40) + var(--space-s4))",
        render: (row) => row.number,
      },
      {
        key: "roleId",
        label: "Role ID",
        render: (row) => (
          <span className="block truncate" title={row.roleId}>
            {row.roleId}
          </span>
        ),
      },
    ];
    if (phase === "approve") {
      shared.push({
        key: "createdBy",
        label: "Created by",
        width: "calc(var(--space-s96) + var(--space-s24))",
        render: (row) => row.createdBy,
      });
    }
    shared.push(statusColumn);
    return shared;
  }, [phase]);

  function reject() {
    if (reason.trim().length === 0) {
      setReasonError("Enter a reason to reject");
      return;
    }
    if (rejectTr(designation.id, reason)) {
      onClose();
    }
  }

  const track = movementTrack(imported);
  const title =
    phase === "approve" ? "Approve TR movement" : `TR movement · ${designation.name}`;

  if (dismissed) {
    return null;
  }

  return (
    <Dialog opened onClose={onClose} size="lg">
      <div className="flex flex-col gap-s16">
        <div className="flex items-start justify-between gap-s12">
          <h2
            className="m-0 text-heading-h2"
            style={{ fontFamily: "var(--font-family-heading-h2)", color: "var(--color-text-strong)" }}
          >
            {title}
          </h2>
          <Button
            variant="ghost"
            size="xs"
            iconOnly
            aria-label="Close"
            onClick={onClose}
            leftIcon={<IconClose size="s16" />}
          />
        </div>

        {phase === "approve" ? (
          <div className="flex flex-wrap items-start gap-s32">
            <Meta labelText="Designation">
              <span style={value}>{designation.name}</span>
            </Meta>
            <Meta labelText="Request ID">
              <span style={value}>{trRequestId}</span>
            </Meta>
            <Meta labelText="Route">
              <Badge variant="light">{trRouteLabel}</Badge>
            </Meta>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-s12">
            <Badge variant="in-progress">Moving to Quality</Badge>
            <span style={value}>
              {trRequestId} · {trRouteLabel}
            </span>
          </div>
        )}

        {phase === "moving" && done ? (
          <Alert type="success" compact showTitle={false}>
            {`All ${trTotal} transport requests are in Quality`}
          </Alert>
        ) : null}

        {phase === "moving" && !done ? (
          <Alert type="info" compact showTitle={false}>
            You can close this window. The movement keeps running and the catalogue shows its status.
          </Alert>
        ) : null}

        {phase === "moving" ? (
          <>
            <div className="mx-auto flex w-full items-start" style={{ maxWidth: "calc(var(--space-s96) * 5)" }}>
              <ProgressTrackNode label="Starting" number="1" state={track.starting} />
              <ProgressTrackConnector state={track.afterStarting} />
              <ProgressTrackNode label="Importing" number="2" state={track.importing} />
              <ProgressTrackConnector state={track.afterImporting} />
              <ProgressTrackNode label="Completed" number="3" state={track.completed} />
            </div>
            <p className="m-0 text-center" style={value}>
              {`${counts.imported} of ${counts.total} transport requests imported`}
            </p>
            <div className="flex gap-s12">
              <Tile labelText="Imported" amount={counts.imported} />
              <Tile labelText="Importing" amount={counts.importing} />
              <Tile labelText="Queued" amount={counts.queued} />
            </div>
          </>
        ) : null}

        <div>
          <div
            ref={scroller}
            className="overflow-auto"
            style={{ maxHeight: listHeight }}
            onScroll={onScroll}
            role="region"
            aria-label="Transport requests"
          >
            <Table columns={columns} rows={rows} getRowKey={(row) => row.id} density="compact" sort={null} />
          </div>
          <p className="m-0 mt-s8" style={label}>
            {`Showing ${range.start}-${range.end} of ${trTotal}`}
          </p>
        </div>

        {phase === "approve" ? (
          <>
            <div className="flex flex-col gap-s8">
              <p className="m-0" style={value}>
                Technical checks
              </p>
              <ul className="m-0 flex list-none flex-col gap-s8 p-0">
                {checks.map((check) => (
                  <li key={check} className="flex items-center gap-s8">
                    <IconCircleCheck size="s20" className="shrink-0 text-success-text" />
                    <span style={value}>{check}</span>
                  </li>
                ))}
              </ul>
            </div>
            <TextArea
              id="tr-reject-reason"
              label="Reason (required to reject)"
              placeholder="Enter a reason"
              value={reason}
              error={reasonError}
              onChange={(next) => {
                setReason(next);
                if (reasonError && next.trim().length > 0) {
                  setReasonError(undefined);
                }
              }}
            />
            <div className="flex flex-col gap-s8">
              <div className="flex flex-wrap items-center gap-s12">
                <Button variant="primary" size="md" onClick={() => approveTr(designation.id)}>
                  Approve and move to Quality
                </Button>
                <Button variant="warn" size="md" onClick={reject}>
                  Reject
                </Button>
              </div>
              <p className="m-0" style={label}>
                After approval, license analysis starts automatically.
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-s12">
            <p className="m-0" style={label}>
              {done
                ? "License analysis has started."
                : "License analysis starts when all 50 are imported."}
            </p>
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
