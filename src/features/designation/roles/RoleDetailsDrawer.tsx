"use client";

import { Alert } from "@/ds/Alert";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Drawer } from "@/ds/Drawer";
import { DrawerFooterSummary } from "@/ds/DrawerFooterSummary";
import { IconClose } from "@/ds/icons";
import { ProgressTrack } from "@/ds/Progress";
import { StepCard } from "@/ds/StepCard";
import type { RoleRuntimeStatus } from "@/state/model";
import { badgeLabel, badgeVariant, roleDetail, sampleTr } from "./rolesView";

export type RoleDrawerTarget = {
  id: string;
  label: string;
  sapName: string;
  status: RoleRuntimeStatus;
  retried: boolean;
};

type RoleDetailsDrawerProps = {
  role: RoleDrawerTarget | null;
  onClose: () => void;
  onRetry: (roleId: string) => void;
};

export function RoleDetailsDrawer({ role, onClose, onRetry }: RoleDetailsDrawerProps) {
  const failed = role?.status === "Failed";
  const created = role?.status === "Created";
  const detail = role ? roleDetail(role.status, role.sapName, role.retried) : "";

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
              <Alert type="error" compact showTitle={false}>
                Role failed. {detail}
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
                ? "Retry creates this role again. Roles that already exist are left as they are."
                : created
                  ? "This role is created and synced."
                  : "SAP is still creating this role."
            }
            status={failed ? "warning" : created ? "success" : "secondary"}
            statusLabel={failed ? "Creation failed" : created ? "Created" : "In progress"}
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
          <StepCard step={1} title="Check progress" state={failed ? "error" : created ? "done" : "waiting"}>
            <ProgressTrack stage={failed ? "error" : created ? "synced" : "creating"} />
          </StepCard>
          <StepCard
            step={2}
            title="Check transport request"
            state={created ? "done" : failed ? "waiting" : "locked"}
          >
            <p
              className="m-0 text-l2 text-body"
              style={{ fontFamily: "var(--font-family-lato-regular)", lineHeight: "var(--font-line-height-label-l1)" }}
            >
              {created
                ? `Transport request ${sampleTr} is assigned.`
                : "No transport request was created."}
            </p>
          </StepCard>
          {failed ? (
            <div id="role-error">
              <StepCard step={3} title="Read the error" state="error">
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
                  SAP rejected the create call. Retry this role only. Created roles are never re-created.
                </p>
              </StepCard>
            </div>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
