import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/student-session";

export const roles = [
  "ORG_MANAGER",
  "SUPERADMIN",
  "ADMIN",
  "EDITOR",
  "TEACHER",
  "STUDENT",
] as const;
export type Role = (typeof roles)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

/** Returns the authenticated user + role, or an error response. */
export async function requireRole(allowed: readonly Role[]) {
  const session = await getStudentSession();
  const role = (session?.user as { role?: unknown } | undefined)?.role;
  if (!session?.user)
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    } as const;
  if (!isRole(role) || !allowed.includes(role))
    return {
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    } as const;
  return { user: session.user, role } as const;
}

/** Convenience: ORG_MANAGER is always allowed for any role-gated endpoint. */
export async function requireRoleOrOrgManager(allowed: readonly Role[]) {
  const allAllowed = allowed.includes("ORG_MANAGER")
    ? allowed
    : (["ORG_MANAGER", ...allowed] as const);
  return requireRole(allAllowed as unknown as readonly Role[]);
}

export function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
