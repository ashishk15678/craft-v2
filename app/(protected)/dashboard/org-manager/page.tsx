import { OrgManagerWorkspace } from "@/components/role-workspaces";
import { getStudentSession } from "@/lib/student-session";
import { redirect } from "next/navigation";

export default async function OrgManagerPage() {
  const session = await getStudentSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ORG_MANAGER") redirect("/dashboard");
  return <OrgManagerWorkspace />;
}
