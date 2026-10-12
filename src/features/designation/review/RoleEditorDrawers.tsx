"use client";

import { activitiesFile, roleEditorFile } from "@/mock";
import type { AuthClass } from "@/mock";
import { Alert } from "@/ds/Alert";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Checkbox } from "@/ds/Checkbox";
import { Dialog } from "@/ds/Dialog";
import { Drawer } from "@/ds/Drawer";
import { DrawerFooterSummary } from "@/ds/DrawerFooterSummary";
import { IconClose } from "@/ds/icons";
import { Link } from "@/ds/Link";
import { SegmentedControl } from "@/ds/SegmentedControl";
import { Select } from "@/ds/Select";
import { StepCard } from "@/ds/StepCard";
import { TagsField } from "@/ds/TagsField";
import { TextArea } from "@/ds/TextArea";
import { TextField } from "@/ds/TextField";
import { Tooltip } from "@/ds/Tooltip";
import type { OrgValue, RoleEditorOverride } from "@/state/model";
import { useMemo, useState } from "react";
import { classifyPaste, tcodeByCode, type OrgEditorRow } from "./roleEditorView";

function CloseButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="xs" aria-label={label} onClick={onClick} leftIcon={<IconClose size="s16" />}>
      Close
    </Button>
  );
}

function DrawerHeading({
  title,
  detail,
  badge,
  onClose,
}: {
  title: string;
  detail: string;
  badge: string;
  onClose: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-s8">
      <div className="flex items-center justify-between gap-s12">
        <h2 className="m-0 text-heading-h2 text-strong" style={{ fontFamily: "var(--font-family-heading-h2)" }}>
          {title}
        </h2>
        <CloseButton label={`Close ${title}`} onClick={onClose} />
      </div>
      <div className="flex items-center justify-between gap-s12">
        <span className="text-l2 text-body" style={{ fontFamily: "var(--font-family-lato-regular)" }}>
          {detail}
        </span>
        <Badge size="sm" variant={badge === "Open" ? "warning" : badge === "Changed" ? "dot" : "light"}>
          {badge}
        </Badge>
      </div>
    </div>
  );
}

