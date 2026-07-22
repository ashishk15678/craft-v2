import { redirect } from "next/navigation";
import { StudentSidebar } from "@/components/student-sidebar";
import { getStudentSession } from "@/lib/student-session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getStudentSession();
  if (!session?.user) redirect("/login");
  return (
    <div className="mx-auto flex w-full max-w-7xl border-x border-border bg-background md:min-h-[calc(100dvh-2.5rem)]">
      <StudentSidebar name={session.user.name} email={session.user.email} role={(session.user as { role?: string }).role} />
      <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
