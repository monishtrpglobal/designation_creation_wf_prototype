"use client";

import { AppFrame } from "@/ds/AppFrame";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Card, type CardTint } from "@/ds/Card";
import { Dialog } from "@/ds/Dialog";
import { FlowShell } from "@/ds/FlowShell";
import {
  IconAlertCircle,
  IconBuildingBank,
  IconCalculator,
  IconChartPie,
  IconCircleCheck,
  IconReceipt,
} from "@/ds/icons";
import { Link } from "@/ds/Link";
import { TextField } from "@/ds/TextField";
import { flowSteps } from "@/features/designation/flowSteps";
import { pathFor } from "@/state/access";
import { useFlowStore } from "@/state/flowStore";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { namesMatch, previewCount, suggestionTint, suggestions, type Suggestion } from "./suggestions";

const nameFieldId = "designation-name";
const nameLimit = 60;
const openedName = "Head of Accountant";

const suggestionIcons = {
  calculator: IconCalculator,
  receipt: IconReceipt,
  "building-bank": IconBuildingBank,
  "chart-pie": IconChartPie,
} as const;

function fieldError(message: ReactNode) {
  return (
    <>
      <IconAlertCircle size="s14" style={{ flexShrink: 0 }} />
      <span>{message}</span>
    </>
  );
}

function SuggestionCard({
  suggestion,
  tint,
  taken,
  selected,
  onSelect,
}: {
  suggestion: Suggestion;
  tint: CardTint;
  taken: boolean;
  selected: boolean;
  onSelect: (name: string) => void;
}) {
  const Icon = suggestionIcons[suggestion.icon];
  return (
    <Card
      variant="hoverable"
      tint={taken ? "neutral" : tint}
      selected={!taken && selected}
      disabled={taken}
      onClick={taken ? undefined : () => onSelect(suggestion.name)}
    >
      <span className="flex flex-1 flex-col justify-between gap-s8">
        <span className="flex flex-col gap-s8">
          <span
            className="inline-flex"
            style={{ color: taken ? "var(--color-text-muted)" : "var(--color-text-strong)" }}
          >
            <Icon size="s24" />
          </span>
          <span
            className="text-label-l1"
            style={{
              fontFamily: "var(--font-family-label-l1)",
              color: taken ? "var(--color-neutral-text)" : "var(--color-text-strong)",
            }}
          >
            {suggestion.name}
          </span>
          <span
            className="text-l2 text-body"
            style={{
              fontFamily: "var(--font-family-lato-regular)",
              fontWeight: "var(--font-weight-body-b4)",
              lineHeight: "var(--font-line-height-label-l1)",
            }}
          >
            {suggestion.description}
          </span>
        </span>
        {!taken && selected ? (
          <span className="inline-flex items-center gap-s6">
            <IconCircleCheck size="s16" style={{ color: "var(--color-in-progress-text)" }} />
            <span
              className="text-label-l1"
              style={{
                color: "var(--color-in-progress-text)",
                fontFamily: "var(--font-family-label-l1)",
              }}
            >
              Selected
            </span>
          </span>
        ) : null}
        {taken ? (
          <Badge variant="warning" size="sm">
            Already in your catalogue
          </Badge>
        ) : null}
      </span>
    </Card>
  );
}

