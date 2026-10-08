import { FlowShell } from "@/ds/FlowShell";
import type { StepItem } from "@/ds/Stepper";

const steps: StepItem[] = [
  { label: "Designation Name" },
  { label: "Business Activities" },
  { label: "Run Sync" },
  { label: "Role Recommendation" },
  { label: "Role Finalization" },
];

const activeSteps = [0, 1, 2, 3, 4] as const;

export default function DesignationShellPage() {
  return (
    <main className="grid gap-s32 bg-canvas p-s24">
      {activeSteps.map((activeIndex) => (
        <section key={activeIndex} className="grid gap-s16">
          <h2 className="text-label-l1 text-strong">Active step {activeIndex + 1}</h2>
          <FlowShell
            title="Create a New Designation"
            steps={steps}
            activeIndex={activeIndex}
            showSaveAsDraft
            primaryLabel="Next"
            helperText="Helper text"
          >
            {null}
          </FlowShell>
        </section>
      ))}
    </main>
  );
}
