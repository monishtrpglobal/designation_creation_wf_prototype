import { DesignationRoute } from "@/features/designation/DesignationRoute";

export default function ActivitiesPage({ params }: { params: Promise<{ id: string }> }) {
  return <DesignationRoute params={params} route="activities" />;
}
