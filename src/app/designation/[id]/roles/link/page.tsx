import { DesignationRoute } from "@/features/designation/DesignationRoute";

export default function LinkRolesPage({ params }: { params: Promise<{ id: string }> }) {
  return <DesignationRoute params={params} route="link" />;
}