function sameList(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

export function OrgLevelDrawer({
  row,
  onClose,
  onSave,
  onShowFields,
}: {
  row: OrgEditorRow | null;
  onClose: () => void;
  onSave: (levelId: string, value: OrgValue) => void;
  onShowFields: () => void;
}) {
  const opened = row !== null;
  const storedValues = row && (row.value.kind === "values" || row.value.kind === "wildcard") ? row.value.values : [];
  const [selected, setSelected] = useState<string[]>(storedValues.length > 0 ? storedValues : row?.id === "WERKS" ? ["1000", "2000"] : []);
  const [query, setQuery] = useState("");
  const [rangeMode, setRangeMode] = useState(row?.value.kind === "range");
  const [from, setFrom] = useState(row?.value.kind === "range" ? row.value.from : "");
  const [to, setTo] = useState(row?.value.kind === "range" ? row.value.to : "");
  const [wildcardConfirm, setWildcardConfirm] = useState(false);
  const plants = activitiesFile.plants;
  const allPlants = selected.includes("*");
  const visiblePlants = plants.filter((plant) => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return true;
    }
    return `${plant.value} ${plant.label}`.toLowerCase().includes(needle);
  });
  const wildcard = allPlants || selected.includes("*");
  const plantReady = rangeMode
    ? from.trim().length > 0 && to.trim().length > 0
    : allPlants
      ? wildcardConfirm
      : selected.filter((item) => item !== "*").length > 0;
  const ready = row?.id === "WERKS"
    ? plantReady
    : rangeMode
      ? from.trim().length > 0 && to.trim().length > 0
      : selected.length > 0 && (!wildcard || wildcardConfirm);

  function togglePlant(value: string, checked: boolean) {
    setSelected((current) => {
      const withoutStar = current.filter((item) => item !== "*");
      if (value === "*") {
        return checked ? ["*"] : [];
      }
      if (!checked) {
        return withoutStar.filter((item) => item !== value);
      }
      return [...withoutStar, value];
    });
  }

  function save() {
    if (!row) {
      return;
    }
    if (rangeMode) {
      onSave(row.id, { kind: "range", from: from.trim(), to: to.trim() });
      return;
    }
    if (selected.includes("*")) {
      onSave(row.id, { kind: "wildcard", values: ["*"] });
      return;
    }
    onSave(row.id, { kind: "values", values: selected });
  }

  const result = row?.id === "WERKS"
    ? allPlants
      ? "This role can work in every plant."
      : `This role can work in plants ${selected.filter((item) => item !== "*").join(" and ")}.`
    : rangeMode
      ? `${row?.name ?? "Org level"} is set to ${from}–${to}.`
      : `${row?.name ?? "Org level"} is set to ${selected.join(", ") || "nothing"}.`;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      size="lg"
      header={
        row ? (
          <DrawerHeading
            title={row.name}
            detail={`${row.id} · Organizational level`}
            badge={row.value.kind === "open" ? "Open" : "Maintained"}
            onClose={onClose}
          />
        ) : null
      }
      footer={
        row ? (
          <DrawerFooterSummary
            result={result}
            comparison="Sample data. 2 fields were overridden on their own object and will not change."
            status={ready ? "success" : "warning"}
            statusLabel={ready ? "Ready to save" : wildcard && !wildcardConfirm ? "Save is off: confirm the wildcard" : "Save is off: choose a value"}
            linkLabel="Reset to previous values"
            linkHref="#reset-org"
            onLinkClick={() => {
              setSelected(storedValues.length > 0 ? storedValues : row.id === "WERKS" ? ["1000", "2000"] : []);
              setRangeMode(row.value.kind === "range");
              setWildcardConfirm(false);
            }}
            secondaryLabel="Cancel"
            onSecondaryClick={onClose}
            primaryLabel="Save"
            primaryDisabled={!ready}
            onPrimaryClick={save}
          />
        ) : null
      }
    >
      {row?.id === "WERKS" ? (
        <div className="flex flex-col gap-s16">
          <Alert type="info" title="What to do here">
            Choose the plants this role works in, then press Save.
          </Alert>
          <StepCard step={1} title="Choose the plants" state={selected.length > 0 || rangeMode ? "done" : "required"} stateLabel={allPlants ? "All plants" : `${selected.length} selected`}>
            <div className="flex flex-col gap-s12">
              <div className="flex flex-wrap gap-s8">
                {selected.filter((item) => item !== "*").map((value) => (
                  <Badge key={value} size="sm" variant="light">
                    {value}
                  </Badge>
                ))}
              </div>
              <TextField type="search" placeholder="Search plants" value={query} onChange={setQuery} />
              {visiblePlants.map((plant) => (
                <Checkbox
                  key={plant.value}
                  size="sm"
                  checked={!allPlants && selected.includes(plant.value)}
                  disabled={allPlants}
                  label={`${plant.value} ${plant.label} (sample)`}
                  onChange={(checked) => togglePlant(plant.value, checked)}
                />
              ))}
              <div className="flex items-center justify-between gap-s12">
                <Checkbox size="sm" checked={allPlants} label="* All plants" onChange={(checked) => togglePlant("*", checked)} />
                <Badge size="sm" variant="warning">Wildcard</Badge>
              </div>
              <Link href="#org-range" onClick={(event) => { event.preventDefault(); setRangeMode((value) => !value); }}>
                Enter a range or pattern instead
              </Link>
              {rangeMode ? (
                <div className="grid grid-cols-2 gap-s12">
                  <TextField label="From" value={from} onChange={setFrom} />
                  <TextField label="To" value={to} onChange={setTo} />
                </div>
              ) : null}
              {allPlants ? (
                <Checkbox
                  size="sm"
                  checked={wildcardConfirm}
                  label="I understand * includes every plant, including ones added later."
                  onChange={setWildcardConfirm}
                />
              ) : null}
            </div>
          </StepCard>
          <Alert type="info" title="Where this is used">
            Applies to {row.fields} fields in 7 authorization objects.{" "}
            <Link href="#org-fields" onClick={(event) => { event.preventDefault(); onShowFields(); }}>
              Show fields
            </Link>
          </Alert>
        </div>
      ) : row ? (
        <div className="flex flex-col gap-s16">
          <Alert type={row.value.kind === "open" ? "warning" : "info"} title="What to do here">
            Set the values for {row.name}. Sample data. Open levels keep Create locked.
          </Alert>
          <StepCard step={1} title={`Set ${row.name}`} state={ready ? "done" : "required"} stateLabel={ready ? "Set" : "Required"}>
            <div className="flex flex-col gap-s12">
              <TagsField label="Values" value={selected.filter((item) => item !== "*")} onChange={setSelected} />
              <Link href="#org-range" onClick={(event) => { event.preventDefault(); setRangeMode((value) => !value); }}>
                Enter a range or pattern instead
              </Link>
              {rangeMode ? (
                <div className="grid grid-cols-2 gap-s12">
                  <TextField label="From" value={from} onChange={setFrom} />
                  <TextField label="To" value={to} onChange={setTo} />
                </div>
              ) : null}
              <Checkbox size="sm" checked={selected.includes("*")} label="Use * (wildcard)" onChange={(checked) => setSelected(checked ? ["*"] : [])} />
              {selected.includes("*") ? (
                <Checkbox size="sm" checked={wildcardConfirm} label="Confirm this wildcard before saving." onChange={setWildcardConfirm} />
              ) : null}
            </div>
          </StepCard>
        </div>
      ) : null}
    </Drawer>
  );
}

