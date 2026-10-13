"use client";

import { activitiesFile } from "@/mock";
import { Alert } from "@/ds/Alert";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Checkbox } from "@/ds/Checkbox";
import { Drawer } from "@/ds/Drawer";
import { DrawerFooterSummary } from "@/ds/DrawerFooterSummary";
import { IconClose } from "@/ds/icons";
import { SegmentedControl } from "@/ds/SegmentedControl";
import { StepCard } from "@/ds/StepCard";
import { TagsField } from "@/ds/TagsField";
import { TextArea } from "@/ds/TextArea";
import { TextField } from "@/ds/TextField";
import { useMemo, useState } from "react";
import {
  activityActs,
  authById,
  catalogueTcodes,
  tcodeById,
  type ActivityDraft,
  type OrgDraft,
} from "./activityEdit";

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
        <Badge size="sm" variant="light">
          {badge}
        </Badge>
      </div>
    </div>
  );
}

export function EditTcodeDrawer({
  tcodeId,
  draft,
  onClose,
  onSave,
}: {
  tcodeId: string | null;
  draft: ActivityDraft;
  onClose: () => void;
  onSave: (tcodeId: string, objectIds: string[]) => void;
}) {
  const tcode = tcodeId ? tcodeById(tcodeId) : undefined;
  const initial = tcodeId ? (draft.tcodeObjects[tcodeId] ?? []) : [];
  const [selected, setSelected] = useState(initial);
  const opened = tcodeId !== null && tcode !== undefined;

  function toggle(id: string, checked: boolean) {
    setSelected((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      size="lg"
      header={
        opened ? (
          <DrawerHeading
            title={`Edit ${tcode.code}`}
            detail={tcode.description}
            badge={tcode.manual ? "Added manually" : "Pre-filled"}
            onClose={onClose}
          />
        ) : null
      }
      footer={
        opened ? (
          <DrawerFooterSummary
            result={`${selected.length} authorization objects stay on ${tcode.code}.`}
            comparison="Sample data. Changes apply to this designation only."
            status={selected.length > 0 ? "success" : "warning"}
            statusLabel={selected.length > 0 ? "Ready to save" : "Pick at least one object"}
            linkLabel="Reset to SAP default"
            linkHref="#reset-tcode"
            onLinkClick={() => setSelected(initial)}
            secondaryLabel="Cancel"
            onSecondaryClick={onClose}
            primaryLabel="Save"
            primaryDisabled={selected.length === 0}
            onPrimaryClick={() => onSave(tcode.id, selected)}
          />
        ) : null
      }
    >
      {opened ? (
        <div className="flex flex-col gap-s16">
          <Alert type="info" title="What to do here">
            Tick the authorization objects this T-code should keep. Sample data.
          </Alert>
          <StepCard step={1} title="Authorization objects" state={selected.length > 0 ? "done" : "required"}>
            <div className="flex flex-col gap-s8">
              {draft.authObjectIds.map((id) => {
                const object = authById(id);
                return (
                  <Checkbox
                    key={id}
                    size="sm"
                    checked={selected.includes(id)}
                    label={object ? `${object.name} · ${object.description}` : id}
                    onChange={(checked) => toggle(id, checked)}
                  />
                );
              })}
            </div>
          </StepCard>
        </div>
      ) : null}
    </Drawer>
  );
}

type PasteRow = { code: string; kind: "valid" | "already" | "missing" };

function classifyPaste(text: string, existing: string[]): PasteRow[] {
  const tokens = text
    .split(/[\s,;]+/)
    .map((item) => item.trim().toUpperCase())
    .filter((item) => item.length > 0);
  const unique = [...new Set(tokens)];
  return unique.map((code) => {
    const known = catalogueTcodes().find((item) => item.code.toUpperCase() === code);
    if (!known) {
      return { code, kind: "missing" };
    }
    if (existing.some((id) => (tcodeById(id)?.code ?? id).toUpperCase() === code)) {
      return { code, kind: "already" };
    }
    return { code, kind: "valid" };
  });
}

export function AddTcodesDrawer({
  opened,
  mode,
  draft,
  onClose,
  onAdd,
}: {
  opened: boolean;
  mode: "search" | "paste";
  draft: ActivityDraft;
  onClose: () => void;
  onAdd: (ids: string[]) => void;
}) {
  const [panel, setPanel] = useState(mode);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [paste, setPaste] = useState("");
  const [checked, setChecked] = useState<PasteRow[] | null>(null);

  const available = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalogueTcodes().filter((item) => {
      if (draft.tcodeIds.includes(item.id)) {
        return false;
      }
      if (needle.length === 0) {
        return true;
      }
      return item.code.toLowerCase().includes(needle) || item.description.toLowerCase().includes(needle);
    });
  }, [draft.tcodeIds, query]);

  const validIds = (checked ?? [])
    .filter((row) => row.kind === "valid")
    .map((row) => catalogueTcodes().find((item) => item.code.toUpperCase() === row.code)?.id)
    .filter((id): id is string => Boolean(id));

  const adding = panel === "paste" ? validIds : picked;
  const already = (checked ?? []).filter((row) => row.kind === "already").length;
  const missing = (checked ?? []).filter((row) => row.kind === "missing").length;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      size="lg"
      header={
        <DrawerHeading
          title="Add T-codes"
          detail="Search SAP or paste a list. Sample data."
          badge={`${draft.tcodeIds.length} T-codes`}
          onClose={onClose}
        />
      }
      footer={
        <DrawerFooterSummary
          result={
            adding.length === 1 ? "1 T-code will be added." : `${adding.length} T-codes will be added.`
          }
          status={adding.length > 0 ? "success" : "secondary"}
          statusLabel={adding.length > 0 ? "Ready to add" : "Nothing to add yet"}
          linkLabel="Clear list"
          linkHref="#clear-tcodes"
          onLinkClick={() => {
            setPicked([]);
            setPaste("");
            setChecked(null);
          }}
          secondaryLabel="Cancel"
          onSecondaryClick={onClose}
          primaryLabel={adding.length === 1 ? "Add 1 T-code" : `Add ${adding.length} T-codes`}
          primaryDisabled={adding.length === 0}
          onPrimaryClick={() => onAdd(adding)}
        />
      }
    >
      <div className="flex flex-col gap-s16">
        <Alert type="info" title="What to do here">
          Add T-codes that are not already on this activity. Unknown codes are skipped.
        </Alert>
        <StepCard step={1} title="Choose T-codes" state={adding.length > 0 || paste.trim().length > 0 ? "done" : "required"}>
          <div className="flex flex-col gap-s12">
            <SegmentedControl
              aria-label="Add mode"
              value={panel}
              onChange={(value) => setPanel(value === "paste" ? "paste" : "search")}
              data={[
                { value: "search", label: "Search" },
                { value: "paste", label: "Paste list" },
              ]}
            />
            {panel === "search" ? (
              <>
                <TextField type="search" placeholder="Search T-codes" value={query} clearable onChange={setQuery} />
                <div className="flex max-h-s96 flex-col gap-s8 overflow-auto" style={{ maxHeight: "calc(var(--space-s96) * 3)" }}>
                  {available.slice(0, 12).map((item) => (
                    <Checkbox
                      key={item.id}
                      size="sm"
                      checked={picked.includes(item.id)}
                      label={`${item.code} · ${item.description}`}
                      onChange={(next) =>
                        setPicked((current) =>
                          next ? [...current, item.id] : current.filter((id) => id !== item.id),
                        )
                      }
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <TextArea
                  label="Paste list"
                  placeholder="FB60, FB65, F110"
                  value={paste}
                  onChange={(value) => {
                    setPaste(value);
                    setChecked(null);
                  }}
                />
                <Button variant="secondary" size="sm" onClick={() => setChecked(classifyPaste(paste, draft.tcodeIds))}>
                  Validate
                </Button>
              </>
            )}
          </div>
        </StepCard>
        {panel === "paste" && checked ? (
          <StepCard step={2} title="Check results" state={validIds.length > 0 ? "done" : "waiting"}>
            <div className="flex flex-col gap-s8">
              <p className="m-0 text-l2 text-body">Valid ({validIds.length})</p>
              <p className="m-0 text-l2 text-body">Already in activity ({already})</p>
              <p className="m-0 text-l2 text-body">Not found in SAP ({missing})</p>
            </div>
          </StepCard>
        ) : null}
      </div>
    </Drawer>
  );
}

export function EditAuthDrawer({
  objectId,
  draft,
  onClose,
  onSave,
}: {
  objectId: string | null;
  draft: ActivityDraft;
  onClose: () => void;
  onSave: (objectId: string, activities: string[], status: "Maintained" | "Changed" | "Manual") => void;
}) {
  const object = objectId ? authById(objectId) : undefined;
  const initial = objectId ? (draft.authActivities[objectId] ?? ["01", "02", "03"]) : [];
  const [selected, setSelected] = useState(initial);
  const [freeValue, setFreeValue] = useState("");
  const manual = object?.status === "Manual" || draft.authStatus[objectId ?? ""] === "Manual";
  const wildcard = selected.includes("*");
  const opened = objectId !== null && object !== undefined;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      size="lg"
      header={
        opened ? (
          <DrawerHeading
            title={object.name}
            detail={`${object.class} · ${object.description}`}
            badge={draft.authStatus[object.id] ?? object.status}
            onClose={onClose}
          />
        ) : null
      }
      footer={
        opened ? (
          <DrawerFooterSummary
            result={
              manual
                ? "Free-entry values will be stored on this object."
                : `${selected.filter((item) => item !== "*").length} activities selected.`
            }
            comparison="Sample data."
            status={wildcard ? "warning" : "success"}
            statusLabel={wildcard ? "Higher risk" : "Ready to save"}
            linkLabel="Reset to SAP default"
            linkHref="#reset-auth"
            onLinkClick={() => {
              setSelected(["01", "02", "03"]);
              setFreeValue("");
            }}
            secondaryLabel="Cancel"
            onSecondaryClick={onClose}
            primaryLabel="Save"
            onPrimaryClick={() =>
              onSave(object.id, manual && freeValue.trim() ? [...selected, freeValue.trim()] : selected, wildcard || manual ? "Changed" : "Maintained")
            }
          />
        ) : null
      }
    >
      {opened ? (
        <div className="flex flex-col gap-s16">
          <Alert type="info" title="What to do here">
            {manual
              ? "This object accepts a free-entry value. Sample data."
              : "Choose the activities this authorization object allows. Sample data."}
          </Alert>
          <StepCard step={1} title={manual ? "Free entry" : "Activities"} state="required">
            {manual ? (
              <TextField label="Field value" value={freeValue} onChange={setFreeValue} placeholder="Enter a value" />
            ) : (
              <div className="flex flex-col gap-s8">
                {activityActs.map((act) => (
                  <Checkbox
                    key={act}
                    size="sm"
                    checked={selected.includes(act)}
                    label={act === "*" ? "* All activities" : `Activity ${act}`}
                    onChange={(checked) =>
                      setSelected((current) =>
                        checked ? [...current, act] : current.filter((item) => item !== act),
                      )
                    }
                  />
                ))}
                {wildcard ? (
                  <Alert type="warning" title="Higher-risk activity" showTitle>
                    Wildcard activity grants every activity. Confirm only if that is intended.
                  </Alert>
                ) : null}
              </div>
            )}
          </StepCard>
        </div>
      ) : null}
    </Drawer>
  );
}

export function AddAuthDrawer({
  opened,
  draft,
  onClose,
  onAdd,
}: {
  opened: boolean;
  draft: ActivityDraft;
  onClose: () => void;
  onAdd: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const matches = activitiesFile.authObjects.filter((item) => {
    if (draft.authObjectIds.includes(item.id)) {
      return false;
    }
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) {
      return true;
    }
    return item.name.toLowerCase().includes(needle) || item.description.toLowerCase().includes(needle);
  });

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      size="lg"
      header={
        <DrawerHeading title="Add object" detail="Search SAP authorization objects." badge="Manual" onClose={onClose} />
      }
      footer={
        <DrawerFooterSummary
          result={chosen ? `${chosen} will be added as Manual.` : "Choose one object."}
          status={chosen ? "success" : "secondary"}
          statusLabel={chosen ? "Ready to add" : "No object chosen"}
          linkLabel="Clear"
          linkHref="#clear-object"
          onLinkClick={() => {
            setChosen(null);
            setQuery("");
          }}
          secondaryLabel="Cancel"
          onSecondaryClick={onClose}
          primaryLabel="Add object"
          primaryDisabled={!chosen}
          onPrimaryClick={() => {
            if (chosen) {
              onAdd(chosen);
            }
          }}
        />
      }
    >
      <div className="flex flex-col gap-s16">
        <Alert type="info" title="What to do here">
          Pick an authorization object that is not already on this activity.
        </Alert>
        <StepCard step={1} title="Search" state={query.trim().length > 0 ? "done" : "required"}>
          <TextField type="search" placeholder="Search SAP auth objects" value={query} clearable onChange={setQuery} />
        </StepCard>
        <StepCard step={2} title="Choose an object" state={chosen ? "done" : "waiting"}>
          <div className="flex flex-col gap-s8">
            {matches.slice(0, 8).map((item) => (
              <Checkbox
                key={item.id}
                size="sm"
                checked={chosen === item.id}
                label={`${item.name} · ${item.description}`}
                onChange={(next) => setChosen(next ? item.id : null)}
              />
            ))}
          </div>
        </StepCard>
      </div>
    </Drawer>
  );
}

