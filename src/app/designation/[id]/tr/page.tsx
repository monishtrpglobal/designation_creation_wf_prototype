import { Suspense } from "react";
import { CataloguePage } from "@/features/designation/catalogue/CataloguePage";

function Loading() {
  return (
    <main className="p-s24">
      <p className="text-body-b2 text-body">Loading</p>
    </main>
  );
}

async function ResolvedTr({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CataloguePage trDesignationId={id} />;
}

export default function TrPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Loading />}>
      <ResolvedTr params={params} />
    </Suspense>
  );
}
