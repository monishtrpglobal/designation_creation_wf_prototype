"use client";

import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Checkbox } from "@/ds/Checkbox";
import { Dialog } from "@/ds/Dialog";
import { IconAlertTriangle, IconCircleCheck } from "@/ds/icons";
import { Link } from "@/ds/Link";
import { TextArea } from "@/ds/TextArea";
import type { SodConflict, SodRisk } from "@/mock";
import type { DesignationRuntime } from "@/state/model";
import { useFlowStore } from "@/state/flowStore";
import { useEffect, useState, type CSSProperties } from "react";
import { SodDetailsDrawer } from "../license/SodDetailsDrawer";
import {
  approvalConflicts,
  approvalFooter,
  canPublish,
  commentFieldPlaceholder,
  commentLabel,
  commentRequired,
  hasSodRisk,
  metaLine,
  needsReadMore,
  newConflictLine,
  pairLabel,
  remediatedLine,
  sodTotals,
} from "./approvalView";

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

const tileTone = {
  error: "border-error-border-subtle bg-error-bg text-error-text",
  warning: "border-warning-border-subtle bg-warning-bg text-warning-text",
  neutral: "border-subtle bg-surface text-body",
} as const;

type FinalApprovalDialogProps = {
  designation: DesignationRuntime | null;
  onClose: () => void;
  onPublished: () => void;
};

export function FinalApprovalDialog({ designation, onClose, onPublished }: FinalApprovalDialogProps) {
  const approveFinal = useFlowStore((state) => state.approveFinal);
  const [acknowledged, setAcknowledged] = useState(false);
  const [comment, setComment] = useState("");
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    setAcknowledged(false);
    setComment("");
    setDetailsId(null);
    setHighlightId(null);
  }, [designation?.id]);

  if (!designation) {
    return null;
  }

  const totals = sodTotals(designation);
  const groups = approvalConflicts(designation.id);
  const risky = hasSodRisk(designation);
  const ready = canPublish(designation, acknowledged, comment);
  const footer = approvalFooter(designation, acknowledged, comment);

  function publish() {
    if (!designation || !ready) {
      return;
    }
    const saved = approveFinal(designation.id, {
      comment,
      highRiskAcknowledged: risky ? acknowledged : false,
    });
    if (saved) {
      onPublished();
    }
  }

  function openDetails(conflictId?: string) {
    setHighlightId(conflictId ?? null);
    setDetailsId(designation?.id ?? null);
  }

  return (
    <>
      {risky ? (
        <Dialog
          opened
          onClose={onClose}
          zIndex={400}
          width="var(--size-drawer-lg)"
          header={
            <div className="flex flex-col gap-s4">
              <h2 className="m-0 text-heading-h2 text-strong" style={{ fontFamily: "var(--font-family-heading-h2)" }}>
                SoD risk found. Review before publishing
              </h2>
              <div className="flex flex-wrap items-center gap-s8">
                <span className="text-body" style={bodyText}>
                  {designation.name}
                </span>
                {designation.businessArea ? <Badge size="sm" variant="light">{designation.businessArea}</Badge> : null}
              </div>
            </div>
          }
          footer={
            <div className="flex w-full flex-col items-end gap-s8">
              <div className="flex items-center justify-end gap-s12">
                <Button variant="secondary" size="md" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="warn" size="md" disabled={!ready} onClick={publish}>
                  Continue and publish
                </Button>
              </div>
              <p
                className={`m-0 flex items-center gap-s6 ${footer.tone === "success" ? "text-success-text" : "text-warning-text"}`}
                style={captionText}
              >
                {footer.tone === "success" ? <IconCircleCheck size="s24" /> : <IconAlertTriangle size="s24" />}
                {footer.label}
              </p>
            </div>
          }
        >
          <div className="flex flex-col gap-s16">
            <div className="grid grid-cols-3 gap-s8">
              <RiskTile label="High" count={totals.high} tone="error" />
              <RiskTile label="Medium" count={totals.medium} tone="warning" />
              <RiskTile label="Low" count={totals.low} tone="neutral" />
            </div>

            <section className="flex flex-col gap-s8 rounded-s12 border border-subtle bg-surface p-s12">
              <div className="flex items-center justify-between gap-s8">
                <h3 className="m-0 text-body" style={{ ...bodyText, fontFamily: "var(--font-family-lato-bold)", fontWeight: "var(--font-weight-label-l1)" }}>
                  Accepted during creation
                </h3>
                <span className="text-body" style={captionText}>{`${groups.accepted.length} conflicts`}</span>
              </div>
              {groups.whitelisted.length > 0 ? (
                <p className="m-0 text-body" style={captionText}>
                  {`Whitelisted with justification: ${groups.whitelisted.length}`}
                </p>
              ) : null}
              <div className="flex flex-col gap-s8">
                {groups.whitelisted.map((conflict, index) => (
                  <WhitelistEntry
                    key={conflict.id}
                    conflict={conflict}
                    divided={index < groups.whitelisted.length - 1 || groups.remediated.length > 0}
                    onReadMore={() => openDetails(conflict.id)}
                  />
                ))}
                {groups.remediated.length > 0 ? (
                  <p className="m-0 text-body" style={captionText}>
                    {remediatedLine(groups.remediated.length)}
                  </p>
                ) : null}
              </div>
            </section>

            {groups.fresh.length > 0 || totals.high > 0 ? (
              <section className="flex flex-col gap-s4 rounded-s12 border border-warning-border bg-warning-bg p-s12 text-warning-text">
                <div className="flex items-center justify-between gap-s8">
                  <h3 className="m-0" style={{ ...bodyText, fontFamily: "var(--font-family-lato-bold)", fontWeight: "var(--font-weight-label-l1)" }}>
                    New since request was submitted
                  </h3>
                  <Badge variant="warning">New</Badge>
                </div>
                <p className="m-0" style={captionText}>
                  {newConflictLine(groups.fresh, totals.high)}
                </p>
              </section>
            ) : null}

            <Link href="#sod-details" onClick={(event) => { event.preventDefault(); openDetails(); }}>
              View SoD details (read-only)
            </Link>

            <Checkbox
              checked={acknowledged}
              label="I understand these risks and want to publish anyway."
              onChange={setAcknowledged}
            />

            <div className="flex flex-col gap-s4">
              <TextArea
                id="final-approval-comment"
                label={commentLabel(designation)}
                required={commentRequired(designation)}
                tooltip="Stored with your acknowledgement against this designation."
                placeholder={commentFieldPlaceholder()}
                value={comment}
                onChange={setComment}
              />
              <p className="m-0 text-body" style={captionText}>
                Your acknowledgement is recorded against this designation.
              </p>
            </div>
          </div>
        </Dialog>
      ) : (
        <Dialog
          opened
          onClose={onClose}
          zIndex={400}
          size="sm"
          variant="confirm"
          header={
            <div className="flex flex-col gap-s4">
              <h2 className="m-0 text-heading-h2 text-strong" style={{ fontFamily: "var(--font-family-heading-h2)" }}>
                Publish this designation to the GRC application?
              </h2>
              <div className="flex flex-wrap items-center gap-s8">
                <span className="text-body" style={bodyText}>
                  {designation.name}
                </span>
                {designation.businessArea ? <Badge size="sm" variant="light">{designation.businessArea}</Badge> : null}
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-end gap-s12">
              <Button variant="secondary" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={publish}>
                Publish
              </Button>
            </div>
          }
        >
          <p className="m-0 flex items-center gap-s6 text-body" style={bodyText}>
            <IconCircleCheck size="s24" className="text-success-text" />
            No SoD risk found.
          </p>
        </Dialog>
      )}
      <SodDetailsDrawer
        designationId={detailsId}
        designationName={designation.name}
        department={designation.businessArea}
        highlightId={highlightId}
        onClose={() => setDetailsId(null)}
      />
    </>
  );
}

