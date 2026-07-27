import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Lock, Globe, Users } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { CreateOrgDialog } from "./create-org-dialog";

export const metadata = { title: "Organizations" };

export default async function OrgsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [myMemberships, publicOrgs] = await Promise.all([
    prisma.orgMember.findMany({
      where: { userId: user.id },
      include: {
        organization: {
          include: { _count: { select: { members: true, courses: true } } },
        },
      },
      orderBy: { joinedAt: "desc" },
    }),
    prisma.organization.findMany({
      where: {
        visibility: "PUBLIC",
        members: { none: { userId: user.id } }, // not already a member
      },
      include: { _count: { select: { members: true, courses: true } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const myOrgIds = new Set(myMemberships.map((m) => m.organizationId));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Organizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your own org or join an existing one.
          </p>
        </div>
        <CreateOrgDialog />
      </div>

      {/* My orgs */}
      <section>
        <h2 className="mb-4 text-base font-bold">My organizations</h2>
        {myMemberships.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">You haven&apos;t joined any organizations yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Create one below or join a public org.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myMemberships.map((m) => {
              const org = m.organization;
              return (
                <Link
                  key={m.id}
                  href={`/dashboard/orgs/${org.slug}`}
                  className="group rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-black text-lg">
                      {org.name[0].toUpperCase()}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                      {m.role.replace("_", " ")}
                    </span>
                  </div>
                  <p className="font-bold group-hover:text-primary transition-colors">{org.name}</p>
                  {org.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{org.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />{org._count.members}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />{org._count.courses} courses
                    </span>
                    {org.visibility === "PUBLIC"
                      ? <Globe className="h-3 w-3 ml-auto" aria-label="Public" />
                      : <Lock className="h-3 w-3 ml-auto" aria-label="Private" />}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Discover public orgs */}
      {publicOrgs.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-bold">Discover public organizations</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publicOrgs.map((org) => (
              <Link
                key={org.id}
                href={`/dashboard/orgs/${org.slug}`}
                className="group rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-black text-lg mb-3">
                  {org.name[0].toUpperCase()}
                </div>
                <p className="font-bold group-hover:text-primary transition-colors">{org.name}</p>
                {org.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{org.description}</p>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{org._count.members} members</span>
                  <span>{org._count.courses} courses</span>
                  <span className="ml-auto text-primary font-semibold">Join →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
