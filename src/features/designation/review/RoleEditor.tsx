"use client";

import { roleEditorFile } from "@/mock";
import type { AuthClass } from "@/mock";
import { Accordion, AccordionItem } from "@/ds/Accordion";
import { Alert } from "@/ds/Alert";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Checkbox } from "@/ds/Checkbox";
import { Link } from "@/ds/Link";
import { Pagination } from "@/ds/Pagination";
import { RowMenu } from "@/ds/RowMenu";
import { Table, type TableColumn } from "@/ds/Table";
import { Tabs } from "@/ds/Tabs";
import { TextField } from "@/ds/TextField";
import { Tooltip } from "@/ds/Tooltip";
import { emptyRoleEditor } from "@/state/flowStore";
import type { OrgValue, RoleEditorOverride } from "@/state/model";
import { useMemo, useState } from "react";
import {
  AddAuthDrawer,
  AddTcodesDrawer,
  AuthChecklistDrawer,
  AuthRangeDrawer,
  DeleteAuthDialog,
  EditTcodeDrawer,
  OrgLevelDrawer,
  bump,
} from "./RoleEditorDrawers";
import {
  authBadgeVariant,
  changeCount,
  isRevenueRole,
  orgRows,
  orgStatus,
  orgValueLabels,
  summaryLabel,
  visibleAuth,
  visibleTcodes,
  type EditorTab,
  type OrgEditorRow,
} from "./roleEditorView";

const labelL2 = {
  fontFamily: "var(--font-family-lato-regular)",
  lineHeight: "var(--font-line-height-label-l1)",
} as const;

type RoleEditorProps = {
  roleId: string;
  roleLabel: string;
  sapName: string;
  expanded: boolean;
  tab: EditorTab;
  onExpandedChange: (open: boolean) => void;
  onTabChange: (tab: EditorTab) => void;
  orgLevels: Record<string, OrgValue>;
  editor: RoleEditorOverride;
  locked: boolean;
  showOpenWarning: boolean;
  onOrgSave: (levelId: string, value: OrgValue) => void;
  onEditor: (recipe: (current: RoleEditorOverride) => RoleEditorOverride) => void;
};

function ValueChips({ values, empty }: { values: string[]; empty: string }) {
  if (values.length === 0) {
    return <span className="text-l2 text-body" style={labelL2}>{empty}</span>;
  }
  const shown = values.slice(0, 4);
  const rest = values.slice(4);
  return (
    <span className="flex flex-wrap items-center gap-s4">
      {shown.map((value) => (
        <Badge key={value} size="sm" variant="light">{value}</Badge>
      ))}
      {rest.length > 0 ? (
        <Tooltip label={rest.join(", ")}>
          <span className="text-l2 text-body" style={labelL2}>{`+${rest.length}`}</span>
        </Tooltip>
      ) : null}
    </span>
  );
}

