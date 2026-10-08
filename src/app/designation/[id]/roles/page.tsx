import { DesignationRoute } from "@/features/designation/DesignationRoute";

export default function RolesPage({ params }: { params: Promise<{ id: string }> }) {
  return <DesignationRoute params={params} route="roles" />;
}