const checklistActivities = roleEditorFile.activities.F_BKPF_BUK ?? [];

export function AuthChecklistDrawer({
  objectId,
  objectName,
  detail,
  badge,
  initial,
  changed,
  onClose,
  onSave,
  onReset,
  onEditOrg,
}: {
  objectId: string | null;
  objectName: string;
  detail: string;
  badge: string;
  initial: string[];
  changed: boolean;
  onClose: () => void;
  onSave: (activityIds: string[]) => void;
  onReset: () => void;
  onEditOrg: () => void;
}) {
  const [selected, setSelected] = useState(initial);
  const higher = selected.some((id) => id === "06" || id === "85" || id === "*");
  const dirty = !sameList([...selected].sort(), [...initial].sort());
  const chips = roleEditorFile.bukrsOverride;
  const shown = chips.slice(0, 4);
  const rest = chips.slice(4);

  return (
    <Drawer
      opened={objectId !== null}
      onClose={onClose}
      size="lg"
      header={
        objectId ? (
          <DrawerHeading title={objectName} detail={detail} badge={badge} onClose={onClose} />
        ) : null
      }
      footer={
        objectId ? (
          <DrawerFooterSummary
            result={`This role can use ${selected.length} activities on ${objectId}.`}
            comparison={changed || dirty ? "Compared with SAP default: values were changed. Sample data." : "Same as SAP default."}
            status={dirty ? "success" : "secondary"}
            statusLabel={dirty ? "Ready to save" : "Save is off: nothing has changed yet"}
            linkLabel="Reset to SAP default"
            linkHref="#reset-auth"
            onLinkClick={() => {
              setSelected(roleEditorFile.defaultActivities.F_BKPF_BUK ?? []);
              onReset();
            }}
            secondaryLabel="Cancel"
            onSecondaryClick={onClose}
            primaryLabel="Save"
            primaryDisabled={!dirty}
            onPrimaryClick={() => onSave(selected)}
          />
        ) : null
      }
    >
      {objectId ? (
        <div className="flex flex-col gap-s16">
          <Alert type="info" title="What to do here">
            Tick the activities this role needs, then press Save.
          </Alert>
          <StepCard step={1} title="Choose what this role can do" state="done" stateLabel={`${selected.length} selected`}>
            <div className="flex flex-col gap-s8">
              <p className="m-0 text-l2 text-body" style={{ fontFamily: "var(--font-family-lato-regular)" }}>
                Activity · ACTVT. SAP defaults are pre-ticked.
              </p>
              {checklistActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between gap-s12">
                  <Checkbox
                    size="sm"
                    checked={selected.includes(activity.id)}
                    label={`${activity.id} ${activity.label} — ${activity.detail}`}
                    onChange={(checked) =>
                      setSelected((current) =>
                        checked ? [...current, activity.id] : current.filter((item) => item !== activity.id),
                      )
                    }
                  />
                  {activity.badge ? (
                    <Badge size="sm" variant={activity.badge === "Higher risk" || activity.badge === "Wildcard" ? "warning" : "light"}>
                      {activity.badge}
                    </Badge>
                  ) : null}
                </div>
              ))}
            </div>
          </StepCard>
          {higher ? (
            <Alert type="warning" title="Higher-risk activity selected">
              The risk simulation later checks it for conflicts.
            </Alert>
          ) : null}
          <Alert type="info" title="Company code">
            Company code BUKRS is set in Org levels, so you cannot change it here.{" "}
            <Link href="#edit-org" onClick={(event) => { event.preventDefault(); onEditOrg(); }}>
              Edit in Org levels
            </Link>
            <span className="mt-s8 flex flex-wrap items-center gap-s4">
              {shown.map((value) => (
                <Badge key={value} size="sm" variant="light">{value}</Badge>
              ))}
              {rest.length > 0 ? (
                <Tooltip label={rest.join(", ")}>
                  <span className="text-l2 text-body">+{rest.length} more</span>
                </Tooltip>
              ) : null}
            </span>
          </Alert>
        </div>
      ) : null}
    </Drawer>
  );
}

