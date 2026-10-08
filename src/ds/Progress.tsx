"use client";

import { Progress, RingProgress } from "@mantine/core";
import { IconAlertCircle, IconCheck } from "./icons";
import styles from "./Progress.module.css";

export type ProgressLineSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ProgressRingSize = "sm" | "md" | "lg";

const ringSteps = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100] as const;

type ProgressLineProps = {
  value: number;
  size?: ProgressLineSize;
  indeterminate?: boolean;
  label?: string;
};

type ProgressRingProps = {
  value: number;
  size?: ProgressRingSize;
  indeterminate?: boolean;
};

function stepped(value: number) {
  const clamped = Math.min(100, Math.max(0, value));
  return ringSteps.reduce((nearest, step) =>
    Math.abs(step - clamped) < Math.abs(nearest - clamped) ? step : nearest,
  );
}

export function ProgressLine({ value, size = "md", indeterminate = false, label = "Progress" }: ProgressLineProps) {
  const shown = indeterminate ? 30 : stepped(value);
  return (
    <Progress
      value={shown}
      aria-label={label}
      className={styles.line}
      data-size={size}
      classNames={{ section: styles.section }}
    />
  );
}

export function ProgressRing({ value, size = "md", indeterminate = false }: ProgressRingProps) {
  const shown = indeterminate ? 25 : stepped(value);
  const text = indeterminate ? "Loading" : `${shown}%`;
  return (
    <RingProgress
      size={100}
      thickness={10}
      roundCaps={false}
      rootColor="var(--color-border-subtle)"
      sections={[{ value: shown, color: "var(--color-brand-teal)" }]}
      label={
        <span className={styles.label}>
          {text}
        </span>
      }
      className={styles.ring}
      data-size={size}
      aria-label={text}
    />
  );
}

export type ProgressNodeState = "pending" | "active" | "done" | "error";
export type ProgressConnectorState = "pending" | "done";
export type ProgressTrackStage = "creating" | "profile-and-tr" | "synced" | "error";

const statusWord: Record<ProgressNodeState, string> = {
  pending: "Pending",
  active: "In progress",
  done: "Done",
  error: "Error",
};

type ProgressTrackNodeProps = {
  label: string;
  number: string;
  state?: ProgressNodeState;
};

export function ProgressTrackNode({ label, number, state = "pending" }: ProgressTrackNodeProps) {
  return (
    <div className={styles.node} aria-current={state === "active" ? "step" : undefined}>
      <span className={styles.indicator} data-state={state}>
        {state === "done" ? (
          <IconCheck size="s20" />
        ) : state === "error" ? (
          <IconAlertCircle size="s20" />
        ) : (
          number
        )}
      </span>
      <span className={styles.copy}>
        <p className={styles.nodeLabel}>{label}</p>
        <p className={styles.status} data-state={state}>
          {statusWord[state]}
        </p>
      </span>
    </div>
  );
}

type ProgressTrackConnectorProps = {
  state?: ProgressConnectorState;
};

export function ProgressTrackConnector({ state = "pending" }: ProgressTrackConnectorProps) {
  return (
    <div className={styles.connector} aria-hidden>
      <span className={styles.connectorLine} data-state={state} />
    </div>
  );
}

const stages: Record<
  ProgressTrackStage,
  [ProgressNodeState, ProgressConnectorState, ProgressNodeState, ProgressConnectorState, ProgressNodeState]
> = {
  creating: ["active", "pending", "pending", "pending", "pending"],
  "profile-and-tr": ["done", "done", "active", "pending", "pending"],
  synced: ["done", "done", "done", "done", "done"],
  error: ["done", "done", "error", "pending", "pending"],
};

type ProgressTrackProps = {
  stage?: ProgressTrackStage;
};

export function ProgressTrack({ stage = "creating" }: ProgressTrackProps) {
  const [first, left, second, right, third] = stages[stage];
  return (
    <div className={styles.track}>
      <ProgressTrackNode label="Creating" number="1" state={first} />
      <ProgressTrackConnector state={left} />
      <ProgressTrackNode label="Profile & TR" number="2" state={second} />
      <ProgressTrackConnector state={right} />
      <ProgressTrackNode label="Synced" number="3" state={third} />
    </div>
  );
}
