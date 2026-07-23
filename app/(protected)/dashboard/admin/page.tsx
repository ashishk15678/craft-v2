import { AdminWorkspace } from "@/components/role-workspaces";
import { getStudentSession } from "@/lib/student-session";
import { redirect } from "next/navigation";
export default async function AdminPage() {
  const role = (
    (await getStudentSession())?.user as { role?: string } | undefined
  )?.role;
  if (!role) redirect("/dashboard");
  return <AdminWorkspace role={role} />;
}