export function NamePage({ designationId }: { designationId?: string }) {
  const router = useRouter();
  const hydrated = useFlowStore((state) => state.hydrated);
  const designations = useFlowStore((state) => state.designations);
  const createDesignation = useFlowStore((state) => state.createDesignation);
  const renameDesignation = useFlowStore((state) => state.renameDesignation);
  const setCurrentDesignation = useFlowStore((state) => state.setCurrentDesignation);
  const designation = designationId
    ? designations.find((item) => item.id === designationId)
    : undefined;
  const [name, setName] = useState(designationId ? "" : openedName);
  const [error, setError] = useState<ReactNode>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [seeded, setSeeded] = useState(!designationId);

  useEffect(() => {
    if (!designationId || !hydrated || seeded) {
      return;
    }
    if (!designation) {
      router.replace("/designations");
      return;
    }
    setName(designation.name);
    setCurrentDesignation(designationId);
    setSeeded(true);
  }, [designation, designationId, hydrated, router, seeded, setCurrentDesignation]);

  const taken = suggestions.map((item) => item.inCatalogue === true);

  function choose(next: string) {
    setName(next);
    setError(null);
    setMoreOpen(false);
  }

  function focusName() {
    document.getElementById(nameFieldId)?.focus();
  }

  function onNext() {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError(fieldError("Enter a designation name."));
      focusName();
      return;
    }
    if (trimmed.length < 3) {
      setError(fieldError("Use at least 3 characters."));
      focusName();
      return;
    }
    if (trimmed.length > nameLimit) {
      setError(fieldError("Use 60 characters or fewer."));
      focusName();
      return;
    }
    const listed = suggestions.some((item) => item.inCatalogue === true && namesMatch(trimmed, item.name));
    const duplicate = designations.some(
      (item) => item.id !== designationId && namesMatch(item.name, trimmed),
    );
    if (listed || duplicate) {
      setError(
        fieldError(
          <>
            A designation named &quot;{trimmed}&quot; already exists. Enter a different name.{" "}
            <Link href="/designations">View it in the catalogue</Link>
          </>,
        ),
      );
      focusName();
      return;
    }
    if (designationId) {
      renameDesignation(designationId, trimmed);
      router.push(pathFor("activities", designationId));
      return;
    }
    const id = createDesignation(trimmed);
    router.push(pathFor("activities", id));
  }

  const ready = hydrated && seeded;

  return (
    <AppFrame>
      {!ready ? (
        <main className="p-s24">
          <p className="text-body-b4 text-body" style={{ fontFamily: "var(--font-family-body-b4)" }}>
            Loading
          </p>
        </main>
      ) : (
        <FlowShell
          title="Create a New Designation"
          steps={flowSteps}
          activeIndex={0}
          primaryLabel="Next"
          contentSurface="white"
          pageSurface="white"
          showCatalogueBack
          onCatalogueBack={() => router.push("/designations")}
          showFooterPrimary={false}
          onPrimaryClick={onNext}
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-s32">
            <div className="flex flex-col items-center gap-s10 text-center">
              <h2
                className="text-heading-h2"
                style={{
                  margin: 0,
                  fontFamily: "var(--font-family-heading-h2)",
                  color: "var(--color-in-progress-text)",
                }}
              >
                What is the designation?
              </h2>
              <p
                className="m-0 text-l2 text-body"
                style={{
                  width: "calc(var(--space-s80) * 7)",
                  fontFamily: "var(--font-family-lato-regular)",
                  fontWeight: "var(--font-weight-body-b4)",
                  lineHeight: "var(--font-line-height-label-l1)",
                }}
              >
                Use a job position, such as Head of Accountant. We use it to recommend SAP roles.
              </p>
            </div>
            <div style={{ width: "calc(var(--space-s80) * 6)" }}>
              <TextField
                id={nameFieldId}
                label="Designation name"
                showInfo
                value={name}
                error={error ?? undefined}
                showCounter
                maxLength={nameLimit}
                onChange={(value) => {
                  setName(value);
                  if (value !== name) {
                    setError(null);
                  }
                }}
              />
            </div>
            <div
              className="flex flex-col gap-s12 pt-s20"
              style={{ width: "calc(var(--space-s80) * 11)" }}
            >
              <div className="flex items-center justify-between">
                <h3
                  className="m-0 uppercase"
                  style={{
                    color: "var(--color-in-progress-text)",
                    fontFamily: "var(--font-family-lato-semibold)",
                    fontSize: "var(--font-size-l3)",
                    fontWeight: "var(--font-weight-body-b1)",
                    lineHeight: "var(--font-line-height-control-sm)",
                  }}
                >
                  Suggested designations
                </h3>
                <Link
                  href="#suggestions"
                  onClick={(event) => {
                    event.preventDefault();
                    setMoreOpen(true);
                  }}
                  style={{ color: "var(--color-in-progress-text)" }}
                >
                  Show more suggestions
                </Link>
              </div>
              <div className="grid grid-cols-4 items-stretch gap-s16 pt-s2">
                {suggestions.slice(0, previewCount).map((suggestion, index) => (
                  <SuggestionCard
                    key={suggestion.name}
                    suggestion={suggestion}
                    tint={suggestionTint(index, taken[index] ?? false)}
                    taken={taken[index] ?? false}
                    selected={namesMatch(name, suggestion.name)}
                    onSelect={choose}
                  />
                ))}
              </div>
            </div>
          </div>
          <Dialog
            opened={moreOpen}
            onClose={() => setMoreOpen(false)}
            size="md"
            header={
              <h2 className="m-0 text-heading-h2 text-body" style={{ fontFamily: "var(--font-family-heading-h2)" }}>
                Suggested designations
              </h2>
            }
            footer={
              <div className="flex justify-end">
                <Button variant="secondary" size="md" onClick={() => setMoreOpen(false)}>
                  Close
                </Button>
              </div>
            }
          >
            <div className="flex flex-col gap-s12">
              {suggestions.slice(previewCount).map((suggestion, index) => (
                <SuggestionCard
                  key={suggestion.name}
                  suggestion={suggestion}
                  tint={suggestionTint(previewCount + index, taken[previewCount + index] ?? false)}
                  taken={taken[previewCount + index] ?? false}
                  selected={namesMatch(name, suggestion.name)}
                  onSelect={choose}
                />
              ))}
            </div>
          </Dialog>
        </FlowShell>
      )}
    </AppFrame>
  );
}
