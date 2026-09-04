import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { GlobalRole } from "@/lib/rbac";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: GlobalRole;
  image: string | null;
};

export async function getSession(): Promise<AuthUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  // Always read role from DB — don't trust the session token for role
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      image: true,
    },
  });
  if (!dbUser) return null;

  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    username: dbUser.username,
    role: dbUser.role as GlobalRole,
    image: dbUser.image,
  };
}

/** Throws a redirect-friendly error when not authenticated */
export async function requireSession(): Promise<AuthUser> {
  const user = await getSession();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
