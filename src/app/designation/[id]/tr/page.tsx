import { DesignationRoute } from "@/features/designation/DesignationRoute";

export default function TrPage({ params }: { params: Promise<{ id: string }> }) {
  return <DesignationRoute params={params} route="tr" />;
}
