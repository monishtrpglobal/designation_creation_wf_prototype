import { DesignationRoute } from "@/features/designation/DesignationRoute";

export default function LicensePage({ params }: { params: Promise<{ id: string }> }) {
  return <DesignationRoute params={params} route="license" />;
}
