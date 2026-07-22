import { SuperadminWorkspace } from "@/components/role-workspaces";
import { getStudentSession } from "@/lib/student-session";
import { redirect } from "next/navigation";
export default async function PlatformPage() { const role = ((await getStudentSession())?.user as { role?: string } | undefined)?.role; if (role !== "SUPERADMIN") redirect("/dashboard"); return <SuperadminWorkspace />; }
