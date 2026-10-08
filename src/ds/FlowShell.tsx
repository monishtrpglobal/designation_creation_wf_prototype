import type { ReactNode } from "react";
import { Button } from "./Button";
import { Stepper, type StepItem } from "./Stepper";
import styles from "./FlowShell.module.css";

type FlowShellBase = {
  title: string;
  steps: StepItem[];
  activeIndex: number;
  showSaveAsDraft?: boolean;
  primaryLabel: string;
  children?: ReactNode;
};

export type FlowShellProps = FlowShellBase &
  (
    | {
        primaryDisabled?: false;
        helperText?: ReactNode;
      }
    | {
        primaryDisabled: true;
        helperText: ReactNode;
      }
  );

export function FlowShell({
  title,
  steps,
  activeIndex,
  showSaveAsDraft = false,
  primaryLabel,
  primaryDisabled,
  helperText,
  children,
}: FlowShellProps) {
  return (
    <section className={styles.shell}>
      <header className="flex items-center pb-s16">
        <h1 className={styles.title}>{title}</h1>
      </header>
      <Stepper steps={steps} activeIndex={activeIndex} />
      <div className={`${styles.content} flex-1`}>{children}</div>
      <footer className="flex items-center gap-s16">
        {showSaveAsDraft ? (
          <Button variant="secondary" size="md">
            Save as draft
          </Button>
        ) : null}
        <div className={`${styles.helper} flex-1 text-center`}>{helperText}</div>
        <Button variant="primary" size="md" disabled={primaryDisabled}>
          {primaryLabel}
        </Button>
      </footer>
    </section>
  );
}
