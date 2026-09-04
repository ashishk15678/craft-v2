import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/student-session";
import { AssessmentBuilder } from "./assessment-builder";

export const metadata = { title: "Manage Assessments" };

const ALLOWED = ["TEACHER", "EDITOR", "ADMIN", "SUPERADMIN", "ORG_MANAGER"];

export default async function ManageAssessmentsPage() {
  const session = await getStudentSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !ALLOWED.includes(role)) redirect("/dashboard");
  return <AssessmentBuilder />;
}
