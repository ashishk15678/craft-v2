import { TeacherWorkspace } from "@/components/role-workspaces";
import { getStudentSession } from "@/lib/student-session";
import { redirect } from "next/navigation";
export default async function TeachingPage() {
  const session = await getStudentSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !["TEACHER", "EDITOR", "ADMIN", "SUPERADMIN"].includes(role))
    redirect("/dashboard");
  return <TeacherWorkspace />;
}
