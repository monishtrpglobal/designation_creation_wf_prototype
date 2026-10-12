"use client";

import { Alert } from "@/ds/Alert";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Drawer } from "@/ds/Drawer";
import { IconClose, IconInfo } from "@/ds/icons";
import { Tabs } from "@/ds/Tabs";
import type { SodConflict } from "@/mock";
import { useEffect, useState, type CSSProperties } from "react";
import {
  approvalConflicts,
  conflictResolution,
  metaLine,
  pairLabel,
} from "../approve/approvalView";

const bodyText: CSSProperties = {
  fontFamily: "var(--font-family-lato-regular)",
  fontSize: "var(--font-size-l2)",
  fontWeight: "var(--font-weight-body-b4)",
  lineHeight: "var(--font-line-height-label-l1)",
};

const captionText: CSSProperties = {
  fontFamily: "var(--font-family-control-sm)",
  fontSize: "var(--font-size-control-sm)",
  fontWeight: "var(--font-weight-control-sm)",
  lineHeight: "var(--font-line-height-control-sm)",
};

type SodTab = "accepted" | "new";

type SodDetailsDrawerProps = {
  designationId: string | null;
  designationName: string;
  department?: string;
  highlightId?: string | null;
  onClose: () => void;
};

export function SodDetailsDrawer({
  designationId,
  designationName,
  department,
  highlightId,
  onClose,
}: SodDetailsDrawerProps) {
  const groups = designationId ? approvalConflicts(designationId) : null;
  const accepted = groups?.accepted ?? [];
  const fresh = groups?.fresh ?? [];
  const [tab, setTab] = useState<SodTab>("accepted");

  useEffect(() => {
    setTab("accepted");
  }, [designationId]);

  useEffect(() => {
    if (!highlightId || !designationId) {
      return;
    }
    const node = document.getElementById(`sod-conflict-${highlightId}`);
    node?.scrollIntoView({ block: "nearest" });
  }, [highlightId, designationId, tab]);

  const rows = tab === "accepted" ? accepted : fresh;
  const summary =
    accepted.length + fresh.length === 0
      ? "No SoD conflicts are recorded for this designation."
      : `${accepted.length} accepted during creation, ${fresh.length} new since the request was submitted.`;

  return (
    <Drawer
      opened={designationId !== null}
      onClose={onClose}
      size="lg"
      zIndex={999}
      header={
        <div className="flex w-full flex-col gap-s8">
          <div className="flex w-full items-start justify-between gap-s8">
            <h2 className="m-0 min-w-0 flex-1 text-heading-h2 text-body" style={{ fontFamily: "var(--font-family-heading-h2)" }}>
              SoD details
            </h2>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Close"
              leftIcon={<IconClose size="s16" />}
              onClick={onClose}
            />
          </div>
          <div className="flex flex-wrap items-center gap-s8">
            <span className="text-body" style={bodyText}>
              {designationName}
            </span>
            {department ? <Badge variant="light">{department}</Badge> : null}
          </div>
          <Alert type="info" compact showTitle={false}>
            Read only. Whitelist decisions can&apos;t be changed here.
          </Alert>
        </div>
      }
      footer={
        <div className="flex w-full flex-col gap-s16">
          <div className="flex flex-col gap-s4">
            <p className="m-0 text-body" style={captionText}>
              What this shows
            </p>
            <p className="m-0 text-body" style={bodyText}>
              {summary}
            </p>
            <p className="m-0 flex items-center gap-s6 pt-s8 text-body" style={captionText}>
              <IconInfo size="s24" aria-hidden />
              Read only: nothing to save.
            </p>
          </div>
          <div className="flex justify-end border-t border-subtle pt-s16">
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      {accepted.length + fresh.length === 0 ? (
        <p className="m-0 p-s20 text-body" style={bodyText}>
          No SoD conflicts are recorded for this designation.
        </p>
      ) : (
        <div className="flex flex-col gap-s12 p-s20">
          <Tabs
            variant="pill"
            showPanels={false}
            value={tab}
            onChange={(value) => setTab(value === "new" ? "new" : "accepted")}
            items={[
              {
                value: "accepted",
                label: "Accepted",
                count: (
                  <Badge size="sm" variant="light">
                    {accepted.length}
                  </Badge>
                ),
              },
              {
                value: "new",
                label: "New",
                count: (
                  <Badge size="sm" variant="light">
                    {fresh.length}
                  </Badge>
                ),
              },
            ]}
          />
          <div className="flex flex-col">
            {rows.map((conflict, index) => (
              <ConflictCard key={conflict.id} conflict={conflict} divided={index < rows.length - 1} />
            ))}
            {rows.length === 0 ? (
              <p className="m-0 text-body" style={bodyText}>
                {tab === "new" ? "No new conflicts." : "No accepted conflicts."}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function ConflictCard({ conflict, divided }: { conflict: SodConflict; divided: boolean }) {
  const resolution = conflictResolution(conflict);
  const meta = metaLine(conflict);
  return (
    <article
      id={`sod-conflict-${conflict.id}`}
      className={`flex flex-col gap-s4 py-s8 ${divided ? "border-b border-subtle" : ""}`}
    >
      <div className="flex items-start justify-between gap-s8">
        <p className="m-0 text-body" style={bodyText}>
          {pairLabel(conflict)}
        </p>
        <Badge size="sm" variant="light">
          {conflict.risk}
        </Badge>
      </div>
      {conflict.tcodes ? (
        <p className="m-0 text-body" style={captionText}>
          {`Conflicting T-codes: ${conflict.tcodes}`}
        </p>
      ) : null}
      {resolution === "whitelisted" ? <Badge variant="light">Whitelisted</Badge> : null}
      {resolution === "remediated" ? <Badge variant="completed">Remediated</Badge> : null}
      {resolution === "open" ? <Badge variant="warning">Open</Badge> : null}
      {conflict.justification ? (
        <p className="m-0 text-body" style={bodyText}>
          {conflict.justification}
        </p>
      ) : null}
      {meta ? (
        <p className="m-0 text-body" style={captionText}>
          {meta}
        </p>
      ) : null}
    </article>
  );
}
