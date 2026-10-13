"use client";

import { ActivitiesPage } from "@/features/designation/activities/ActivitiesPage";
import { NamePage } from "@/features/designation/name/NamePage";
import { FinalizePage } from "@/features/designation/finalize/FinalizePage";
import { LinkPage } from "@/features/designation/link/LinkPage";
import { ReviewPage } from "@/features/designation/review/ReviewPage";
import { RolesPage } from "@/features/designation/roles/RolesPage";
import { SyncPage } from "@/features/designation/sync/SyncPage";
import { isWizardStep } from "@/state/access";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ScreenFrame } from "./ScreenFrame";

function Loading() {
  return (
    <main className="p-s24">
      <p className="text-body-b4 text-body" style={{ fontFamily: "var(--font-family-body-b4)" }}>
        Loading
      </p>
    </main>
  );
}

export function CreateFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const requested = searchParams.get("step");
  const step = requested === null ? "name" : isWizardStep(requested) ? requested : null;
  const needsId = step !== null && step !== "name";
  const invalid = step === null || (needsId && !id);

  useEffect(() => {
    if (!invalid) {
      return;
    }
    router.replace("/designation/new");
  }, [invalid, router]);

  if (invalid || step === null) {
    return <Loading />;
  }

  if (step === "name") {
    return <NamePage designationId={id ?? undefined} />;
  }

  if (!id) {
    return <Loading />;
  }

  if (step === "activities") {
    return <ActivitiesPage designationId={id} />;
  }

  if (step === "sync") {
    return <SyncPage designationId={id} />;
  }

  if (step === "roles") {
    return <RolesPage designationId={id} />;
  }

  if (step === "review") {
    return <ReviewPage designationId={id} />;
  }

  if (step === "link") {
    return <LinkPage designationId={id} />;
  }

  if (step === "finalize") {
    return <FinalizePage designationId={id} />;
  }

  return <ScreenFrame route={step} designationId={id} />;
}
