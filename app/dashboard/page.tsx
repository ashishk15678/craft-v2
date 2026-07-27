import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Building2, Trophy, TrendingUp, Clock } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [enrollments, memberships, badges, recentLessons] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: {
            id: true, title: true, slug: true, coverUrl: true,
            organization: { select: { name: true, slug: true } },
            _count: { select: { lessons: { where: { published: true } } } },
          },
        },
        completions: { select: { lessonId: true } },
      },
      orderBy: { enrolledAt: "desc" },
      take: 6,
    }),
    prisma.orgMember.findMany({
      where: { userId: user.id },
      include: { organization: { select: { id: true, name: true, slug: true, _count: { select: { members: true, courses: true } } } } },
      orderBy: { joinedAt: "desc" },
      take: 4,
    }),
    prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
      orderBy: { awardedAt: "desc" },
      take: 4,
    }),
    prisma.lessonComplete.findMany({
      where: { enrollment: { userId: user.id } },
      include: { lesson: { select: { title: true, course: { select: { title: true, slug: true, organization: { select: { slug: true } } } } } } },
      orderBy: { completedAt: "desc" },
      take: 5,
    }),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    { label: "Courses enrolled", value: enrollments.length, icon: BookOpen, color: "text-blue-500 bg-blue-500/10" },
    { label: "Organizations",    value: memberships.length,  icon: Building2, color: "text-violet-500 bg-violet-500/10" },
    { label: "Badges earned",    value: badges.length,       icon: Trophy,    color: "text-amber-500 bg-amber-500/10" },
    {
      label: "Lessons done",
      value: enrollments.reduce((n, e) => n + e.completions.length, 0),
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">
          {greeting}, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across your learning.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-lg", color)}>
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <p className="text-2xl font-black">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Continue learning */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Continue learning</h2>
            <Link href="/dashboard/orgs" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Browse orgs →
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No courses yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Join an organization and enroll in a course to get started.</p>
              <Link href="/dashboard/orgs"
                className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                Explore orgs
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {enrollments.map((e) => {
                const total = e.course._count.lessons;
                const done = e.completions.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <Link
                    key={e.id}
                    href={`/dashboard/orgs/${e.course.organization.slug}/courses/${e.course.slug}`}
                    className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
                  >
                    <p className="text-xs text-muted-foreground mb-1">{e.course.organization.name}</p>
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {e.course.title}
                    </p>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{done}/{total} lessons</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                    </div>
                    {e.completedAt && (
                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-500">✓ Completed</p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Recent badges */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold">Recent badges</h2>
              <Link href="/dashboard/badges" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                All →
              </Link>
            </div>
            {badges.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <Trophy className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Complete lessons to earn badges.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {badges.map((ub) => (
                  <div key={ub.id} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center">
                    <span className="text-2xl" role="img" aria-label={ub.badge.name}>{ub.badge.icon}</span>
                    <p className="text-[11px] font-semibold leading-tight">{ub.badge.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My orgs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold">My orgs</h2>
              <Link href="/dashboard/orgs" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                All →
              </Link>
            </div>
            <div className="space-y-2">
              {memberships.length === 0 ? (
                <p className="text-xs text-muted-foreground">Not in any organization yet.</p>
              ) : (
                memberships.map((m) => (
                  <Link key={m.id} href={`/dashboard/orgs/${m.organization.slug}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:border-primary/50 transition-colors group">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                      {m.organization.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary transition-colors">{m.organization.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {m.organization._count.courses} courses · {m.organization._count.members} members
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold uppercase text-muted-foreground">{m.role.replace("_", " ")}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent activity */}
          {recentLessons.length > 0 && (
            <div>
              <h2 className="font-bold mb-3">Recent activity</h2>
              <div className="space-y-2">
                {recentLessons.map((lc) => (
                  <div key={lc.id} className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2">
                    <Clock className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">
                        Completed &ldquo;{lc.lesson.title}&rdquo;
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{lc.lesson.course.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