export function EditOrgDrawer({
  level,
  onClose,
  onSave,
}: {
  level: OrgDraft | null;
  onClose: () => void;
  onSave: (level: OrgDraft) => void;
}) {
  const [values, setValues] = useState(level?.values ?? []);
  const [mode, setMode] = useState<"values" | "open" | "wildcard">(
    level?.state === "wildcard" ? "wildcard" : level?.state === "open" ? "open" : "values",
  );
  const [confirmed, setConfirmed] = useState(false);
  const plants = level?.id === "WERKS";
  const opened = level !== null;

  function save() {
    if (!level) {
      return;
    }
    if (mode === "open") {
      onSave({ ...level, state: "open", values: [] });
      return;
    }
    if (mode === "wildcard") {
      onSave({ ...level, state: "wildcard", values: ["*"] });
      return;
    }
    onSave({ ...level, state: "values", values });
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      size="lg"
      header={
        opened ? (
          <DrawerHeading
            title={`${level.name} (${level.id})`}
            detail="Org level values for this designation. Sample data."
            badge={mode === "open" ? "Open" : mode === "wildcard" ? "Wildcard" : "Maintained"}
            onClose={onClose}
          />
        ) : null
      }
      footer={
        opened ? (
          <DrawerFooterSummary
            result={
              mode === "open"
                ? `${level.name} stays open.`
                : mode === "wildcard"
                  ? `${level.name} will allow every value.`
                  : `${values.length} values selected.`
            }
            status={mode === "wildcard" || mode === "open" ? "warning" : "success"}
            statusLabel={
              mode === "wildcard" ? "Higher risk" : mode === "open" ? "Open level" : "Ready to save"
            }
            linkLabel="Reset to previous values"
            linkHref="#reset-org"
            onLinkClick={() => {
              setValues(level.values);
              setConfirmed(false);
            }}
            secondaryLabel="Cancel"
            onSecondaryClick={onClose}
            primaryLabel="Save"
            primaryDisabled={mode === "wildcard" && !confirmed}
            onPrimaryClick={save}
          />
        ) : null
      }
    >
      {opened ? (
        <div className="flex flex-col gap-s16">
          <Alert type="info" title="What to do here">
            Set values, leave the level open, or allow every value. Open levels block Create later.
          </Alert>
          <StepCard step={1} title="Values" state="required">
            <div className="flex flex-col gap-s12">
              <SegmentedControl
                aria-label="Org level mode"
                value={mode}
                onChange={(value) => {
                  if (value === "open" || value === "wildcard" || value === "values") {
                    setMode(value);
                    setConfirmed(false);
                  }
                }}
                data={[
                  { value: "values", label: "Set values" },
                  { value: "open", label: "Leave open" },
                  { value: "wildcard", label: "Wildcard" },
                ]}
              />
              {mode === "values" && plants ? (
                <>
                  <TagsField label="Selected plants" value={values} onChange={setValues} />
                  {activitiesFile.plants.map((plant) => (
                    <Checkbox
                      key={plant.value}
                      size="sm"
                      checked={values.includes(plant.value)}
                      label={`${plant.value} ${plant.label}${plant.sample ? " (sample data)" : ""}`}
                      onChange={(checked) =>
                        setValues((current) =>
                          checked ? [...current, plant.value] : current.filter((item) => item !== plant.value),
                        )
                      }
                    />
                  ))}
                </>
              ) : null}
              {mode === "values" && !plants ? (
                <TagsField
                  label={`${level.name} values`}
                  placeholder="Add a value"
                  value={values}
                  onChange={setValues}
                />
              ) : null}
              {mode === "wildcard" ? (
                <Alert type="warning" title="Wildcard confirm">
                  <span className="flex flex-col gap-s8">
                    <span>Allowing every value is higher risk. Sample data.</span>
                    <Checkbox
                      size="sm"
                      checked={confirmed}
                      label="I confirm this is intended"
                      onChange={setConfirmed}
                    />
                  </span>
                </Alert>
              ) : null}
            </div>
          </StepCard>
        </div>
      ) : null}
    </Drawer>
  );
}

