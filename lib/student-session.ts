import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getStudentSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        organizationMemberships: {
          select: {
            id: true,
            role: true,
            organizationId: true,
            organization: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    if (dbUser) {
      (session.user as any).role = dbUser.role;
      (session.user as any).orgMemberships = dbUser.organizationMemberships;
    }
  }
  return session;
}
