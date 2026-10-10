"use client";

import type { Activity, AuthObjectStatus } from "@/mock";
import { Alert } from "@/ds/Alert";
import { Badge, type BadgeVariant } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Checkbox } from "@/ds/Checkbox";
import { Dialog } from "@/ds/Dialog";
import { IconClose } from "@/ds/icons";
import { Link } from "@/ds/Link";
import { Pagination } from "@/ds/Pagination";
import { RowMenu } from "@/ds/RowMenu";
import { Table, type SortState, type TableColumn } from "@/ds/Table";
import { Tabs } from "@/ds/Tabs";
import { TextField } from "@/ds/TextField";
import { useEffect, useMemo, useState } from "react";
import {
  AddAuthDrawer,
  AddTcodesDrawer,
  EditAuthDrawer,
  EditOrgDrawer,
  EditTcodeDrawer,
} from "./ActivityDrawers";
import {
  authById,
  cloneDraft,
  draftFromActivity,
  draftsEqual,
  openOrgCount,
  summaryLine,
  tcodeById,
  type ActivityDraft,
  type OrgDraft,
} from "./activityEdit";

const pageSizes = [10, 20, 50] as const;

type TabId = "tcodes" | "auth" | "org";

type TcodeRow = {
  id: string;
  code: string;
  description: string;
  manual: boolean;
  objects: number;
};

function sourceBadge(manual: boolean) {
  return manual ? (
    <Badge size="sm" variant="outline">
      Added manually
    </Badge>
  ) : (
    <Badge size="sm" variant="light">
      Pre-filled
    </Badge>
  );
}

function authVariant(status: AuthObjectStatus): BadgeVariant {
  switch (status) {
    case "Standard":
      return "light";
    case "Maintained":
      return "completed";
    case "Changed":
      return "dot";
    case "Manual":
      return "outline";
    case "Inactive":
      return "pending";
    default:
      return "light";
  }
}

function orgVariant(state: OrgDraft["state"]): BadgeVariant {
  if (state === "open" || state === "wildcard") {
    return "warning";
  }
  return "completed";
}

function orgLabel(state: OrgDraft["state"]) {
  if (state === "open") {
    return "Open";
  }
  if (state === "wildcard") {
    return "Wildcard";
  }
  return "Maintained";
}

function compareText(left: string, right: string, direction: SortState["direction"]) {
  const order = left.localeCompare(right);
  return direction === "asc" ? order : -order;
}

