"use client";

import { Progress } from "@mantine/core";
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

const ringBox = { sm: 80, md: 120, lg: 200 } as const;
const ringThickness = { sm: 8, md: 12, lg: 20 } as const;

export function ProgressRing({ value, size = "md", indeterminate = false }: ProgressRingProps) {
  const shown = indeterminate ? 25 : stepped(value);
  const text = indeterminate ? "Loading" : `${shown}%`;
  const box = ringBox[size];
  const thickness = ringThickness[size];
  const radius = (box - thickness) / 2;
  const center = box / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (shown / 100) * circumference;
  return (
    <div className={styles.ring} data-size={size} role="img" aria-label={text}>
      <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} aria-hidden>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth={thickness}
        />
        {shown > 0 ? (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--color-brand-teal)"
            strokeWidth={thickness}
            strokeLinecap={shown >= 100 ? "butt" : "round"}
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform={`rotate(-90 ${center} ${center})`}
          />
        ) : null}
      </svg>
      <span className={styles.label}>{text}</span>
    </div>
  );
}

export type ProgressNodeState = "pending" | "active" | "done" | "error";
export type ProgressConnectorState = "pending" | "done";
export type ProgressTrackStage = "creating" | "profile-and-tr" | "synced" | "error" | "stopped";

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
  stopped: ["error", "pending", "pending", "pending", "pending"],
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
