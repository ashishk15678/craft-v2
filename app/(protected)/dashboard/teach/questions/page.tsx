import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/student-session";
import { QuestionBank } from "./question-bank";

export const metadata = { title: "Question Bank" };

const ALLOWED = ["TEACHER", "EDITOR", "ADMIN", "SUPERADMIN", "ORG_MANAGER"];

export default async function QuestionsPage() {
  const session = await getStudentSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !ALLOWED.includes(role)) redirect("/dashboard");
  return <QuestionBank />;
}
