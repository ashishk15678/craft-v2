// Server component – fetches org data and passes it to the client OrgProvider
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrgProvider, type OrgMembership, type GlobalRole } from "@/contexts/org-context";
import type { ReactNode } from "react";

const COOKIE_NAME = "craft_active_org";

export async function OrgContextBridge({ children }: { children: ReactNode }) {
  // 1. Resolve the current session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    // Not authenticated – render children without context (redirect handled by layout)
    return <>{children}</>;
  }

  // 2. Load user with all org memberships in one query
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

  const memberships: OrgMembership[] = (dbUser?.organizationMemberships ?? []).map((m) => ({
    id: m.id,
    organizationId: m.organizationId,
    role: m.role as OrgMembership["role"],
    organization: m.organization,
  }));

  const globalRole = (dbUser?.role ?? "STUDENT") as GlobalRole;

  // 3. Read the active org from the cookie
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get(COOKIE_NAME)?.value;

  // Validate: make sure the cookie points to an org the user is actually in
  const validOrgId = memberships.find((m) => m.organizationId === activeOrgId)
    ? activeOrgId
    : memberships[0]?.organizationId;

  return (
    <OrgProvider
      memberships={memberships}
      globalRole={globalRole}
      initialOrgId={validOrgId}
    >
      {children}
    </OrgProvider>
  );
}