function RiskTile({ label, count, tone }: { label: SodRisk; count: number; tone: keyof typeof tileTone }) {
  return (
    <article className={`flex flex-col gap-s4 rounded-s8 border p-s12 ${tileTone[tone]}`}>
      <p className="m-0" style={captionText}>
        {label}
      </p>
      <p className="m-0 text-heading-h2" style={{ fontFamily: "var(--font-family-heading-h2)" }}>
        {count}
      </p>
    </article>
  );
}

function WhitelistEntry({
  conflict,
  divided,
  onReadMore,
}: {
  conflict: SodConflict;
  divided: boolean;
  onReadMore: () => void;
}) {
  const long = needsReadMore(conflict.justification);
  const meta = metaLine(conflict);
  return (
    <div className={`flex flex-col gap-s4 ${divided ? "border-b border-subtle pb-s8" : ""}`}>
      <div className="flex items-start justify-between gap-s8">
        <p className="m-0 text-body" style={bodyText}>
          {pairLabel(conflict)}
        </p>
        <Badge size="sm" variant="light">
          {conflict.risk}
        </Badge>
      </div>
      <p
        className="m-0 text-body"
        style={
          long
            ? {
                ...captionText,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : captionText
        }
      >
        {conflict.justification}
      </p>
      {long ? (
        <Link
          href={`#sod-${conflict.id}`}
          onClick={(event) => {
            event.preventDefault();
            onReadMore();
          }}
        >
          Read more
        </Link>
      ) : null}
      {meta ? (
        <p className="m-0 text-body" style={captionText}>
          {meta}
        </p>
      ) : null}
    </div>
  );
}
