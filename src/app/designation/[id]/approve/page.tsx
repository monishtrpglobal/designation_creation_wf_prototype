import { DesignationRoute } from "@/features/designation/DesignationRoute";

export default function ApprovePage({ params }: { params: Promise<{ id: string }> }) {
  return <DesignationRoute params={params} route="approve" />;
}
