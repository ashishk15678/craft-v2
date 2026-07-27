import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { BookOpen, Users, Settings, Plus, Lock, Globe, Clipboard } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { canTeach, canManageOrg } from "@/lib/rbac";
import { OrgMembersPanel } from "./members-panel";
import { OrgSettingsPanel } from "./settings-panel";
import { CreateCourseDialog } from "./create-course-dialog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await prisma.organization.findUnique({ where: { slug }, select: { name: true } });
  return { title: org?.name ?? "Organization" };
}

export default async function OrgDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { slug } = await params;
  const { tab = "courses" } = await searchParams;

  const org = await prisma.organization.findUnique({
    where: { slug },
    include: {
      owner: { select: { name: true, username: true } },
      _count: { select: { members: true, courses: true } },
    },
  });
  if (!org) notFound();

  const membership = await prisma.orgMember.findUnique({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
  });

  // Non-members can only view public orgs
  const isMember = !!membership;
  if (!isMember && org.visibility !== "PUBLIC") {
    redirect(`/dashboard/orgs`);
  }

  const orgRole = membership?.role;
  const canCreate = canTeach(user.role, orgRole);
  const canAdmin  = canManageOrg(user.role, orgRole);

  const courses = await prisma.course.findMany({
    where: {
      organizationId: org.id,
      status: canCreate ? undefined : "PUBLISHED",
    },
    include: {
      author: { select: { name: true } },
      _count: { select: { lessons: { where: { published: true } } } },
      enrollments: { where: { userId: user.id }, select: { completedAt: true, completions: { select: { lessonId: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const tabs = [
    { id: "courses",  label: "Courses",  icon: BookOpen },
    ...(isMember ? [{ id: "members",  label: "Members",  icon: Users    }] : []),
    ...(canAdmin  ? [{ id: "settings", label: "Settings", icon: Settings }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Org header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-2xl font-black">
              {org.name[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">{org.name}</h1>
                {org.visibility === "PUBLIC"
                  ? <Globe className="h-4 w-4 text-emerald-500" aria-label="Public org" />
                  : <Lock className="h-4 w-4 text-amber-500" aria-label="Private org" />}
              </div>
              {org.description && <p className="mt-1 text-sm text-muted-foreground">{org.description}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                {org._count.members} members · {org._count.courses} courses · owned by {org.owner.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isMember && org.visibility === "PUBLIC" && (
              <form action={`/api/orgs/${org.slug}/join`} method="POST">
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                  Join org
                </button>
              </form>
            )}
            {orgRole && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase">
                {orgRole.replace("_", " ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            href={`/dashboard/orgs/${slug}?tab=${id}`}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </Link>
        ))}
        {canCreate && tab === "courses" && (
          <div className="ml-auto pb-1">
            <CreateCourseDialog organizationId={org.id} orgSlug={slug} />
          </div>
        )}
      </div>

      {/* Tab content */}
      {tab === "courses" && (
        <div>
          {courses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">No courses yet</p>
              {canCreate && <p className="mt-1 text-xs text-muted-foreground">Create the first course for this organization.</p>}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const total = course._count.lessons;
                const enrollment = course.enrollments[0];
                const done = enrollment?.completions.length ?? 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const statusColor = course.status === "PUBLISHED" ? "text-emerald-500" : course.status === "DRAFT" ? "text-amber-500" : "text-muted-foreground";

                return (
                  <Link key={course.id} href={`/dashboard/orgs/${slug}/courses/${course.slug}`}
                    className="group rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase ${statusColor}`}>{course.status}</span>
                      {course.aiGenerated && (
                        <span className="text-[10px] font-bold uppercase text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded">AI</span>
                      )}
                    </div>
                    <p className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-2">{course.title}</p>
                    {course.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{course.description}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">by {course.author.name} · {total} lessons</p>

                    {enrollment && (
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{done}/{total} done</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}

                    {!enrollment && course.status === "PUBLISHED" && (
                      <p className="mt-3 text-xs font-semibold text-primary">Enroll →</p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "members" && isMember && (
        <OrgMembersPanel organizationId={org.id} currentUserId={user.id} currentOrgRole={orgRole ?? null} globalRole={user.role} />
      )}

      {tab === "settings" && canAdmin && (
        <OrgSettingsPanel org={{ id: org.id, name: org.name, slug: org.slug, description: org.description, visibility: org.visibility as "PUBLIC" | "INVITE" | "PRIVATE", joinToken: org.joinToken }} />
      )}
    </div>
  );
}
