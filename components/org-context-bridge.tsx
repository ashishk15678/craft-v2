// Server component — fetches better-auth org data and passes it to OrgProvider.
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { OrgProvider, type BaOrg, type GlobalRole } from "@/contexts/org-context";
import type { ReactNode } from "react";

const COOKIE_NAME = "craft_active_org";

export async function OrgContextBridge({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    // Not authenticated — render without org context (proxy handles redirect)
    return <>{children}</>;
  }

  // Fetch orgs from better-auth and user role from DB in parallel
  const [rawOrgs, dbUser] = await Promise.all([
    auth.api.listOrganizations({ headers: await headers() }).catch(() => [] as BaOrg[]),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }),
  ]);

  const orgs: BaOrg[] = (rawOrgs ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    logo: o.logo ?? null,
    metadata: (o.metadata as Record<string, unknown> | null) ?? null,
    createdAt: o.createdAt,
  }));

  const globalRole = (dbUser?.role ?? "STUDENT") as GlobalRole;

  // Validate the active-org cookie
  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get(COOKIE_NAME)?.value;
  const initialOrgId = orgs.find((o) => o.id === cookieOrgId)?.id ?? orgs[0]?.id;

  return (
    <OrgProvider orgs={orgs} globalRole={globalRole} initialOrgId={initialOrgId}>
      {children}
    </OrgProvider>
  );
}
