import { Suspense } from "react";
import { CreateFlow } from "@/features/designation/CreateFlow";

function Loading() {
  return (
    <main className="p-s24">
      <p className="text-body-b4 text-body" style={{ fontFamily: "var(--font-family-body-b4)" }}>
        Loading
      </p>
    </main>
  );
}

export default function NewDesignationPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CreateFlow />
    </Suspense>
  );
}
