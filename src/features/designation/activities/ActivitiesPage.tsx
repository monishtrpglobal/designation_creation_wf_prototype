"use client";

import { activitiesFile, type Activity } from "@/mock";
import { AppFrame } from "@/ds/AppFrame";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Card, type CardTint } from "@/ds/Card";
import { Checkbox } from "@/ds/Checkbox";
import { FlowShell } from "@/ds/FlowShell";
import { Link } from "@/ds/Link";
import { Pagination } from "@/ds/Pagination";
import type { StepItem } from "@/ds/Stepper";
import { Tabs } from "@/ds/Tabs";
import { TextField } from "@/ds/TextField";
import { guardRedirect } from "@/state/access";
import { useFlowStore } from "@/state/flowStore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent } from "react";

const steps: StepItem[] = [
  { label: "Designation Name" },
  { label: "Business Activities" },
  { label: "Run Sync" },
  { label: "Role Recommendation" },
  { label: "Role Finalization" },
];

const columns = 4;
const activityPageSizes = [10, 20, 50] as const;
const tints = ["mint", "blue", "lavender"] as const;

const catalogue = activitiesFile.activities;
const noSelection: string[] = [];

function seedFor(ids: string[]) {
  let hash = 2166136261;
  for (const id of ids) {
    for (let index = 0; index < id.length; index += 1) {
      hash ^= id.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
  }
  return (hash >>> 0) || 1;
}

function assignTints(count: number, seed: number): CardTint[] {
  let state = seed || 1;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const result: CardTint[] = [];
  for (let index = 0; index < count; index += 1) {
    const left = index % columns === 0 ? undefined : result[index - 1];
    const above = index < columns ? undefined : result[index - columns];
    const open = tints.filter((tint) => tint !== left && tint !== above);
    const choice = open[Math.floor(next() * open.length)] ?? "mint";
    result.push(choice);
  }
  return result;
}

function selectionLabel(count: number) {
  return count === 1 ? "1 activity selected" : `${count} activities selected`;
}

export function ActivitiesPage({ designationId }: { designationId: string }) {
  const router = useRouter();
  const hydrated = useFlowStore((state) => state.hydrated);
  const designation = useFlowStore((state) =>
    state.designations.find((item) => item.id === designationId),
  );
  const setCurrentDesignation = useFlowStore((state) => state.setCurrentDesignation);
  const setSelectedActivities = useFlowStore((state) => state.setSelectedActivities);
  const saveDraft = useFlowStore((state) => state.saveDraft);
  const redirect = hydrated ? guardRedirect(designation, "activities") : null;

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(activityPageSizes[0]);

  const selectedIds = designation?.selectedActivityIds ?? noSelection;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalogue.filter((activity) => {
      if (filter === "selected" && !selectedIds.includes(activity.id)) {
        return false;
      }
      if (needle.length > 0 && !activity.name.toLowerCase().includes(needle)) {
        return false;
      }
      return true;
    });
  }, [filter, query, selectedIds]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const cardTints = assignTints(
    visible.length,
    seedFor(visible.map((activity) => activity.id)),
  );

  useEffect(() => {
    if (!hydrated || !redirect) {
      return;
    }
    router.replace(redirect);
  }, [hydrated, redirect, router]);

  useEffect(() => {
    if (!hydrated || redirect) {
      return;
    }
    setCurrentDesignation(designationId);
  }, [hydrated, redirect, designationId, setCurrentDesignation]);

  function toggle(activityId: string) {
    const next = selectedIds.includes(activityId)
      ? selectedIds.filter((id) => id !== activityId)
      : [...selectedIds, activityId];
    setSelectedActivities(designationId, next);
  }

  function focusSelection() {
    setFilter("all");
    setQuery("");
    setPage(1);
    window.requestAnimationFrame(() => {
      document.getElementById("activity-selection")?.querySelector<HTMLElement>("input")?.focus();
    });
  }

  function onSave() {
    saveDraft(designationId);
    router.push("/designations");
  }

  function onNext() {
    if (selectedIds.length === 0) {
      return;
    }
    router.push(`/designation/${designationId}/sync`);
  }

  const noneSelected = selectedIds.length === 0;

  return (
    <AppFrame>
      {!hydrated || redirect || !designation ? (
        <main className="p-s24">
          <p className="text-body-b4 text-body" style={{ fontFamily: "var(--font-family-body-b4)" }}>
            Loading
          </p>
        </main>
      ) : (
        <FlowShell
          title="Create a New Designation"
          steps={steps}
          activeIndex={1}
          showSaveAsDraft
          onSaveAsDraft={onSave}
          primaryLabel="Next"
          primaryDisabled={noneSelected}
          onPrimaryClick={onNext}
          helperText={
            noneSelected ? (
              <>
                Next is off:{" "}
                <Link
                  href="#activity-selection"
                  onClick={(event) => {
                    event.preventDefault();
                    focusSelection();
                  }}
                >
                  select at least one activity
                </Link>
              </>
            ) : (
              selectionLabel(selectedIds.length)
            )
          }
        >
          <div className="flex w-full flex-col gap-s16">
            <div className="flex w-full flex-col gap-s24">
              <div className="flex flex-col gap-s10">
                <h2
                  className="m-0 text-heading-h2 text-in-progress-text"
                  style={{ fontFamily: "var(--font-family-heading-h2)" }}
                >
                  Select business activities
                </h2>
                <p
                  className="m-0 text-l2 text-body"
                  style={{
                    fontFamily: "var(--font-family-lato-regular)",
                    lineHeight: "var(--font-line-height-label-l1)",
                  }}
                >
                  Select the activities this designation performs. Use Edit to review the T-codes and
                  auth values of an activity.
                </p>
              </div>
              <div className="flex w-full items-center justify-between gap-s16">
                <div style={{ width: "calc(var(--space-s80) * 4)" }}>
                  <TextField
                    type="search"
                    placeholder="Search activities"
                    value={query}
                    clearable
                    onChange={(value) => {
                      setQuery(value);
                      setPage(1);
                    }}
                  />
                </div>
                <Tabs
                  variant="pill"
                  showPanels={false}
                  value={filter}
                  onChange={(value) => {
                    setFilter(value ?? "all");
                    setPage(1);
                  }}
                  items={[
                    {
                      value: "all",
                      label: "All",
                      count: (
                        <Badge size="sm" variant="light">
                          {catalogue.length}
                        </Badge>
                      ),
                    },
                    {
                      value: "selected",
                      label: "Selected",
                      count: (
                        <Badge size="sm" variant="light">
                          {selectedIds.length}
                        </Badge>
                      ),
                    },
                  ]}
                />
              </div>
            </div>

            <div id="activity-selection" className="grid w-full grid-cols-4 gap-s16">
              {visible.map((activity, index) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  tint={cardTints[index] ?? "mint"}
                  selected={selectedIds.includes(activity.id)}
                  onToggle={() => toggle(activity.id)}
                />
              ))}
            </div>
            {visible.length === 0 ? (
              <p
                className="m-0 text-l2 text-body"
                style={{
                  fontFamily: "var(--font-family-lato-regular)",
                  lineHeight: "var(--font-line-height-label-l1)",
                }}
              >
                No activities match your search.
              </p>
            ) : null}

            <Pagination
              page={safePage}
              total={filtered.length}
              pageSize={pageSize}
              sizes={activityPageSizes}
              pageSizeLabel="Activities per page"
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        </FlowShell>
      )}
    </AppFrame>
  );
}

