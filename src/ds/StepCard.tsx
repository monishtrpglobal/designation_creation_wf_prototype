import type { ReactNode } from "react";
import { IconAlertCircle, IconCheck, IconClock, IconInfo } from "./icons";
import styles from "./StepCard.module.css";

export type StepCardState = "done" | "waiting" | "required" | "locked" | "error";

const stateLabelMap: Record<StepCardState, string> = {
  done: "Done",
  waiting: "Waiting",
  required: "Required",
  locked: "Locked",
  error: "Error",
};

const stateIcon = {
  done: IconCheck,
  waiting: IconClock,
  required: IconInfo,
  error: IconAlertCircle,
} as const;

type StepCardProps = {
  step: number;
  title: string;
  state: StepCardState;
  stateLabel?: string;
  /** Body-coloured state text, no icon, default border, and the step number stays visible. */
  plainState?: boolean;
  /** Keep the default border when the state would otherwise colour it. */
  neutralBorder?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
};

export function StepCard({
  step,
  title,
  state,
  stateLabel,
  plainState = false,
  neutralBorder = false,
  actions,
  children,
}: StepCardProps) {
  const StateIcon = plainState || state === "locked" ? null : stateIcon[state];
  const visualState = plainState ? "plain" : state;

  return (
    <section className={styles.card} data-state={visualState} data-neutral-border={neutralBorder || undefined}>
      <header className={styles.header}>
        <span className={styles.circle} aria-hidden>
          {state === "done" && !plainState ? <IconCheck size="s16" /> : step}
        </span>
        <h3 className={styles.title}>{title}</h3>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
        <p className={styles.state} data-state={visualState}>
          {StateIcon ? <StateIcon size="s16" /> : null}
          <span>{stateLabel ?? stateLabelMap[state]}</span>
        </p>
      </header>
      {children ? <div className={styles.body}>{children}</div> : null}
    </section>
  );
}
