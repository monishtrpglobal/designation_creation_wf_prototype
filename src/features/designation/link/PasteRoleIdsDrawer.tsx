"use client";

import { Alert } from "@/ds/Alert";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Drawer } from "@/ds/Drawer";
import { DrawerFooterSummary } from "@/ds/DrawerFooterSummary";
import { IconClose } from "@/ds/icons";
import { Link } from "@/ds/Link";
import { StepCard } from "@/ds/StepCard";
import { TextArea } from "@/ds/TextArea";
import { useEffect, useMemo, useState } from "react";
import { parseRoleIdPaste, type PasteRole, type PasteRow } from "./linkView";

const labelL2 = {
  fontFamily: "var(--font-family-lato-regular)",
} as const;

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="xs" aria-label="Close Paste role IDs" onClick={onClick} leftIcon={<IconClose size="s16" />}>
      Close
    </Button>
  );
}

function ResultLine({ row }: { row: PasteRow }) {
  const variant =
    row.kind === "matched" ? "completed" : row.kind === "validated" ? "pending" : row.kind === "too-long" ? "warning" : "error";
  const label =
    row.kind === "matched"
      ? "Matched"
      : row.kind === "too-long"
        ? "Too long"
        : row.kind === "validated"
          ? "Validated"
          : row.kind === "duplicate"
            ? "Duplicate"
            : row.kind === "empty"
              ? "Incomplete"
              : "Not found";
  return (
    <div className="flex flex-wrap items-center gap-s8">
      <Badge size="sm" variant={variant}>
        {label}
      </Badge>
      <span className="text-l2 text-body" style={labelL2}>
        {row.kind === "matched" ? row.label : row.detail}
      </span>
    </div>
  );
}

export function PasteRoleIdsDrawer({
  opened,
  text,
  roles,
  onTextChange,
  onClose,
  onApply,
  onImport,
  autoCheck = false,
}: {
  opened: boolean;
  text: string;
  roles: PasteRole[];
  onTextChange: (value: string) => void;
  onClose: () => void;
  onApply: (rows: PasteRow[]) => void;
  onImport: () => void;
  autoCheck?: boolean;
}) {
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    if (autoCheck) {
      setChecked(true);
    }
  }, [autoCheck, text]);
  const rows = useMemo(() => (checked ? parseRoleIdPaste(text, roles) : []), [checked, text, roles]);
  const matched = rows.filter((row) => row.kind === "matched" && row.roleId);
  const problems = rows.filter((row) => row.kind !== "matched");

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      size="lg"
      header={
        opened ? (
          <div className="flex w-full flex-col gap-s8">
            <div className="flex items-center justify-between gap-s12">
              <h2 className="m-0 text-heading-h2 text-strong" style={{ fontFamily: "var(--font-family-heading-h2)" }}>
                Paste role IDs
              </h2>
              <CloseButton onClick={onClose} />
            </div>
            <span className="text-l2 text-body" style={labelL2}>
              Applies to the new roles you list
            </span>
          </div>
        ) : null
      }
      footer={
        opened ? (
          <DrawerFooterSummary
            result={
              matched.length > 0
                ? `${matched.length} role ${matched.length === 1 ? "ID" : "IDs"} will be applied. ${problems.length} ${problems.length === 1 ? "row needs" : "rows need"} fixing.`
                : "No role IDs are ready to apply."
            }
            comparison="Only matched rows are applied. Problem rows stay listed so you can fix them."
            status={matched.length > 0 ? "success" : "warning"}
            statusLabel={matched.length > 0 ? "Ready to apply" : "Save is off: no matched role IDs"}
            linkLabel="Clear list"
            linkHref="#clear-role-ids"
            onLinkClick={() => {
              onTextChange("");
              setChecked(false);
            }}
            secondaryLabel="Cancel"
            onSecondaryClick={onClose}
            primaryLabel={matched.length === 1 ? "Apply 1 role ID" : `Apply ${matched.length} role IDs`}
            primaryDisabled={matched.length === 0}
            onPrimaryClick={() => onApply(matched)}
          />
        ) : null
      }
    >
      {opened ? (
        <div className="flex flex-col gap-s16">
          <Alert type="info" title="What to paste">
            Paste two columns from Excel or a CSV: role name, then SAP role ID. Separate the columns with a tab or a comma.
          </Alert>
          <StepCard
            step={1}
            title="Paste your list"
            state={text.trim().length > 0 ? "done" : "required"}
            stateLabel={checked ? `${rows.length} entered` : "0 entered"}
          >
            <div className="flex flex-col gap-s12">
              <TextArea
                label="Role names and SAP role IDs"
                value={text}
                onChange={(value) => {
                  onTextChange(value);
                  setChecked(false);
                }}
              />
              <Link
                href="#import-csv"
                onClick={(event) => {
                  event.preventDefault();
                  onImport();
                }}
              >
                Import a CSV file instead
              </Link>
              <Button variant="secondary" size="sm" onClick={() => setChecked(true)}>
                Check the result
              </Button>
            </div>
          </StepCard>
          <StepCard
            step={2}
            title="Check the result"
            state={matched.length > 0 ? "done" : checked ? "waiting" : "required"}
            stateLabel={matched.length > 0 ? `${matched.length} matched` : checked ? "Check values" : "Required"}
          >
            <div className="flex flex-col gap-s8">
              {rows.map((row, index) => (
                <ResultLine key={`${row.label}-${index}`} row={row} />
              ))}
              {!checked ? (
                <p className="m-0 text-l2 text-body" style={labelL2}>
                  Press Check the result to sort matched rows from rows that need fixing.
                </p>
              ) : null}
            </div>
          </StepCard>
        </div>
      ) : null}
    </Drawer>
  );
}