export function AuthRangeDrawer({
  objectId,
  objectName,
  detail,
  initial,
  onClose,
  onSave,
}: {
  objectId: string | null;
  objectName: string;
  detail: string;
  initial: { mode: "one" | "range" | "all"; from: string; to: string; activities: string[] };
  onClose: () => void;
  onSave: (value: { mode: "one" | "range" | "all"; from: string; to: string; activities: string[] }) => void;
}) {
  const [activities, setActivities] = useState(initial.activities);
  const [mode, setMode] = useState(initial.mode);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const dirty = mode !== initial.mode || from !== initial.from || to !== initial.to || !sameList(activities, initial.activities);
  const rangeReady = mode !== "range" || (from.trim().length > 0 && to.trim().length > 0);

  return (
    <Drawer
      opened={objectId !== null}
      onClose={onClose}
      size="lg"
      header={objectId ? <DrawerHeading title={objectName} detail={detail} badge="Maintained" onClose={onClose} /> : null}
      footer={
        objectId ? (
          <DrawerFooterSummary
            result={
              mode === "all"
                ? "This role can display customer master records in every account group."
                : `This role can display customer master records in account groups ${from} to ${to}.`
            }
            comparison="Same as SAP default until you change a value. Sample data."
            status={dirty && rangeReady ? "success" : "secondary"}
            statusLabel={dirty && rangeReady ? "Ready to save" : "Save is off: nothing has changed yet"}
            linkLabel="Reset to SAP default"
            linkHref="#reset-range"
            onLinkClick={() => {
              setActivities(initial.activities);
              setMode(initial.mode);
              setFrom(initial.from);
              setTo(initial.to);
            }}
            secondaryLabel="Cancel"
            onSecondaryClick={onClose}
            primaryLabel="Save"
            primaryDisabled={!dirty || !rangeReady}
            onPrimaryClick={() => onSave({ mode, from, to, activities })}
          />
        ) : null
      }
    >
      {objectId ? (
        <div className="flex flex-col gap-s16">
          <Alert type="info" title="What to do here">
            Tick the activities, then choose the account groups.
          </Alert>
          <StepCard step={1} title="Choose what this role can do" state="done" stateLabel={`${activities.length} selected`}>
            <div className="flex flex-col gap-s8">
              {[
                { id: "02", label: "Change", detail: "Change customer master records", badge: "SAP default" },
                { id: "03", label: "Display", detail: "View customer master records", badge: "SAP default" },
              ].map((activity) => (
                <div key={activity.id} className="flex items-center justify-between gap-s12">
                  <Checkbox
                    size="sm"
                    checked={activities.includes(activity.id)}
                    label={`${activity.id} ${activity.label} — ${activity.detail}`}
                    onChange={(checked) =>
                      setActivities((current) =>
                        checked ? [...current, activity.id] : current.filter((item) => item !== activity.id),
                      )
                    }
                  />
                  <Badge size="sm" variant="light">{activity.badge}</Badge>
                </div>
              ))}
            </div>
          </StepCard>
          <StepCard step={2} title="Choose which customer account groups" state={rangeReady ? "done" : "required"} stateLabel={mode === "range" ? "Set" : mode}>
            <div className="flex flex-col gap-s12">
              <p className="m-0 text-l2 text-body" style={{ fontFamily: "var(--font-family-lato-regular)" }}>
                Customer account group · KTOKD. Up to 4 characters per value.
              </p>
              <SegmentedControl
                aria-label="Account group mode"
                value={mode}
                onChange={(value) => setMode(value as "one" | "range" | "all")}
                data={[
                  { value: "one", label: "One value" },
                  { value: "range", label: "Range" },
                  { value: "all", label: "Everything (*)" },
                ]}
              />
              {mode === "range" ? (
                <div className="grid grid-cols-2 gap-s12">
                  <TextField label="From" value={from} onChange={setFrom} />
                  <TextField label="To" value={to} onChange={setTo} />
                </div>
              ) : null}
              {mode === "one" ? <TextField label="Value" value={from} onChange={setFrom} /> : null}
            </div>
          </StepCard>
        </div>
      ) : null}
    </Drawer>
  );
}