export function EditActivityDialog({
  opened,
  onClose,
  activity,
  saved,
  readOnly = false,
  onSave,
}: {
  opened: boolean;
  onClose: () => void;
  activity: Activity | null;
  saved?: ActivityDraft;
  readOnly?: boolean;
  onSave?: (activityId: string, draft: ActivityDraft) => void;
}) {
  const baseline = useMemo(
    () => (activity ? cloneDraft(saved ?? draftFromActivity(activity)) : null),
    [activity, saved],
  );
  const [draft, setDraft] = useState<ActivityDraft | null>(baseline);
  const [tab, setTab] = useState<TabId>("tcodes");
  const [query, setQuery] = useState("");
  const [authQuery, setAuthQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(pageSizes[0]);
  const [selected, setSelected] = useState<string[]>([]);
  const [sort, setSort] = useState<SortState | null>(null);
  const [removeArmed, setRemoveArmed] = useState(false);
  const [editTcodeId, setEditTcodeId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<"search" | "paste" | null>(null);
  const [editAuthId, setEditAuthId] = useState<string | null>(null);
  const [addAuth, setAddAuth] = useState(false);
  const [editOrg, setEditOrg] = useState<OrgDraft | null>(null);

  useEffect(() => {
    if (!opened || !baseline) {
      return;
    }
    setDraft(cloneDraft(baseline));
    setSelected([]);
    setRemoveArmed(false);
    setQuery("");
    setPage(1);
    setTab("tcodes");
  }, [opened, activity?.id, baseline]);

  const working = draft ?? baseline;

  function resetSession() {
    setDraft(baseline ? cloneDraft(baseline) : null);
    setSelected([]);
    setRemoveArmed(false);
    setQuery("");
    setPage(1);
    setTab("tcodes");
  }

  function close() {
    resetSession();
    onClose();
  }

  const dirty = working && baseline ? !draftsEqual(working, baseline) : false;
  const openCount = working ? openOrgCount(working) : 0;

  const rows = useMemo(() => {
    if (!working) {
      return [];
    }
    const needle = query.trim().toLowerCase();
    const mapped: TcodeRow[] = working.tcodeIds.flatMap((id) => {
      const tcode = tcodeById(id);
      const code = tcode?.code ?? id;
      const description = tcode?.description ?? `${code} transaction`;
      if (needle && !code.toLowerCase().includes(needle) && !description.toLowerCase().includes(needle)) {
        return [];
      }
      return [
        {
          id,
          code,
          description,
          manual: tcode?.manual ?? false,
          objects: working.tcodeObjects[id]?.length ?? 0,
        },
      ];
    });
    if (!sort) {
      return mapped;
    }
    return [...mapped].sort((left, right) => {
      if (sort.key === "objects") {
        const order = left.objects - right.objects;
        return sort.direction === "asc" ? order : -order;
      }
      const key = sort.key as "code" | "description";
      return compareText(left[key], right[key], sort.direction);
    });
  }, [query, sort, working]);

  if (!activity || !working || !baseline) {
    return null;
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const allVisible = visible.length > 0 && visible.every((row) => selected.includes(row.id));
  const someVisible = visible.some((row) => selected.includes(row.id)) && !allVisible;

  function update(next: ActivityDraft) {
    setDraft(next);
  }

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelected((current) => [...new Set([...current, ...visible.map((row) => row.id)])]);
      setRemoveArmed(true);
      return;
    }
    setSelected((current) => current.filter((id) => !visible.some((row) => row.id === id)));
  }

  function removeIds(ids: string[]) {
    if (!working) {
      return;
    }
    update({
      ...working,
      tcodeIds: working.tcodeIds.filter((id) => !ids.includes(id)),
      tcodeObjects: Object.fromEntries(Object.entries(working.tcodeObjects).filter(([id]) => !ids.includes(id))),
    });
    setSelected((current) => current.filter((id) => !ids.includes(id)));
    setRemoveArmed(false);
  }

  const columns: TableColumn<TcodeRow>[] = [
    {
      key: "select",
      width: "var(--space-s48)",
      label: readOnly ? (
        ""
      ) : (
        <Checkbox
          shape="square"
          size="sm"
          checked={allVisible}
          indeterminate={someVisible}
          aria-label="Select all visible T-codes"
          onChange={toggleAll}
        />
      ),
      render: (row) =>
        readOnly ? null : (
          <Checkbox
            shape="square"
            size="sm"
            checked={selected.includes(row.id)}
            aria-label={`Select ${row.code}`}
            onChange={(checked) => {
              setSelected((current) => (checked ? [...current, row.id] : current.filter((id) => id !== row.id)));
              if (checked) {
                setRemoveArmed(true);
              }
            }}
          />
        ),
    },
    { key: "code", label: "T-code", sortable: true, width: "calc(var(--space-s80) + var(--space-s16))" },
    { key: "description", label: "Description", sortable: true },
    {
      key: "source",
      label: "Source",
      width: "calc(var(--space-s96) + var(--space-s48))",
      render: (row) => sourceBadge(row.manual),
    },
    {
      key: "objects",
      label: "Auth objects",
      sortable: true,
      width: "calc(var(--space-s96) + var(--space-s32))",
      render: (row) => (
        <Link
          href="#auth-objects"
          onClick={(event) => {
            event.preventDefault();
            setEditTcodeId(row.id);
          }}
        >
          {row.objects} objects
        </Link>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "calc(var(--space-s96) + var(--space-s16))",
      render: (row) => (
        <span className="inline-flex items-center gap-s8">
          {readOnly ? null : (
            <Link
              href="#edit-tcode"
              onClick={(event) => {
                event.preventDefault();
                setEditTcodeId(row.id);
              }}
            >
              Edit
            </Link>
          )}
          {readOnly ? null : (
            <RowMenu
              label={`Actions for ${row.code}`}
              items={[
                {
                  label: "Remove T-code",
                  onClick: () => {
                    setSelected([row.id]);
                    setRemoveArmed(true);
                  },
                },
              ]}
            />
          )}
        </span>
      ),
    },
  ];

  const authRows = working.authObjectIds.flatMap((id) => {
    const object = authById(id);
    const name = object?.name ?? id;
    const description = object?.description ?? "Authorization object (sample data)";
    const needle = authQuery.trim().toLowerCase();
    if (needle && !name.toLowerCase().includes(needle) && !description.toLowerCase().includes(needle)) {
      return [];
    }
    return [{ id, name, className: object?.class ?? "FI", description, status: working.authStatus[id] ?? "Standard" }];
  });

  const changedAuth = Object.entries(working.authStatus).some(([id, status]) => status !== (authById(id)?.status ?? "Standard"));

  return (
    <>
      <Dialog
        opened={opened}
        onClose={close}
        size="xl"
        header={
          <div className="flex flex-col gap-s4">
            <div className="flex items-center justify-between gap-s12">
              <h2 className="m-0 text-heading-h2 text-strong" style={{ fontFamily: "var(--font-family-heading-h2)" }}>
                {readOnly ? `View activity · ${activity.name}` : `Edit activity · ${activity.name}`}
              </h2>
              <Button variant="ghost" size="xs" aria-label="Close dialog" onClick={close} leftIcon={<IconClose size="s16" />}>
                Close
              </Button>
            </div>
            <div className="flex items-center justify-between gap-s12 text-l2 text-body">
              <span style={{ fontFamily: "var(--font-family-lato-regular)" }}>
                {readOnly ? "View only. Sample data." : "Changes apply to this designation only."}
              </span>
              <span style={{ fontFamily: "var(--font-family-lato-regular)" }}>{summaryLine(working)}</span>
            </div>
          </div>
        }
        footer={
          <div className="flex flex-col gap-s12">
            {tab === "tcodes" ? (
              <Pagination
                page={safePage}
                total={rows.length}
                pageSize={pageSize}
                sizes={pageSizes}
                pageSizeLabel="T-codes per page"
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            ) : null}
            <div className="flex items-center justify-between gap-s12">
              <span className="text-l2 text-body" style={{ fontFamily: "var(--font-family-lato-regular)" }}>
                {readOnly ? "View only" : dirty ? "Unsaved changes" : "No changes yet"}
              </span>
              <span className="flex items-center gap-s8">
                <Button variant="secondary" size="md" onClick={close}>
                  {readOnly ? "Close" : "Cancel"}
                </Button>
                {readOnly ? null : (
                  <Button
                    variant="primary"
                    size="md"
                    disabled={!dirty}
                    onClick={() => {
                      onSave?.(activity.id, cloneDraft(working));
                      close();
                    }}
                  >
                    Save changes
                  </Button>
                )}
              </span>
            </div>
          </div>
        }
      >
        <div className="flex h-full min-h-0 flex-col gap-s12">
          <Tabs
            variant="underline"
            showPanels={false}
            value={tab}
            onChange={(value) => setTab(value === "auth" || value === "org" ? value : "tcodes")}
            items={[
              {
                value: "tcodes",
                label: "T-codes",
                count: (
                  <Badge size="sm" variant="light">
                    {working.tcodeIds.length}
                  </Badge>
                ),
              },
              {
                value: "auth",
                label: "Authorizations",
                count: (
                  <Badge size="sm" variant="light">
                    {working.authObjectIds.length}
                  </Badge>
                ),
              },
              {
                value: "org",
                label: "Org levels",
                count: (
                  <Badge size="sm" variant={openCount > 0 ? "warning" : "light"}>
                    {openCount > 0 ? `${working.orgLevels.length} · ${openCount} open` : working.orgLevels.length}
                  </Badge>
                ),
              },
            ]}
          />

          {tab === "tcodes" ? (
            <div className="flex min-h-0 flex-1 flex-col gap-s12">
              {removeArmed && selected.length > 0 && !readOnly ? (
                <Alert
                  type="warning"
                  title={selected.length === 1 ? `Remove ${tcodeById(selected[0])?.code ?? "T-code"}` : `Remove ${selected.length} T-codes`}
                  action={
                    <Button variant="warn" size="sm" onClick={() => removeIds(selected)}>
                      Remove
                    </Button>
                  }
                  secondaryAction={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setRemoveArmed(false);
                        setSelected([]);
                      }}
                    >
                      Keep
                    </Button>
                  }
                >
                  This removes the T-code from this designation only.
                </Alert>
              ) : null}
              <div className="flex items-center gap-s12">
                <div className="min-w-0 flex-1">
                  <TextField
                    type="search"
                    placeholder="Search T-codes"
                    value={query}
                    clearable
                    onChange={(value) => {
                      setQuery(value);
                      setPage(1);
                    }}
                  />
                </div>
                {readOnly ? null : (
                  <>
                    <Button variant="secondary" size="xs" onClick={() => setAddMode("search")}>
                      Add T-code
                    </Button>
                    <Button variant="secondary" size="xs" onClick={() => setAddMode("paste")}>
                      Paste list
                    </Button>
                  </>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <Table
                  columns={columns}
                  rows={visible}
                  getRowKey={(row) => row.id}
                  sort={sort}
                  onSortChange={setSort}
                  minWidth="100%"
                />
              </div>
            </div>
          ) : null}

          {tab === "auth" ? (
            <div className="flex min-h-0 flex-1 flex-col gap-s12">
              {changedAuth ? (
                <Alert
                  type="info"
                  title="Reset to pre-filled"
                  action={
                    readOnly ? undefined : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          update({
                            ...working,
                            authStatus: Object.fromEntries(
                              working.authObjectIds.map((id) => [id, authById(id)?.status ?? "Standard"]),
                            ),
                            authActivities: Object.fromEntries(working.authObjectIds.map((id) => [id, ["01", "02", "03"]])),
                          })
                        }
                      >
                        Reset
                      </Button>
                    )
                  }
                >
                  Some authorization objects differ from the SAP pre-filled values.
                </Alert>
              ) : null}
              <div className="flex items-center gap-s12">
                <div className="min-w-0 flex-1">
                  <TextField type="search" placeholder="Search authorization objects" value={authQuery} clearable onChange={setAuthQuery} />
                </div>
                {readOnly ? null : (
                  <Button variant="secondary" size="xs" onClick={() => setAddAuth(true)}>
                    Add object
                  </Button>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <Table
                  columns={[
                    { key: "name", label: "Object", sortable: true, width: "calc(var(--space-s96) + var(--space-s48))" },
                    { key: "className", label: "Class", width: "var(--space-s64)" },
                    { key: "description", label: "Description" },
                    {
                      key: "status",
                      label: "Status",
                      width: "calc(var(--space-s96) + var(--space-s24))",
                      render: (row) => (
                        <Badge size="sm" variant={authVariant(row.status)}>
                          {row.status}
                        </Badge>
                      ),
                    },
                    {
                      key: "actions",
                      label: "Actions",
                      width: "var(--space-s80)",
                      render: (row) =>
                        readOnly ? null : (
                          <Link
                            href="#edit-auth"
                            onClick={(event) => {
                              event.preventDefault();
                              setEditAuthId(row.id);
                            }}
                          >
                            Edit
                          </Link>
                        ),
                    },
                  ]}
                  rows={authRows}
                  getRowKey={(row) => row.id}
                  minWidth="100%"
                />
              </div>
            </div>
          ) : null}

          {tab === "org" ? (
            <div className="flex min-h-0 flex-1 flex-col gap-s12">
              {openCount > 0 ? (
                <Alert type="warning" title="Open org level">
                  {openCount === 1 ? "1 org level is open." : `${openCount} org levels are open.`} Open levels block
                  Create. Set values before you continue.
                </Alert>
              ) : null}
              <div className="min-h-0 flex-1 overflow-auto">
                <Table
                  columns={[
                    {
                      key: "name",
                      label: "Org level",
                      render: (row) => (
                        <span className="flex flex-col">
                          <span className="text-strong">{row.name}</span>
                          <span className="text-l2 text-body">{row.id}</span>
                        </span>
                      ),
                    },
                    {
                      key: "values",
                      label: "Values",
                      render: (row) =>
                        row.state === "open" ? (
                          <span className="text-l2 text-body">Not set</span>
                        ) : row.state === "range" ? (
                          <Badge size="sm" variant="light">
                            {row.from}–{row.to}
                          </Badge>
                        ) : (
                          <span className="flex flex-wrap gap-s4">
                            {row.values.slice(0, 3).map((value) => (
                              <Badge key={value} size="sm" variant="light">
                                {value === "*" ? "* all" : value}
                              </Badge>
                            ))}
                            {row.values.length > 3 ? (
                              <Link href="#more-values" onClick={(event) => event.preventDefault()}>
                                +{row.values.length - 3}
                              </Link>
                            ) : null}
                          </span>
                        ),
                    },
                    {
                      key: "used",
                      label: "Used by",
                      render: () => (
                        <Link
                          href="#used-by"
                          onClick={(event) => {
                            event.preventDefault();
                            setTab("auth");
                          }}
                        >
                          {working.authObjectIds.length} fields
                        </Link>
                      ),
                    },
                    {
                      key: "status",
                      label: "Status",
                      render: (row) => (
                        <Badge size="sm" variant={orgVariant(row.state)}>
                          {orgLabel(row.state)}
                        </Badge>
                      ),
                    },
                    {
                      key: "actions",
                      label: "Actions",
                      render: (row) =>
                        readOnly ? null : (
                          <Link
                            href="#edit-org"
                            onClick={(event) => {
                              event.preventDefault();
                              setEditOrg(row);
                            }}
                          >
                            {row.state === "open" ? `Set values for ${row.name}` : `Edit ${row.name}`}
                          </Link>
                        ),
                    },
                  ]}
                  rows={working.orgLevels}
                  getRowKey={(row) => row.id}
                  minWidth="100%"
                />
              </div>
            </div>
          ) : null}
        </div>
      </Dialog>

      <EditTcodeDrawer
        key={editTcodeId ?? "tcode"}
        tcodeId={editTcodeId}
        draft={working}
        onClose={() => setEditTcodeId(null)}
        onSave={(tcodeId, objectIds) => {
          update({ ...working, tcodeObjects: { ...working.tcodeObjects, [tcodeId]: objectIds } });
          setEditTcodeId(null);
        }}
      />
      <AddTcodesDrawer
        key={addMode ?? "add"}
        opened={addMode !== null}
        mode={addMode ?? "search"}
        draft={working}
        onClose={() => setAddMode(null)}
        onAdd={(ids) => {
          const tcodeObjects = { ...working.tcodeObjects };
          for (const id of ids) {
            tcodeObjects[id] = working.authObjectIds.slice(0, Math.min(3, working.authObjectIds.length));
          }
          update({ ...working, tcodeIds: [...working.tcodeIds, ...ids], tcodeObjects });
          setAddMode(null);
        }}
      />
      <EditAuthDrawer
        key={editAuthId ?? "auth"}
        objectId={editAuthId}
        draft={working}
        onClose={() => setEditAuthId(null)}
        onSave={(objectId, activities, status) => {
          update({
            ...working,
            authActivities: { ...working.authActivities, [objectId]: activities },
            authStatus: { ...working.authStatus, [objectId]: status },
          });
          setEditAuthId(null);
        }}
      />
      <AddAuthDrawer
        opened={addAuth}
        draft={working}
        onClose={() => setAddAuth(false)}
        onAdd={(id) => {
          update({
            ...working,
            authObjectIds: [...working.authObjectIds, id],
            authActivities: { ...working.authActivities, [id]: ["01"] },
            authStatus: { ...working.authStatus, [id]: "Manual" },
          });
          setAddAuth(false);
        }}
      />
      <EditOrgDrawer
        key={editOrg?.id ?? "org"}
        level={editOrg}
        onClose={() => setEditOrg(null)}
        onSave={(level) => {
          update({
            ...working,
            orgLevels: working.orgLevels.map((item) => (item.id === level.id ? level : item)),
          });
          setEditOrg(null);
        }}
      />
    </>
  );
}
