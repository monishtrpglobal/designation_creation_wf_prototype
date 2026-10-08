import { DesignationRoute } from "@/features/designation/DesignationRoute";

export default function SyncPage({ params }: { params: Promise<{ id: string }> }) {
  return <DesignationRoute params={params} route="sync" />;
}
