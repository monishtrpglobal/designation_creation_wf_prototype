"use client";

import { Alert } from "@/ds/Alert";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Drawer } from "@/ds/Drawer";
import { DrawerFooterSummary } from "@/ds/DrawerFooterSummary";
import { IconClose } from "@/ds/icons";
import { ProgressTrack, type ProgressTrackStage } from "@/ds/Progress";
import { StepCard, type StepCardState } from "@/ds/StepCard";
import type { RoleRuntimeStatus } from "@/state/model";
import { badgeLabel, badgeVariant, roleDetail, transportNumber } from "./rolesView";

export type RoleDrawerTarget = {
  id: string;
  label: string;
  sapName: string;
  status: RoleRuntimeStatus;
  retried: boolean;
  allSettled: boolean;
};

type RoleDetailsDrawerProps = {
  role: RoleDrawerTarget | null;
  onClose: () => void;
  onRetry: (roleId: string) => void;
};

function trackStage(status: RoleRuntimeStatus): ProgressTrackStage {
  if (status === "Failed") {
    return "stopped";
  }
  if (status === "Created") {
    return "synced";
  }
  if (status === "Syncing") {
    return "profile-and-tr";
  }
  return "creating";
}

export function RoleDetailsDrawer({ role, onClose, onRetry }: RoleDetailsDrawerProps) {
  const failed = role?.status === "Failed";
  const created = role?.status === "Created";
  const syncing = role?.status === "Syncing";
  const detail = role ? roleDetail(role.status, role.sapName, role.retried, role.id, role.allSettled) : "";
  const tr = role ? transportNumber(role.id, role.status, role.allSettled) : "";
  const progressState: StepCardState = failed ? "required" : created || syncing ? "done" : "waiting";
  const transportState: StepCardState = failed ? "waiting" : created || syncing ? "done" : "locked";

  return (
    <Drawer
      opened={role !== null}
      onClose={onClose}
      size="lg"
      header={
        role ? (
          <div className="flex w-full flex-col gap-s8">
            <div className="flex w-full items-start justify-between gap-s12">
              <h2
                className="m-0 min-w-0 flex-1 text-heading-h2 text-strong"
                style={{ fontFamily: "var(--font-family-heading-h2)" }}
              >
                {role.label}
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
            <div className="flex items-center gap-s8">
              <span
                className="text-l2 text-body"
                style={{ fontFamily: "var(--font-family-lato-regular)", lineHeight: "var(--font-line-height-label-l1)" }}
              >
                {role.sapName}
              </span>
              <Badge size="md" variant={badgeVariant(role.status)}>
                {badgeLabel(role.status)}
              </Badge>
            </div>
            {failed ? (
              <Alert type="info" compact showTitle={false}>
                This role failed. Other roles are not affected.
              </Alert>
            ) : null}
          </div>
        ) : null
      }
      footer={
        role ? (
          <DrawerFooterSummary
            label={failed ? "What happens next" : "Role"}
            result={
              failed
                ? "Retry calls the SAP API again for this role only."
                : created
                  ? "This role is created and synced."
                  : "SAP is still creating this role."
            }
            status={failed ? "warning" : created ? "success" : "secondary"}
            statusLabel={
              failed ? "Not created yet: SAP API authorisation error" : created ? "Created" : "In progress"
            }
            linkLabel={failed ? "View error log" : undefined}
            linkHref={failed ? "#role-error" : undefined}
            secondaryLabel="Close"
            onSecondaryClick={onClose}
            primaryLabel={failed ? "Retry" : undefined}
            onPrimaryClick={
              failed
                ? () => {
                    onRetry(role.id);
                  }
                : undefined
            }
          />
        ) : null
      }
    >
      {role ? (
        <div className="flex flex-col gap-s12 p-s20">
          <StepCard
            step={1}
            title="Check progress"
            state={progressState}
            stateLabel={failed ? "Stopped at Creating" : created || syncing ? "Done" : "In progress"}
          >
            <ProgressTrack stage={trackStage(role.status)} />
          </StepCard>
          <StepCard
            step={2}
            title="Check transport request"
            state={transportState}
            stateLabel={failed ? "Not created yet" : created || syncing ? "Done" : "Not created yet"}
          >
            <p
              className="m-0 text-l2 text-body"
              style={{ fontFamily: "var(--font-family-lato-regular)", lineHeight: "var(--font-line-height-label-l1)" }}
            >
              {created || syncing
                ? `Transport request ${tr} is assigned.`
                : "A TR number appears after Profile and TR."}
            </p>
          </StepCard>
          {failed ? (
            <div id="role-error">
              <StepCard step={3} title="Read the error" state="error" stateLabel="Error">
                <p
                  className="m-0 text-l2 text-body"
                  style={{
                    fontFamily: "var(--font-family-lato-regular)",
                    lineHeight: "var(--font-line-height-label-l1)",
                  }}
                >
                  {detail}
                </p>
                <p
                  className="m-0 text-l2 text-body"
                  style={{
                    fontFamily: "var(--font-family-lato-regular)",
                    lineHeight: "var(--font-line-height-label-l1)",
                  }}
                >
                  The technical user has no permission to create roles in SAP DEV. Ask the security team, then retry.
                </p>
              </StepCard>
            </div>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
