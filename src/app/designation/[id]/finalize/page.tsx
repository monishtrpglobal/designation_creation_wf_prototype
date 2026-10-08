import { DesignationRoute } from "@/features/designation/DesignationRoute";

export default function FinalizePage({ params }: { params: Promise<{ id: string }> }) {
  return <DesignationRoute params={params} route="finalize" />;
}
