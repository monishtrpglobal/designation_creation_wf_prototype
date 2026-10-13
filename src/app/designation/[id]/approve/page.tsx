import { Suspense } from "react";
import { CataloguePage } from "@/features/designation/catalogue/CataloguePage";

function Loading() {
  return (
    <main className="p-s24">
      <p className="text-body-b2 text-body">Loading</p>
    </main>
  );
}

async function ResolvedReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CataloguePage reportDesignationId={id} />;
}

export default function ApprovePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Loading />}>
      <ResolvedReport params={params} />
    </Suspense>
  );
}
