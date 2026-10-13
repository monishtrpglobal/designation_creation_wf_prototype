"use client";

import { FlowShell } from "@/ds/FlowShell";
import { flowSteps } from "@/features/designation/flowSteps";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { guardRedirect, pathFor, screenTitle, shellIndexFor } from "@/state/access";
import { useFlowStore } from "@/state/flowStore";
import type { FlowRoute } from "@/state/model";

const previousShellRoute: Partial<Record<FlowRoute, FlowRoute>> = {
  activities: "name",
  sync: "activities",
  roles: "sync",
  review: "sync",
  link: "sync",
  finalize: "roles",
};

type ScreenFrameProps = {
  route: FlowRoute;
  designationId?: string;
};

export function ScreenFrame({ route, designationId }: ScreenFrameProps) {
  const router = useRouter();
  const hydrated = useFlowStore((state) => state.hydrated);
  const designation = useFlowStore((state) =>
    designationId ? state.designations.find((item) => item.id === designationId) : undefined,
  );
  const setCurrentDesignation = useFlowStore((state) => state.setCurrentDesignation);
  const redirect = hydrated ? guardRedirect(designation, route) : null;
  const title = screenTitle(route);
  const shellIndex = shellIndexFor(route);

  useEffect(() => {
    if (!hydrated || !redirect) {
      return;
    }
    router.replace(redirect);
  }, [hydrated, redirect, router]);

  useEffect(() => {
    if (!hydrated || redirect || !designationId) {
      return;
    }
    setCurrentDesignation(designationId);
  }, [hydrated, redirect, designationId, setCurrentDesignation]);

  if (!hydrated || redirect) {
    return (
      <main className="p-s24">
        <p className="text-body-b2 text-body">Loading</p>
      </main>
    );
  }

  const body = <p className="text-body-b2 text-body">{title}</p>;

  if (shellIndex === null) {
    return <main className="bg-canvas p-s24">{body}</main>;
  }

  return (
    <main className="bg-canvas p-s24">
      <FlowShell
        title="Create a New Designation"
        steps={flowSteps}
        activeIndex={shellIndex}
        showSaveAsDraft
        onBack={
          designationId && previousShellRoute[route]
            ? () => {
                const previous = previousShellRoute[route];
                if (previous) {
                  router.push(pathFor(previous, designationId));
                }
              }
            : undefined
        }
        primaryLabel="Next"
        primaryDisabled
        helperText="This screen is not built yet."
      >
        {body}
      </FlowShell>
    </main>
  );
}
