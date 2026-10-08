import { Suspense } from "react";
import { ActivitiesPage } from "@/features/designation/activities/ActivitiesPage";

function Loading() {
  return (
    <main className="p-s24">
      <p className="text-body-b2 text-body">Loading</p>
    </main>
  );
}

async function Resolved({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ActivitiesPage designationId={id} />;
}

export default function ActivitiesRoute({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Loading />}>
      <Resolved params={params} />
    </Suspense>
  );
}
