import { Suspense } from "react";
import type { FlowRoute } from "@/state/model";
import { ScreenFrame } from "./ScreenFrame";

function Loading() {
  return (
    <main className="p-s24">
      <p className="text-body-b2 text-body">Loading</p>
    </main>
  );
}

async function ResolvedFrame({
  params,
  route,
}: {
  params: Promise<{ id: string }>;
  route: FlowRoute;
}) {
  const { id } = await params;
  return <ScreenFrame route={route} designationId={id} />;
}

export function DesignationRoute({
  params,
  route,
}: {
  params: Promise<{ id: string }>;
  route: FlowRoute;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <ResolvedFrame params={params} route={route} />
    </Suspense>
  );
}