export function EditTcodeDrawer({
  tcodeId,
  initial,
  onClose,
  onSave,
}: {
  tcodeId: string | null;
  initial: string[];
  onClose: () => void;
  onSave: (objectIds: string[]) => void;
}) {
  const tcode = tcodeId ? tcodeByCode(tcodeId) : undefined;
  const choices = roleEditorFile.va02Objects;
  const [selected, setSelected] = useState(initial);
  const dirty = !sameList([...selected].sort(), [...initial].sort());

  return (
    <Drawer
      opened={tcodeId !== null && tcode !== undefined}
      onClose={onClose}
      size="lg"
      header={
        tcode ? (
          <DrawerHeading title={tcode.description} detail={`${tcode.code} · SAP transaction`} badge={tcode.manual ? "Added manually" : "Pre-filled"} onClose={onClose} />
        ) : null
      }
      footer={
        tcode ? (
          <DrawerFooterSummary
            result={`${tcode.code} stays in the role with ${selected.length} of ${choices.length} authorization objects active.`}
            comparison="Compared with SAP default: sample data."
            status={dirty && selected.length > 0 ? "success" : "secondary"}
            statusLabel={dirty ? "Ready to save" : "Save is off: nothing has changed yet"}
            linkLabel="Reset to SAP default"
            linkHref="#reset-tcode"
            onLinkClick={() => setSelected(initial)}
            secondaryLabel="Cancel"
            onSecondaryClick={onClose}
            primaryLabel="Save"
            primaryDisabled={!dirty || selected.length === 0}
            onPrimaryClick={() => onSave(selected)}
          />
        ) : null
      }
    >
      {tcode ? (
        <div className="flex flex-col gap-s16">
          <Alert type="info" title="What to do here">
            Choose which authorization objects this T-code brings in, then press Save.
          </Alert>
          <StepCard step={1} title="Choose the authorization objects for this T-code" state="done" stateLabel={`${selected.length} of ${choices.length} active`}>
            <div className="flex flex-col gap-s8">
              <p className="m-0 text-l2 text-body" style={{ fontFamily: "var(--font-family-lato-regular)" }}>
                SAP proposes these objects for {tcode.code} (SU24 defaults).
              </p>
              {choices.map((choice) => (
                <div key={choice.id} className="flex items-center justify-between gap-s12">
                  <Checkbox
                    size="sm"
                    checked={selected.includes(choice.id)}
                    disabled={choice.required}
                    label={`${choice.id} — ${choice.label}`}
                    onChange={(checked) =>
                      setSelected((current) =>
                        checked ? [...current, choice.id] : current.filter((item) => item !== choice.id),
                      )
                    }
                  />
                  {choice.required ? (
                    <Badge size="sm" variant="info">Required</Badge>
                  ) : choice.shared ? (
                    <Badge size="sm" variant="light">{choice.shared}</Badge>
                  ) : null}
                </div>
              ))}
              <p className="m-0 text-l2 text-body" style={{ fontFamily: "var(--font-family-lato-regular)" }}>
                Switching off a shared object changes it for the whole role.
              </p>
            </div>
          </StepCard>
        </div>
      ) : null}
    </Drawer>
  );
}