function ActivityCard({
  activity,
  tint,
  selected,
  onToggle,
}: {
  activity: Activity;
  tint: CardTint;
  selected: boolean;
  onToggle: () => void;
}) {
  function keepSelection(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <div className="flex cursor-pointer" onClick={onToggle}>
      <Card variant="hoverable" tint={tint} selected={selected}>
        <span className="flex w-full flex-col gap-s8">
          <span className="flex w-full items-center justify-between">
            <span onClick={keepSelection}>
              <Checkbox
                shape="round"
                size="md"
                checked={selected}
                aria-label={`Select ${activity.name}`}
                onChange={() => onToggle()}
              />
            </span>
            <span onClick={keepSelection}>
              {/* Screen 4 (edit activity dialog) is not built yet. */}
              <Button
                variant="secondary"
                size="xs"
                aria-label={`Edit ${activity.name}`}
                onClick={() => undefined}
              >
                Edit
              </Button>
            </span>
          </span>
          <span
            className="text-label-l1 text-strong"
            style={{ fontFamily: "var(--font-family-label-l1)" }}
          >
            {activity.name}
          </span>
          <span
            className="min-h-s40 text-l2 text-body"
            style={{
              fontFamily: "var(--font-family-lato-regular)",
              lineHeight: "var(--font-line-height-label-l1)",
            }}
          >
            {activity.description}
          </span>
          <span
            className="text-control-sm text-body"
            style={{ fontFamily: "var(--font-family-control-sm)" }}
          >
            {activity.tcodeIds.length} T-codes
          </span>
        </span>
      </Card>
    </div>
  );
}
