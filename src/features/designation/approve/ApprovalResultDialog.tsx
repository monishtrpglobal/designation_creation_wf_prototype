"use client";

import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Dialog } from "@/ds/Dialog";
import { IconAlertCircle, IconCircleCheck } from "@/ds/icons";
import type { CSSProperties } from "react";

const titleText: CSSProperties = {
  fontFamily: "var(--font-family-lato-bold)",
  fontSize: "var(--font-size-l1)",
  fontWeight: "var(--font-weight-label-l1)",
  lineHeight: "var(--font-line-height-label-l1)",
};

const bodyText: CSSProperties = {
  fontFamily: "var(--font-family-lato-regular)",
  fontSize: "var(--font-size-l2)",
  fontWeight: "var(--font-weight-body-b4)",
  lineHeight: "var(--font-line-height-label-l1)",
};

type ApprovalResult = "published" | "rejected";

type ApprovalResultDialogProps = {
  result: ApprovalResult | null;
  onClose: () => void;
};

export function ApprovalResultDialog({ result, onClose }: ApprovalResultDialogProps) {
  const published = result === "published";
  return (
    <Dialog opened={result !== null} onClose={onClose} size="sm" variant="confirm">
      <div className="flex flex-col items-center gap-s16 text-center">
        <span
          className={`flex items-center justify-center rounded-full border ${
            published ? "border-success-border text-success-text" : "border-error-border text-error-text"
          }`}
          style={{ width: "var(--space-s40)", height: "var(--space-s40)" }}
        >
          {published ? <IconCircleCheck size="s24" /> : <IconAlertCircle size="s24" />}
        </span>
        <div className="flex flex-col gap-s4">
          <p className="m-0 text-body" style={titleText}>
            {published ? "Designation published." : "Rejected."}
          </p>
          <p className="m-0 text-body" style={bodyText}>
            {published ? "Available in the GRC application." : "Sent back to the designation owner."}
          </p>
        </div>
        <Badge variant={published ? "completed" : "error"}>{published ? "Published" : "Rejected"}</Badge>
        <Button variant="secondary" size="md" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
}
