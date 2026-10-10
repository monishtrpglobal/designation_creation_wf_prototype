import type { ReactNode } from "react";
import { Button, type ButtonVariant } from "./Button";
import { IconArrowLeft, IconChevronLeft, IconChevronRight } from "./icons";
import { Stepper, type StepItem } from "./Stepper";
import styles from "./FlowShell.module.css";

type FlowShellBase = {
  title: string;
  steps: StepItem[];
  activeIndex: number;
  showBack?: boolean;
  onBack?: () => void;
  showSaveAsDraft?: boolean;
  onSaveAsDraft?: () => void;
  primaryLabel: string;
  contentSurface?: "canvas" | "white";
  pageSurface?: "canvas" | "white";
  showCatalogueBack?: boolean;
  onCatalogueBack?: () => void;
  onStepPrev?: () => void;
  stepPrevVariant?: ButtonVariant;
  showFooterPrimary?: boolean;
  helperAlign?: "start" | "center";
  onPrimaryClick?: () => void;
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
  showBack = false,
  onBack,
  showSaveAsDraft = false,
  onSaveAsDraft,
  primaryLabel,
  contentSurface = "canvas",
  pageSurface = "canvas",
  showCatalogueBack = false,
  onCatalogueBack,
  onStepPrev,
  stepPrevVariant = "ghost",
  showFooterPrimary = true,
  helperAlign = "center",
  onPrimaryClick,
  primaryDisabled,
  helperText,
  children,
}: FlowShellProps) {
  const showFooter = showBack || showSaveAsDraft || Boolean(helperText) || showFooterPrimary;
  return (
    <section className={styles.shell} data-page-surface={pageSurface}>
      <header className="flex items-center justify-between pb-s16">
        <h1 className={styles.title}>{title}</h1>
        {showCatalogueBack ? (
          <Button
            variant="secondary"
            size="sm"
            iconOnly
            aria-label="Back to catalogue"
            leftIcon={<IconArrowLeft size="s18" />}
            onClick={onCatalogueBack}
          />
        ) : null}
      </header>
      <div className="flex w-full items-center gap-s12">
        <Button
          variant={stepPrevVariant}
          size="sm"
          disabled={activeIndex === 0}
          leftIcon={<IconChevronLeft size="s16" />}
          onClick={onStepPrev ?? onBack}
        >
          Prev
        </Button>
        <div className="min-w-0 flex-1 overflow-x-auto">
          <Stepper steps={steps} activeIndex={activeIndex} />
        </div>
        <Button
          variant="primary"
          size="sm"
          disabled={primaryDisabled}
          rightIcon={<IconChevronRight size="s16" />}
          onClick={onPrimaryClick}
        >
          Next
        </Button>
      </div>
      <div className={`${styles.content} flex-1`} data-surface={contentSurface}>
        {children}
      </div>
      {showFooter ? (
        <footer className="flex w-full items-center justify-between gap-s16">
          <div className="flex items-center gap-s12">
            {showBack ? (
              <Button variant="secondary" size="md" onClick={onBack}>
                Back
              </Button>
            ) : null}
            {showSaveAsDraft ? (
              <Button variant="secondary" size="md" onClick={onSaveAsDraft}>
                Save as draft
              </Button>
            ) : null}
          </div>
          <div className={`${styles.helper} flex-1 ${helperAlign === "start" ? "text-left" : "text-center"}`}>
            {helperText}
          </div>
          {showFooterPrimary ? (
            <Button variant="primary" size="md" disabled={primaryDisabled} onClick={onPrimaryClick}>
              {primaryLabel}
            </Button>
          ) : null}
        </footer>
      ) : null}
    </section>
  );
}
