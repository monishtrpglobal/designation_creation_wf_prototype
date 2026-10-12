import { formatUpdated } from "@/features/designation/catalogue/catalogueView";
import { sodConflictsFor } from "@/features/designation/license/licenseReportView";
import type { SodConflict, SodResolution, SodRisk } from "@/mock";
import type { DesignationRuntime } from "@/state/model";

export type ApprovalTone = "warning" | "success";

export type ApprovalFooter = {
  tone: ApprovalTone;
  label: string;
};

const commentPlaceholder = "Add a comment";

export function sodTotals(item: DesignationRuntime) {
  return {
    high: item.sodSummary?.high ?? 0,
    medium: item.sodSummary?.medium ?? 0,
    low: item.sodSummary?.low ?? 0,
  };
}

export function hasSodRisk(item: DesignationRuntime) {
  const totals = sodTotals(item);
  return totals.high + totals.medium + totals.low > 0;
}

export function pairLabel(conflict: SodConflict) {
  return `${conflict.roleALabel} and ${conflict.roleBLabel}`;
}

export function conflictStage(conflict: SodConflict): "accepted" | "new" {
  if (conflict.stage) {
    return conflict.stage;
  }
  return conflict.whitelisted ? "accepted" : "new";
}

export function conflictResolution(conflict: SodConflict): SodResolution {
  if (conflict.resolution) {
    return conflict.resolution;
  }
  return conflict.whitelisted ? "whitelisted" : "open";
}

export function approvalConflicts(designationId: string) {
  const conflicts = sodConflictsFor(designationId);
  const accepted = conflicts.filter((conflict) => conflictStage(conflict) === "accepted");
  const fresh = conflicts.filter((conflict) => conflictStage(conflict) === "new");
  const whitelisted = accepted.filter((conflict) => conflictResolution(conflict) === "whitelisted");
  const remediated = accepted.filter((conflict) => conflictResolution(conflict) === "remediated");
  return { accepted, fresh, whitelisted, remediated };
}

export function needsReadMore(justification: string) {
  return justification.length > 90;
}

export function metaLine(conflict: SodConflict) {
  const resolution = conflictResolution(conflict);
  if (!conflict.whitelistedBy || !conflict.whitelistedAt || resolution === "open") {
    return null;
  }
  const verb = resolution === "remediated" ? "Remediated" : "Whitelisted";
  return `${verb} by ${conflict.whitelistedBy} · ${formatUpdated(conflict.whitelistedAt)}`;
}

export function commentRequired(item: DesignationRuntime) {
  return sodTotals(item).high > 0;
}

export function commentLabel(item: DesignationRuntime) {
  const high = sodTotals(item).high;
  if (high > 0) {
    return `Comment (required: ${high} High risk)`;
  }
  return "Comment (optional)";
}

export function commentFieldPlaceholder() {
  return commentPlaceholder;
}

export function canPublish(item: DesignationRuntime, acknowledged: boolean, comment: string) {
  if (!hasSodRisk(item)) {
    return true;
  }
  if (!acknowledged) {
    return false;
  }
  if (commentRequired(item) && comment.trim().length === 0) {
    return false;
  }
  return true;
}

export function approvalFooter(item: DesignationRuntime, acknowledged: boolean, comment: string): ApprovalFooter {
  if (!hasSodRisk(item)) {
    return { tone: "success", label: "No SoD risk found." };
  }
  if (canPublish(item, acknowledged, comment)) {
    return { tone: "success", label: "Ready to publish. Your acknowledgement will be recorded." };
  }
  const missing: string[] = [];
  if (!acknowledged) {
    missing.push("tick the box");
  }
  if (commentRequired(item) && comment.trim().length === 0) {
    missing.push("add a comment");
  }
  return { tone: "warning", label: `Continue is off: ${missing.join(" and ")}.` };
}

export function newConflictLine(fresh: SodConflict[], high: number) {
  const count = fresh.length > 0 ? fresh.length : high;
  const highCount = fresh.length > 0 ? fresh.filter((conflict) => conflict.risk === "High").length : high;
  return `New conflicts detected: ${count} (High ${highCount})`;
}

export function remediatedLine(count: number) {
  return `Remediated: ${count} (T-codes removed or roles split)`;
}

export function riskTileTone(risk: SodRisk): "error" | "warning" | "neutral" {
  if (risk === "High") {
    return "error";
  }
  if (risk === "Medium") {
    return "warning";
  }
  return "neutral";
}