export function AddTcodesDrawer({
  opened,
  roleName,
  existing,
  onClose,
  onAdd,
}: {
  opened: boolean;
  roleName: string;
  existing: string[];
  onClose: () => void;
  onAdd: (codes: string[]) => void;
}) {
  const [text, setText] = useState("VA05 FBL5N MM03 XK02 ZZZY XK01");
  const [checked, setChecked] = useState(false);
  const rows = useMemo(() => (checked ? classifyPaste(text, existing) : []), [checked, text, existing]);
  const valid = rows.filter((row) => row.kind === "valid");
  const already = rows.filter((row) => row.kind === "already");
  const missing = rows.filter((row) => row.kind === "missing");

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      size="lg"
      header={
        opened ? (
          <DrawerHeading title="Add T-codes" detail={`${roleName} · ${existing.length} T-codes`} badge={`${existing.length} T-codes`} onClose={onClose} />
        ) : null
      }
      footer={
        opened ? (
          <DrawerFooterSummary
            result={
              valid.length > 0
                ? `Adds ${valid.length} T-codes (${valid.map((row) => row.code).join(", ")}). About 7 new authorization objects will be proposed.`
                : "No T-codes are ready to add."
            }
            comparison="Adding these T-codes proposes SU24 default authorizations. You will review them next."
            status={valid.length > 0 ? "success" : "warning"}
            statusLabel={valid.length > 0 ? "Ready to add" : "Save is off: validate a code that is not already on the role"}
            linkLabel="Clear list"
            linkHref="#clear-tcodes"
            onLinkClick={() => {
              setText("");
              setChecked(false);
            }}
            secondaryLabel="Cancel"
            onSecondaryClick={onClose}
            primaryLabel={valid.length === 1 ? "Add 1 T-code" : `Add ${valid.length} T-codes`}
            primaryDisabled={valid.length === 0}
            onPrimaryClick={() => onAdd(valid.map((row) => row.code))}
          />
        ) : null
      }
    >
      {opened ? (
        <div className="flex flex-col gap-s16">
          <Alert type="info" title="What to do here">
            Paste or search for T-codes, check the results, then add them.
          </Alert>
          <StepCard step={1} title="Paste or search T-codes" state={text.trim().length > 0 ? "done" : "required"} stateLabel={checked ? `${rows.length} entered` : "0 entered"}>
            <div className="flex flex-col gap-s12">
              <TextArea
                label="T-codes to check"
                value={text}
                onChange={(value) => {
                  setText(value);
                  setChecked(false);
                }}
              />
              <p className="m-0 text-l2 text-body" style={{ fontFamily: "var(--font-family-lato-regular)" }}>
                Separate with new lines, commas or spaces. Up to 100 per paste. Letters are made uppercase.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setChecked(true)}>
                Validate
              </Button>
            </div>
          </StepCard>
          <StepCard step={2} title="Review the check results" state={valid.length > 0 ? "done" : checked ? "waiting" : "required"} stateLabel={valid.length > 0 ? `${valid.length} ready to add` : "Waiting"}>
            <div className="flex flex-col gap-s8">
              {valid.length > 0 ? <ResultLine tone="completed" label={`Valid (${valid.length})`} codes={valid.map((row) => row.code)} /> : null}
              {already.length > 0 ? <ResultLine tone="warning" label={`Already in role (${already.length})`} codes={already.map((row) => row.code)} /> : null}
              {missing.length > 0 ? <ResultLine tone="error" label={`Not found in SAP (${missing.length})`} codes={missing.map((row) => row.code)} /> : null}
              {!checked ? (
                <p className="m-0 text-l2 text-body" style={{ fontFamily: "var(--font-family-lato-regular)" }}>
                  Press Validate to sort the list.
                </p>
              ) : null}
            </div>
          </StepCard>
        </div>
      ) : null}
    </Drawer>
  );
}

