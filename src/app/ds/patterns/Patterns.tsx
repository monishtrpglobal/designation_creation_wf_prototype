"use client";

import { useState } from "react";
import { Button } from "@/ds/Button";
import { Dialog, type DialogSize } from "@/ds/Dialog";
import { Drawer, type DrawerSize } from "@/ds/Drawer";
import { DrawerFooterSummary, type DrawerFooterStatus } from "@/ds/DrawerFooterSummary";
import { IconClose } from "@/ds/icons";
import { StepCard, type StepCardState } from "@/ds/StepCard";

const drawerSizes: DrawerSize[] = ["sm", "md", "lg", "xl"];
const dialogSizes: DialogSize[] = ["sm", "md", "lg"];
const stepStates: StepCardState[] = ["done", "waiting", "required", "locked", "error"];
const footerStatuses: DrawerFooterStatus[] = ["success", "warning", "secondary"];

const stepCopy: Record<StepCardState, string> = {
  done: "Role IDs are entered and checked.",
  waiting: "Waiting for the previous step to finish.",
  required: "Enter a role ID before this step can run.",
  locked: "This step stays locked until the requirement is sent.",
  error: "SAP returned an error for this role.",
};

const statusCopy: Record<DrawerFooterStatus, string> = {
  success: "Ready to save",
  warning: "Higher-risk activity selected",
  secondary: "No changes yet",
};

function DrawerHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-start gap-s8">
      <h2 className="m-0 flex-1 text-heading-h2 text-body">{title}</h2>
      <Button variant="ghost" size="xs" aria-label="Close" onClick={onClose}>
        <IconClose size="s16" />
      </Button>
    </div>
  );
}

function ScrollSample() {
  return (
    <div className="grid gap-s16 p-s20">
      {stepStates.map((state, index) => (
        <StepCard key={state} step={index + 1} title={`Step ${index + 1}`} state={state}>
          <p className="m-0">{stepCopy[state]}</p>
        </StepCard>
      ))}
      {Array.from({ length: 6 }, (_, index) => (
        <p key={index} className="m-0">
          Extra drawer body line {index + 1}. This text is sample data so the body can scroll
          while the header and footer stay in place.
        </p>
      ))}
    </div>
  );
}

export function Patterns() {
  const [drawerSize, setDrawerSize] = useState<DrawerSize | null>(null);
  const [dialogSize, setDialogSize] = useState<DialogSize | null>(null);

  return (
    <main className="grid gap-s32 bg-canvas p-s24 text-body">
      <h1 className="m-0 text-heading-h2 text-strong">Patterns</h1>

      <section className="grid gap-s16">
        <h2 className="m-0 text-label-l1 text-strong">Drawer</h2>
        <div className="flex flex-wrap gap-s12">
          {drawerSizes.map((size) => (
            <Button key={size} variant="secondary" size="md" onClick={() => setDrawerSize(size)}>
              {`Open ${size.toUpperCase()}`}
            </Button>
          ))}
        </div>
      </section>

      <section className="grid max-w-[var(--size-drawer-lg)] gap-s16">
        <h2 className="m-0 text-label-l1 text-strong">Drawer footer summary</h2>
        {footerStatuses.map((status) => (
          <div key={status} className="bg-surface-raised p-s16">
            <DrawerFooterSummary
              result="This role can change, display, post and delete accounting documents in 7 company codes."
              comparison="Compared with SAP default: added Post, Delete."
              status={status}
              statusLabel={statusCopy[status]}
              linkLabel="Reset to SAP default"
              linkHref="#reset"
              secondaryLabel="Cancel"
              primaryLabel="Save"
            />
          </div>
        ))}
      </section>

      <section className="grid max-w-[var(--size-drawer-lg)] gap-s16">
        <h2 className="m-0 text-label-l1 text-strong">Step card</h2>
        {stepStates.map((state, index) => (
          <StepCard key={state} step={index + 1} title="Enter the role ID" state={state}>
            <p className="m-0">{stepCopy[state]}</p>
          </StepCard>
        ))}
      </section>

      <section className="grid gap-s16">
        <h2 className="m-0 text-label-l1 text-strong">Dialog</h2>
        <div className="flex flex-wrap gap-s12">
          {dialogSizes.map((size) => (
            <Button key={size} variant="secondary" size="md" onClick={() => setDialogSize(size)}>
              {`Open ${size.toUpperCase()}`}
            </Button>
          ))}
        </div>
      </section>

      <Drawer
        opened={drawerSize !== null}
        size={drawerSize ?? "lg"}
        onClose={() => setDrawerSize(null)}
        header={
          <DrawerHeader
            title={drawerSize === "xl" ? "License optimization report" : "Accounting document: company code"}
            onClose={() => setDrawerSize(null)}
          />
        }
        footer={
          <DrawerFooterSummary
            result="This role can change, display, post and delete accounting documents in 7 company codes."
            comparison="Compared with SAP default: added Post, Delete."
            status="success"
            statusLabel="Ready to save"
            linkLabel="Reset to SAP default"
            linkHref="#reset"
            secondaryLabel="Cancel"
            onSecondaryClick={() => setDrawerSize(null)}
            primaryLabel="Save"
            onPrimaryClick={() => setDrawerSize(null)}
          />
        }
      >
        <ScrollSample />
      </Drawer>

      <Dialog
        opened={dialogSize !== null}
        size={dialogSize ?? "md"}
        onClose={() => setDialogSize(null)}
        header={<DrawerHeader title="View details" onClose={() => setDialogSize(null)} />}
        footer={
          <div className="flex justify-end gap-s12">
            <Button variant="secondary" size="md" onClick={() => setDialogSize(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={() => setDialogSize(null)}>
              Close
            </Button>
          </div>
        }
      >
        {Array.from({ length: 24 }, (_, index) => (
          <p key={index} className="m-0 mb-s12">
            Dialog body line {index + 1}. This is sample data so the body scrolls while the header
            and footer stay fixed.
          </p>
        ))}
      </Dialog>
    </main>
  );
}