export function RoleEditor({
  roleId,
  roleLabel,
  sapName,
  expanded,
  tab,
  onExpandedChange,
  onTabChange,
  orgLevels,
  editor,
  locked,
  showOpenWarning,
  onOrgSave,
  onEditor,
}: RoleEditorProps) {
  const tcodes = visibleTcodes(roleId, editor);
  const auth = visibleAuth(roleId, editor);
  const orgs = orgRows(roleId, orgLevels);
  const openIds = orgs.filter((row) => row.value.kind === "open").map((row) => row.id);
  const summary = summaryLabel(tcodes.length, auth.length, orgs.length);
  const changes = changeCount(roleId, editor);
  const [tcodeQuery, setTcodeQuery] = useState("");
  const [authQuery, setAuthQuery] = useState("");
  const [authClass, setAuthClass] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedTcodes, setSelectedTcodes] = useState<string[]>([]);
  const [dismissTcodeAlert, setDismissTcodeAlert] = useState(false);
  const [dismissAuthAlert, setDismissAuthAlert] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [authId, setAuthId] = useState<string | null>(null);
  const [tcodeId, setTcodeId] = useState<string | null>(null);
  const [addTcodes, setAddTcodes] = useState(false);
  const [addAuth, setAddAuth] = useState(false);
  const [deleteName, setDeleteName] = useState<string | null>(null);

  const filteredTcodes = tcodes.filter((row) => {
    const needle = tcodeQuery.trim().toLowerCase();
    if (!needle) {
      return true;
    }
    return `${row.code} ${row.description}`.toLowerCase().includes(needle);
  });

  const filteredAuth = auth.filter((row) => {
    if (authClass !== "all" && row.class !== authClass) {
      return false;
    }
    const needle = authQuery.trim().toLowerCase();
    if (!needle) {
      return true;
    }
    return `${row.name} ${row.description} ${row.fields}`.toLowerCase().includes(needle);
  });
  const pageCount = Math.max(1, Math.ceil(filteredAuth.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filteredAuth.slice((safePage - 1) * pageSize, safePage * pageSize);
  const classCounts = useMemo(() => {
    const counts: Record<string, number> = { all: auth.length };
    for (const row of auth) {
      counts[row.class] = (counts[row.class] ?? 0) + 1;
    }
    return counts;
  }, [auth]);

  const orgRow = orgs.find((row) => row.id === orgId) ?? null;
  const authRow = auth.find((row) => row.id === authId) ?? null;
  const defaultActivities = roleEditorFile.defaultActivities[authId ?? ""] ?? roleEditorFile.defaultActivities.F_BKPF_BUK ?? [];
  const activitySelection = authId ? (editor.authActivities[authId] ?? defaultActivities) : defaultActivities;
  const rangeInitial = authId
    ? {
        ...(editor.authRanges[authId] ?? roleEditorFile.defaultRange),
        activities: editor.authActivities[authId] ?? roleEditorFile.defaultActivities.F_KNA1_GRP ?? ["02", "03"],
      }
    : { ...roleEditorFile.defaultRange, activities: ["02", "03"] };
  const tcodeInitial = tcodeId
    ? (editor.tcodeObjects[tcodeId] ?? roleEditorFile.va02Objects.filter((item) => item.id !== "V_KONH_VKO").map((item) => item.id))
    : [];

  function openOrg(id: string) {
    setOrgId(id);
  }

  const orgColumns: TableColumn<OrgEditorRow>[] = [
    {
      key: "level",
      label: "Org level",
      width: "220px",
      render: (row) => (
        <span className="flex flex-col">
          <span className="text-l2 text-body" style={labelL2}>{row.name}</span>
          <span className="text-l2 text-body" style={labelL2}>{row.id}</span>
        </span>
      ),
    },
    {
      key: "values",
      label: "Values",
      render: (row) => <ValueChips values={orgValueLabels(row.value)} empty="Not set" />,
    },
    {
      key: "used",
      label: "Used by",
      width: "120px",
      render: (row) => <span className="text-l2 text-body" style={labelL2}>{`${row.fields} fields`}</span>,
    },
    {
      key: "status",
      label: "Status",
      width: "140px",
      render: (row) => {
        const status = orgStatus(row.value);
        return <Badge size="sm" variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      key: "actions",
      label: "Actions",
      width: "120px",
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <Link href={`#org-${row.id}`} onClick={(event) => { event.preventDefault(); openOrg(row.id); }}>
            {row.value.kind === "open" ? "Set values" : "Edit"}
          </Link>
        </span>
      ),
    },
  ];

  return (
    <div id="review-org-levels">
      <Accordion
        variant="filled"
        chevron="right"
        value={expanded ? "auth" : null}
        onChange={(value) => onExpandedChange(value === "auth")}
      >
        <AccordionItem
          value="auth"
          label={expanded ? `T-codes & auth values — ${summary}` : "T-codes & auth values (pre-filled)"}
          badge={
            expanded ? (
              changes > 0 ? (
                <span className="text-l2" style={{ ...labelL2, color: "var(--color-text-link)" }}>
                  {`Edited · ${changes} changes`}
                </span>
              ) : null
            ) : (
              <Badge variant="light">{summary}</Badge>
            )
          }
          badge2={
            !expanded ? (
              showOpenWarning && openIds.length > 0 ? (
                <Badge variant="warning">{`${openIds.length} open`}</Badge>
              ) : (
                <Badge variant="completed">All set</Badge>
              )
            ) : null
          }
        >
          <div className="flex flex-col gap-s16">
            {showOpenWarning && openIds.length > 0 ? (
              <Alert type="warning" title="Org levels are open">
                {`${openIds.length} org levels are open (controlling area and plant). Create stays locked until they are set.`}
              </Alert>
            ) : null}
            {tab === "tcodes" && isRevenueRole(roleId) && !dismissTcodeAlert ? (
              <Alert
                type="info"
                title="T-codes added"
                dismissible
                onDismiss={() => setDismissTcodeAlert(true)}
                action={
                  <Button variant="secondary" size="xs" onClick={() => onTabChange("authorizations")}>
                    Review
                  </Button>
                }
              >
                3 T-codes added. 7 new auth objects proposed from SU24 defaults. Review them. Sample data.
              </Alert>
            ) : null}
            {tab === "authorizations" && isRevenueRole(roleId) && !dismissAuthAlert ? (
              <Alert
                type="info"
                title="New auth objects proposed"
                dismissible
                onDismiss={() => setDismissAuthAlert(true)}
                action={
                  <Button variant="secondary" size="xs" onClick={() => setAuthQuery("new")}>
                    Review
                  </Button>
                }
              >
                7 new auth objects proposed. Applied from SU24 defaults for the T-codes you added. Review the ones tagged New.
              </Alert>
            ) : null}
            <Tabs
              variant="underline"
              value={tab}
              onChange={(value) => onTabChange((value as EditorTab) ?? "tcodes")}
              showPanels={false}
              items={[
                { value: "tcodes", label: "T-codes", count: <Badge size="sm" variant="light">{tcodes.length}</Badge> },
                { value: "authorizations", label: "Authorizations", count: <Badge size="sm" variant="light">{auth.length}</Badge> },
                {
                  value: "org",
                  label: "Org levels",
                  count: (
                    <Badge size="sm" variant={openIds.length > 0 ? "warning" : "light"}>
                      {openIds.length > 0 ? `${orgs.length} · ${openIds.length} open` : orgs.length}
                    </Badge>
                  ),
                },
              ]}
            />
            {tab === "org" ? (
              <Table columns={orgColumns} rows={orgs} getRowKey={(row) => row.id} onRowClick={(row) => openOrg(row.id)} />
            ) : null}
            {tab === "tcodes" ? (
              <div className="flex flex-col gap-s12">
                <div className="flex flex-wrap items-end gap-s12">
                  <div className="min-w-0 flex-1">
                    <TextField type="search" placeholder="Search T-codes" value={tcodeQuery} onChange={setTcodeQuery} />
                  </div>
                  <Button variant="secondary" size="sm" disabled={locked} onClick={() => setAddTcodes(true)}>
                    Add T-code
                  </Button>
                  <Button variant="ghost" size="sm" disabled={locked} onClick={() => setAddTcodes(true)}>
                    Paste list
                  </Button>
                </div>
                <Table
                  columns={tcodeColumns(selectedTcodes, filteredTcodes.map((row) => row.id), setSelectedTcodes, locked, setTcodeId, (id) =>
                    onEditor((current) => bump({ ...current, removedTcodeIds: [...current.removedTcodeIds, id] })),
                  )}
                  rows={filteredTcodes}
                  getRowKey={(row) => row.id}
                  onRowClick={(row) => setTcodeId(row.id)}
                />
              </div>
            ) : null}
            {tab === "authorizations" ? (
              <div className="flex flex-col gap-s12">
                <div className="flex flex-wrap items-center justify-between gap-s12">
                  <div className="min-w-0 flex-1">
                    <TextField type="search" placeholder="Search auth objects or fields" value={authQuery} onChange={setAuthQuery} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={locked}
                    onClick={() => onEditor(() => emptyRoleEditor())}
                  >
                    Reset to pre-filled
                  </Button>
                  <Button variant="secondary" size="sm" disabled={locked} onClick={() => setAddAuth(true)}>
                    Add object manually
                  </Button>
                </div>
                <Tabs
                  variant="pill"
                  showPanels={false}
                  value={authClass}
                  onChange={(value) => {
                    setAuthClass(value ?? "all");
                    setPage(1);
                  }}
                  items={["all", "AAAB", "FI", "SD", "CO", "BC"].map((value) => ({
                    value,
                    label: value === "all" ? "All" : value,
                    count: <Badge size="sm" variant="light">{classCounts[value] ?? 0}</Badge>,
                  }))}
                />
                <Table
                  columns={authColumns(locked, setAuthId, (row, active) => {
                    onEditor((current) =>
                      bump({
                        ...current,
                        inactiveAuthIds: active
                          ? current.inactiveAuthIds.filter((id) => id !== row.id)
                          : [...current.inactiveAuthIds, row.id],
                      }),
                    );
                  }, setDeleteName)}
                  rows={pageRows}
                  getRowKey={(row) => row.id}
                  onRowClick={(row) => setAuthId(row.id)}
                />
                <Pagination
                  page={safePage}
                  total={filteredAuth.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                  range={`${filteredAuth.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredAuth.length)} of ${filteredAuth.length}`}
                />
              </div>
            ) : null}
          </div>
        </AccordionItem>
      </Accordion>

      <OrgLevelDrawer
        key={orgId ?? "org-closed"}
        row={orgRow}
        onClose={() => setOrgId(null)}
        onShowFields={() => onTabChange("authorizations")}
        onSave={(levelId, value) => {
          onOrgSave(levelId, value);
          onEditor((current) => bump(current));
          setOrgId(null);
        }}
      />
      {authRow?.editor === "range" ? (
        <AuthRangeDrawer
          key={authId ?? "range-closed"}
          objectId={authId}
          objectName={authRow.description}
          detail={`${authRow.name} · Financial Accounting`}
          initial={rangeInitial}
          onClose={() => setAuthId(null)}
          onSave={(value) => {
            if (!authId) {
              return;
            }
            onEditor((current) =>
              bump({
                ...current,
                authActivities: { ...current.authActivities, [authId]: value.activities },
                authRanges: { ...current.authRanges, [authId]: { mode: value.mode, from: value.from, to: value.to } },
              }),
            );
            setAuthId(null);
          }}
        />
      ) : (
        <AuthChecklistDrawer
          key={authId ?? "check-closed"}
          objectId={authRow ? authId : null}
          objectName={authRow?.description ?? ""}
          detail={authRow ? `${authRow.name} · ${authRow.class}` : ""}
          badge={authRow?.status ?? "Standard"}
          initial={activitySelection}
          changed={Boolean(authId && editor.authActivities[authId])}
          onClose={() => setAuthId(null)}
          onReset={() => {
            if (!authId) {
              return;
            }
            onEditor((current) => {
              const authActivities = { ...current.authActivities };
              delete authActivities[authId];
              return { ...current, authActivities };
            });
          }}
          onEditOrg={() => {
            setAuthId(null);
            onTabChange("org");
            onExpandedChange(true);
          }}
          onSave={(activityIds) => {
            if (!authId) {
              return;
            }
            onEditor((current) =>
              bump({ ...current, authActivities: { ...current.authActivities, [authId]: activityIds } }),
            );
            setAuthId(null);
          }}
        />
      )}
      <EditTcodeDrawer
        key={tcodeId ?? "tcode-closed"}
        tcodeId={tcodeId}
        initial={tcodeInitial}
        onClose={() => setTcodeId(null)}
        onSave={(objectIds) => {
          if (!tcodeId) {
            return;
          }
          onEditor((current) => bump({ ...current, tcodeObjects: { ...current.tcodeObjects, [tcodeId]: objectIds } }));
          setTcodeId(null);
        }}
      />
      <AddTcodesDrawer
        opened={addTcodes}
        roleName={sapName || roleLabel}
        existing={tcodes.map((row) => row.code)}
        onClose={() => setAddTcodes(false)}
        onAdd={(codes) => {
          onEditor((current) =>
            bump({
              ...current,
              addedTcodeIds: [...current.addedTcodeIds, ...codes.filter((code) => !current.addedTcodeIds.includes(code))],
            }),
          );
          setAddTcodes(false);
        }}
      />
      <AddAuthDrawer
        opened={addAuth}
        onClose={() => setAddAuth(false)}
        onAdd={(value) => {
          onEditor((current) => bump({ ...current, addedAuth: [...current.addedAuth, value] }));
          setAddAuth(false);
        }}
      />
      <DeleteAuthDialog
        name={deleteName}
        onClose={() => setDeleteName(null)}
        onConfirm={() => {
          if (!deleteName) {
            return;
          }
          onEditor((current) =>
            bump({
              ...current,
              removedAuthIds: [...current.removedAuthIds, deleteName],
              addedAuth: current.addedAuth.filter((item) => item.id !== deleteName),
            }),
          );
          setDeleteName(null);
        }}
      />
    </div>
  );
}

function tcodeColumns(
  selected: string[],
  visibleIds: string[],
  setSelected: (ids: string[]) => void,
  locked: boolean,
  onEdit: (id: string) => void,
  onRemove: (id: string) => void,
): TableColumn<{ id: string; code: string; description: string; manual: boolean; authCount: number }>[] {
  const allChecked = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  return [
    {
      key: "select",
      width: "48px",
      label: (
        <Checkbox
          aria-label="Select all T-codes"
          size="sm"
          checked={allChecked}
          onChange={(checked) => setSelected(checked ? visibleIds : [])}
        />
      ),
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <Checkbox
            aria-label={`Select ${row.code}`}
            size="sm"
            checked={selected.includes(row.id)}
            onChange={(checked) =>
              setSelected(checked ? [...selected, row.id] : selected.filter((id) => id !== row.id))
            }
          />
        </span>
      ),
    },
    { key: "code", label: "T-code", sortable: true, width: "120px", render: (row) => row.code },
    { key: "description", label: "Description", render: (row) => row.description },
    {
      key: "source",
      label: "Source",
      width: "160px",
      render: (row) => (
        <Badge size="sm" variant={row.manual ? "outline" : "light"}>
          {row.manual ? "Added manually" : "Pre-filled"}
        </Badge>
      ),
    },
    {
      key: "auth",
      label: "Auth objects",
      width: "140px",
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <Link href={`#tcode-${row.id}`} onClick={(event) => { event.preventDefault(); onEdit(row.id); }}>
            {`${row.authCount} objects`}
          </Link>
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "120px",
      render: (row) => (
        <span className="flex items-center gap-s8" onClick={(event) => event.stopPropagation()}>
          <Link href={`#edit-${row.id}`} onClick={(event) => { event.preventDefault(); onEdit(row.id); }}>
            Edit
          </Link>
          <RowMenu
            label={`Actions for ${row.code}`}
            items={[{ label: "Remove T-code", disabled: locked, onClick: () => onRemove(row.id) }]}
          />
        </span>
      ),
    },
  ];
}

function authColumns(
  locked: boolean,
  onEdit: (id: string) => void,
  onActive: (row: { id: string; status: string }, active: boolean) => void,
  onDelete: (id: string) => void,
): TableColumn<{ id: string; name: string; class: AuthClass; fields: string; status: string; isNew: boolean }>[] {
  return [
    { key: "object", label: "Object", sortable: true, width: "160px", render: (row) => (
      <span className="flex items-center gap-s8">
        <span>{row.name}</span>
        {row.isNew ? <Badge size="sm" variant="info">New</Badge> : null}
      </span>
    ) },
    { key: "class", label: "Class", width: "80px", render: (row) => row.class },
    { key: "fields", label: "Fields summary", render: (row) => row.fields },
    {
      key: "status",
      label: "Status",
      sortable: true,
      width: "140px",
      render: (row) => (
        <Badge size="sm" variant={authBadgeVariant(row.status as "Standard")}>{row.status}</Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "140px",
      render: (row) => {
        const inactive = row.status === "Inactive";
        const manual = row.status === "Manual";
        return (
          <span className="flex items-center gap-s8" onClick={(event) => event.stopPropagation()}>
            <Link href={`#auth-${row.id}`} onClick={(event) => { event.preventDefault(); onEdit(row.id); }}>
              Edit
            </Link>
            <RowMenu
              label={`Actions for ${row.name}`}
              items={[
                {
                  label: inactive ? "Activate" : "Deactivate",
                  disabled: locked,
                  onClick: () => onActive(row, inactive),
                },
                ...(manual ? [{ label: "Delete", disabled: locked, onClick: () => onDelete(row.id) }] : []),
              ]}
            />
          </span>
        );
      },
    },
  ];
}
