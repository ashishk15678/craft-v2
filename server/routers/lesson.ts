import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure, orgProcedure } from "@/server/trpc";
import { canTeach, hasGlobalRole } from "@/lib/rbac";
import { commitFiles } from "@/lib/github";

function fireAndForget(fn: () => Promise<unknown>) {
  fn().catch((e: unknown) => console.warn("[bg]", e instanceof Error ? e.message : e));
}

export const lessonRouter = router({
  list: authedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.prisma.course.findUnique({
        where: { id: input.courseId },
        select: { organizationId: true, status: true },
      });
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });

      const member = await ctx.prisma.orgMember.findUnique({
        where: { organizationId_userId: { organizationId: course.organizationId, userId: ctx.user.id } },
      });
      const canSeeAll = hasGlobalRole(ctx.user.role, "ADMIN") || canTeach(ctx.user.role, member?.role);

      return ctx.prisma.lesson.findMany({
        where: { courseId: input.courseId, published: canSeeAll ? undefined : true },
        orderBy: { position: "asc" },
      });
    }),

  get: authedProcedure
    .input(z.object({ lessonId: z.string() }))
    .query(async ({ ctx, input }) => {
      const lesson = await ctx.prisma.lesson.findUnique({
        where: { id: input.lessonId },
        include: { course: { select: { organizationId: true, status: true } } },
      });
      if (!lesson) throw new TRPCError({ code: "NOT_FOUND" });

      const member = await ctx.prisma.orgMember.findUnique({
        where: { organizationId_userId: { organizationId: lesson.course.organizationId, userId: ctx.user.id } },
      });
      const canSeeAll = hasGlobalRole(ctx.user.role, "ADMIN") || canTeach(ctx.user.role, member?.role);
      if (!lesson.published && !canSeeAll) throw new TRPCError({ code: "FORBIDDEN" });
      return lesson;
    }),

  create: orgProcedure
    .input(z.object({
      organizationId: z.string(),
      courseId: z.string(),
      title: z.string().min(1).max(200),
      type: z.enum(["TEXT", "VIDEO", "QUIZ", "WHITEBOARD", "GIST", "VISUALIZER"]).default("TEXT"),
      position: z.number().int().min(1).optional(),
    }))
    .mutation(async ({ ctx, input, ...rest }) => {
      const orgRole = (rest as unknown as { orgRole: string | null }).orgRole;
      if (!canTeach(ctx.user.role, orgRole ?? undefined)) throw new TRPCError({ code: "FORBIDDEN" });

      // Auto-position at the end if not specified
      let position = input.position;
      if (!position) {
        const last = await ctx.prisma.lesson.findFirst({
          where: { courseId: input.courseId },
          orderBy: { position: "desc" },
          select: { position: true },
        });
        position = (last?.position ?? 0) + 1;
      }

      const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const course = await ctx.prisma.course.findUnique({ where: { id: input.courseId }, select: { repoDir: true } });
      const repoPath = course?.repoDir ? `${course.repoDir}/${String(position).padStart(2, "0")}-${slug}.json` : null;

      const lesson = await ctx.prisma.lesson.create({
        data: {
          courseId: input.courseId,
          authorId: ctx.user.id,
          title: input.title,
          type: input.type,
          position,
          repoPath,
        },
      });
      return lesson;
    }),

  update: authedProcedure
    .input(z.object({
      lessonId: z.string(),
      title: z.string().min(1).max(200).optional(),
      content: z.string().optional(),
      published: z.boolean().optional(),
      position: z.number().int().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const lesson = await ctx.prisma.lesson.findUnique({
        where: { id: input.lessonId },
        include: { course: { include: { organization: { select: { slug: true } } } } },
      });
      if (!lesson) throw new TRPCError({ code: "NOT_FOUND" });

      const member = await ctx.prisma.orgMember.findUnique({
        where: { organizationId_userId: { organizationId: lesson.course.organizationId, userId: ctx.user.id } },
      });
      if (!canTeach(ctx.user.role, member?.role)) throw new TRPCError({ code: "FORBIDDEN" });

      const { lessonId, content, ...rest } = input;
      const updated = await ctx.prisma.lesson.update({ where: { id: lessonId }, data: { ...rest, ...(content ? { content } : {}) } });

      // Sync content to GitHub asynchronously
      if (content && lesson.repoPath && process.env.GITHUB_TOKEN && process.env.GITHUB_ORG) {
        fireAndForget(() =>
          commitFiles(lesson.course.organization.slug, [{ path: lesson.repoPath!, content }], `lesson: update ${lesson.title}`)
        );
      }

      return updated;
    }),

  delete: authedProcedure
    .input(z.object({ lessonId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const lesson = await ctx.prisma.lesson.findUnique({
        where: { id: input.lessonId },
        include: { course: true },
      });
      if (!lesson) throw new TRPCError({ code: "NOT_FOUND" });

      const member = await ctx.prisma.orgMember.findUnique({
        where: { organizationId_userId: { organizationId: lesson.course.organizationId, userId: ctx.user.id } },
      });
      if (!canTeach(ctx.user.role, member?.role)) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.prisma.lesson.delete({ where: { id: input.lessonId } });
    }),

  complete: authedProcedure
    .input(z.object({ lessonId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const lesson = await ctx.prisma.lesson.findUnique({ where: { id: input.lessonId }, select: { courseId: true } });
      if (!lesson) throw new TRPCError({ code: "NOT_FOUND" });

      const enrollment = await ctx.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: ctx.user.id, courseId: lesson.courseId } },
      });
      if (!enrollment) throw new TRPCError({ code: "FORBIDDEN", message: "Enroll in the course first" });

      const completion = await ctx.prisma.lessonComplete.upsert({
        where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: input.lessonId } },
        update: {},
        create: { enrollmentId: enrollment.id, lessonId: input.lessonId },
      });

      // Check if course is now complete
      fireAndForget(async () => {
        const [totalLessons, completedCount] = await Promise.all([
          ctx.prisma.lesson.count({ where: { courseId: lesson.courseId, published: true } }),
          ctx.prisma.lessonComplete.count({ where: { enrollmentId: enrollment.id } }),
        ]);
        if (totalLessons > 0 && completedCount >= totalLessons) {
          await ctx.prisma.enrollment.update({ where: { id: enrollment.id }, data: { completedAt: new Date() } });
          const badge = await ctx.prisma.badge.findFirst({ where: { trigger: "COURSE_COMPLETE" } });
          if (badge) {
            await ctx.prisma.userBadge.upsert({
              where: { userId_badgeId: { userId: ctx.user.id, badgeId: badge.id } },
              update: {},
              create: { userId: ctx.user.id, badgeId: badge.id },
            });
          }
        }
      });

      return completion;
    }),

  submitQuiz: authedProcedure
    .input(z.object({
      lessonId: z.string(),
      answers: z.record(z.unknown()),
      score: z.number().int(),
      maxScore: z.number().int(),
    }))
    .mutation(async ({ ctx, input }) => {
      const attempt = await ctx.prisma.quizAttempt.create({
        data: {
          lessonId: input.lessonId,
          userId: ctx.user.id,
          score: input.score,
          maxScore: input.maxScore,
          answers: JSON.stringify(input.answers),
        },
      });
      // Award perfect quiz badge
      if (input.score === input.maxScore) {
        fireAndForget(async () => {
          const badge = await ctx.prisma.badge.findFirst({ where: { trigger: "QUIZ_PERFECT" } });
          if (badge) {
            await ctx.prisma.userBadge.upsert({
              where: { userId_badgeId: { userId: ctx.user.id, badgeId: badge.id } },
              update: {},
              create: { userId: ctx.user.id, badgeId: badge.id },
            });
          }
        });
      }
      return attempt;
    }),
});
