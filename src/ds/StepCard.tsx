import type { ReactNode } from "react";
import { IconAlertCircle, IconCheck, IconClock, IconInfo } from "./icons";
import styles from "./StepCard.module.css";

export type StepCardState = "done" | "waiting" | "required" | "locked" | "error";

const stateLabel: Record<StepCardState, string> = {
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
  children?: ReactNode;
};

export function StepCard({ step, title, state, children }: StepCardProps) {
  const StateIcon = state === "locked" ? null : stateIcon[state];

  return (
    <section className={styles.card} data-state={state}>
      <header className={styles.header}>
        <span className={styles.circle} aria-hidden>
          {step}
        </span>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.state} data-state={state}>
          {StateIcon ? <StateIcon size="s16" /> : null}
          <span>{stateLabel[state]}</span>
        </p>
      </header>
      {children ? <div className={styles.body}>{children}</div> : null}
    </section>
  );
}