function ResultLine({ tone, label, codes }: { tone: "completed" | "warning" | "error"; label: string; codes: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-s8">
      <Badge size="sm" variant={tone}>{label}</Badge>
      <span className="text-l2 text-body" style={{ fontFamily: "var(--font-family-lato-regular)" }}>{codes.join(", ")}</span>
    </div>
  );
}

export function AddAuthDrawer({
  opened,
  onClose,
  onAdd,
}: {
  opened: boolean;
  onClose: () => void;
  onAdd: (value: { id: string; name: string; class: AuthClass; description: string }) => void;
}) {
  const [name, setName] = useState("Z_MANUAL_OBJ");
  const [authClass, setAuthClass] = useState<AuthClass>("FI");
  const [description, setDescription] = useState("Manual authorization (sample)");
  const ready = name.trim().length > 0;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      size="lg"
      header={opened ? <DrawerHeading title="Add object manually" detail="Sample data" badge="Manual" onClose={onClose} /> : null}
      footer={
        opened ? (
          <DrawerFooterSummary
            result={ready ? `${name.trim()} will be added as a manual object.` : "Enter an object name."}
            comparison="Manual objects can be deleted. Pre-filled objects can only be deactivated."
            status={ready ? "success" : "warning"}
            statusLabel={ready ? "Ready to save" : "Save is off: enter an object name"}
            secondaryLabel="Cancel"
            onSecondaryClick={onClose}
            primaryLabel="Add object"
            primaryDisabled={!ready}
            onPrimaryClick={() =>
              onAdd({ id: name.trim().toUpperCase(), name: name.trim().toUpperCase(), class: authClass, description })
            }
          />
        ) : null
      }
    >
      {opened ? (
        <div className="flex flex-col gap-s16">
          <TextField label="Object name" required value={name} onChange={setName} />
          <Select
            label="Class"
            data={[
              { value: "AAAB", label: "AAAB" },
              { value: "FI", label: "FI" },
              { value: "SD", label: "SD" },
              { value: "CO", label: "CO" },
              { value: "BC", label: "BC" },
            ]}
            value={authClass}
            onChange={(value) => setAuthClass((value as AuthClass) ?? "FI")}
          />
          <TextField label="Description" value={description} onChange={setDescription} />
        </div>
      ) : null}
    </Drawer>
  );
}

export function DeleteAuthDialog({
  name,
  onClose,
  onConfirm,
}: {
  name: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      opened={name !== null}
      onClose={onClose}
      variant="confirm"
      size="sm"
      header={
        <h2 className="m-0 text-heading-h2 text-body" style={{ fontFamily: "var(--font-family-heading-h2)" }}>
          {`Delete ${name ?? "object"}?`}
        </h2>
      }
      footer={
        <div className="flex items-center justify-end gap-s12">
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="warn" size="md" onClick={onConfirm}>Delete</Button>
        </div>
      }
    >
      <p className="m-0 text-body-b4 text-body" style={{ fontFamily: "var(--font-family-body-b4)" }}>
        Manual objects can be removed. This does not delete the object in SAP. Sample data.
      </p>
    </Dialog>
  );
}

export function bump(editor: RoleEditorOverride): RoleEditorOverride {
  return { ...editor, extraChanges: editor.extraChanges + 1 };
}
