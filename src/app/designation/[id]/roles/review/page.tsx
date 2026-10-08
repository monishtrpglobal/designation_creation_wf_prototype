import { DesignationRoute } from "@/features/designation/DesignationRoute";

export default function ReviewRolesPage({ params }: { params: Promise<{ id: string }> }) {
  return <DesignationRoute params={params} route="review" />;
}
