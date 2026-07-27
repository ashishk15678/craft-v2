import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { BookOpen, CheckCircle2, Circle, Lock, LayoutGrid, FileText, Play } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { canTeach } from "@/lib/rbac";
import { EnrollButton } from "./enroll-button";
import { cn } from "@/lib/utils";

const LESSON_TYPE_ICON: Record<string, React.ElementType> = {
  TEXT:        FileText,
  VIDEO:       Play,
  QUIZ:        BookOpen,
  WHITEBOARD:  LayoutGrid,
  GIST:        FileText,
  VISUALIZER:  LayoutGrid,
};

const LESSON_TYPE_LABEL: Record<string, string> = {
  TEXT:       "Reading",
  VIDEO:      "Video",
  QUIZ:       "Quiz",
  WHITEBOARD: "Whiteboard",
  GIST:       "Code",
  VISUALIZER: "Visualizer",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string; courseSlug: string }> }) {
  const { slug, courseSlug } = await params;
  const org = await prisma.organization.findUnique({ where: { slug }, select: { id: true } });
  if (!org) return {};
  const course = await prisma.course.findUnique({ where: { organizationId_slug: { organizationId: org.id, slug: courseSlug } }, select: { title: true } });
  return { title: course?.title ?? "Course" };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string; courseSlug: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { slug: orgSlug, courseSlug } = await params;

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug }, select: { id: true, name: true } });
  if (!org) notFound();

  const course = await prisma.course.findUnique({
    where: { organizationId_slug: { organizationId: org.id, slug: courseSlug } },
    include: {
      author: { select: { name: true, username: true } },
      lessons: { orderBy: { position: "asc" } },
      _count: { select: { enrollments: true } },
      kanbanBoards: { select: { id: true, title: true } },
    },
  });
  if (!course) notFound();

  const membership = await prisma.orgMember.findUnique({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
  });
  const orgRole = membership?.role;
  const isTeacher = canTeach(user.role, orgRole);

  // Unpublished course — only teachers/admins can see it
  if (course.status !== "PUBLISHED" && !isTeacher) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    include: { completions: { select: { lessonId: true } } },
  });

  const completedIds = new Set(enrollment?.completions.map((c) => c.lessonId) ?? []);
  const publishedLessons = isTeacher ? course.lessons : course.lessons.filter((l) => l.published);
  const total = publishedLessons.length;
  const done  = publishedLessons.filter((l) => completedIds.has(l.id)).length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/dashboard/orgs" className="hover:text-foreground transition-colors">Orgs</Link>
        <span>/</span>
        <Link href={`/dashboard/orgs/${orgSlug}`} className="hover:text-foreground transition-colors">{org.name}</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{course.title}</span>
      </nav>

      {/* Course header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                course.status === "PUBLISHED" ? "bg-emerald-500/10 text-emerald-500" :
                course.status === "DRAFT"     ? "bg-amber-500/10 text-amber-500"    :
                                                "bg-muted text-muted-foreground"
              )}>{course.status}</span>
              {course.aiGenerated && <span className="text-[10px] font-bold uppercase bg-violet-500/10 text-violet-500 px-2 py-0.5 rounded-full">AI</span>}
            </div>
            <h1 className="text-2xl font-black tracking-tight">{course.title}</h1>
            {course.description && <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>}
            <p className="mt-2 text-xs text-muted-foreground">
              by {course.author.name} · {total} lessons · {course._count.enrollments} enrolled
            </p>
          </div>

          {/* Teacher controls */}
          {isTeacher && (
            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/dashboard/orgs/${orgSlug}/courses/${courseSlug}/lessons/new`}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                + Lesson
              </Link>
              {course.kanbanBoards[0] && (
                <Link href={`/dashboard/orgs/${orgSlug}/courses/${courseSlug}/kanban`}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Board
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Progress bar — only for enrolled students */}
        {enrollment && (
          <div className="mt-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{done} of {total} lessons complete</span>
              <span className="font-semibold text-primary">{pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
                role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
              />
            </div>
            {enrollment.completedAt && (
              <p className="text-xs font-semibold text-emerald-500">🎉 Course complete!</p>
            )}
          </div>
        )}

        {/* Enroll CTA */}
        {!enrollment && course.status === "PUBLISHED" && (
          <div className="mt-5">
            <EnrollButton courseId={course.id} orgSlug={orgSlug} courseSlug={courseSlug} />
          </div>
        )}
      </div>

      {/* Lessons list */}
      <section>
        <h2 className="mb-3 font-bold">Lessons</h2>
        {publishedLessons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <BookOpen className="mx-auto mb-3 h-7 w-7 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No lessons published yet.</p>
          </div>
        ) : (
          <ol className="space-y-1.5">
            {publishedLessons.map((lesson, idx) => {
              const isComplete = completedIds.has(lesson.id);
              const isLocked   = !enrollment && course.status === "PUBLISHED";
              const Icon = LESSON_TYPE_ICON[lesson.type] ?? FileText;

              return (
                <li key={lesson.id}>
                  {isLocked ? (
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 opacity-60 cursor-not-allowed select-none">
                      <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{lesson.title}</span>
                      <span className="text-xs text-muted-foreground">{LESSON_TYPE_LABEL[lesson.type]}</span>
                    </div>
                  ) : (
                    <Link
                      href={`/dashboard/orgs/${orgSlug}/courses/${courseSlug}/lessons/${lesson.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:border-primary/50",
                        isComplete ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card"
                      )}
                    >
                      {isComplete
                        ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        : <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-bold text-muted-foreground">{idx + 1}</span>
                      }
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-medium truncate", isComplete && "line-through text-muted-foreground")}>{lesson.title}</p>
                        {!lesson.published && <p className="text-[10px] text-amber-500 font-bold">DRAFT</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Icon className="h-3 w-3" aria-hidden />{LESSON_TYPE_LABEL[lesson.type]}
                        </span>
                      </div>
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
