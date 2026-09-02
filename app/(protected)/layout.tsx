import { redirect } from "next/navigation";
import { StudentSidebar } from "@/components/sidebar";
import { getStudentSession } from "@/lib/student-session";
import { prisma } from "@/lib/db";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getStudentSession();
  if (!session?.user) redirect("/login");

  const dbUser = await prisma.user.findFirstOrThrow({
    where: { email: session.user.email },
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl bg-background md:min-h-[calc(100dvh-2.5rem)]">
      <StudentSidebar
        name={dbUser.name}
        email={dbUser.email}
        role={(dbUser as { role?: string }).role}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
