import { Stepper as MantineStepper, StepperStep } from "@mantine/core";
import { Badge } from "./Badge";
import styles from "./Stepper.module.css";

export type StepState = "completed" | "current" | "pending" | "disabled" | "error";

export type StepItem = {
  label: string;
  state?: StepState;
};

const badgeLabel: Record<StepState, string> = {
  completed: "Completed",
  current: "In Progress",
  pending: "Pending",
  disabled: "Pending",
  error: "Error",
};

const badgeVariant = {
  completed: "completed",
  current: "in-progress",
  pending: "pending",
  disabled: "pending",
  error: "error",
} as const;

function resolveState(step: StepItem, index: number, activeIndex: number): StepState {
  if (step.state) {
    return step.state;
  }
  if (index < activeIndex) {
    return "completed";
  }
  if (index === activeIndex) {
    return "current";
  }
  return "pending";
}

function CheckIcon() {
  return (
    <svg
      aria-hidden
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 12L10 17L20 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      aria-hidden
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.68508 15.4442C3.23279 14.3522 3 13.1819 3 12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12C21 13.1819 20.7672 14.3522 20.3149 15.4442C19.8626 16.5361 19.1997 17.5282 18.364 18.364C17.5282 19.1997 16.5361 19.8626 15.4442 20.3149C14.3522 20.7672 13.1819 21 12 21C10.8181 21 9.64778 20.7672 8.55585 20.3149C7.46392 19.8626 6.47177 19.1997 5.63604 18.364C4.80031 17.5282 4.13738 16.5361 3.68508 15.4442Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 8V12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 16H12.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepMarker({ state, number }: { state: StepState; number: number }) {
  if (state === "completed") {
    return <CheckIcon />;
  }
  if (state === "error") {
    return <ErrorIcon />;
  }
  return <span>{number}</span>;
}

export function Stepper({ steps, activeIndex }: { steps: StepItem[]; activeIndex: number }) {
  return (
    <MantineStepper
      active={activeIndex}
      iconPosition="left"
      wrap={false}
      allowNextStepsSelect={false}
      classNames={styles}
    >
      {steps.map((step, index) => {
        const state = resolveState(step, index, activeIndex);
        const marker = <StepMarker state={state} number={index + 1} />;
        return (
          <StepperStep
            key={step.label}
            label={step.label}
            description={
              <Badge variant={badgeVariant[state]} size="md">
                {badgeLabel[state]}
              </Badge>
            }
            icon={marker}
            progressIcon={marker}
            completedIcon={marker}
            data-irm-state={state}
            allowStepSelect={false}
          />
        );
      })}
    </MantineStepper>
  );
}
