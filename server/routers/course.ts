import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure, orgProcedure } from "@/server/trpc";
import { canTeach, canManageOrg, hasGlobalRole } from "@/lib/rbac";
import { ensureDirectory } from "@/lib/github";

function fireAndForget(fn: () => Promise<unknown>) {
  fn().catch((e: unknown) => console.warn("[bg]", e instanceof Error ? e.message : e));
}

export const courseRouter = router({
  // List courses for an org — filters by visibility based on caller's role
  list: authedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const member = await ctx.prisma.orgMember.findUnique({
        where: { organizationId_userId: { organizationId: input.organizationId, userId: ctx.user.id } },
      });
      const canSeeAll = hasGlobalRole(ctx.user.role, "ADMIN") || canTeach(ctx.user.role, member?.role);

      const courses = await ctx.prisma.course.findMany({
        where: {
          organizationId: input.organizationId,
          status: canSeeAll ? undefined : "PUBLISHED",
        },
        include: {
          author: { select: { id: true, name: true, username: true } },
          _count: { select: { lessons: true, enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      // Check enrollment for each
      const enrollments = await ctx.prisma.enrollment.findMany({
        where: { userId: ctx.user.id, courseId: { in: courses.map((c) => c.id) } },
        select: { courseId: true, completedAt: true },
      });
      const enrollMap = new Map(enrollments.map((e) => [e.courseId, e]));
      return courses.map((c) => ({ ...c, enrollment: enrollMap.get(c.id) ?? null }));
    }),

  get: authedProcedure
    .input(z.object({ organizationId: z.string(), slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.prisma.course.findUnique({
        where: { organizationId_slug: { organizationId: input.organizationId, slug: input.slug } },
        include: {
          author: { select: { id: true, name: true, username: true } },
          lessons: { orderBy: { position: "asc" } },
          organization: { select: { id: true, name: true, slug: true } },
        },
      });
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });

      const member = await ctx.prisma.orgMember.findUnique({
        where: { organizationId_userId: { organizationId: input.organizationId, userId: ctx.user.id } },
      });
      const canSeeAll = hasGlobalRole(ctx.user.role, "ADMIN") || canTeach(ctx.user.role, member?.role);
      if (course.status !== "PUBLISHED" && !canSeeAll) throw new TRPCError({ code: "FORBIDDEN" });

      const enrollment = await ctx.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: ctx.user.id, courseId: course.id } },
        include: { completions: { select: { lessonId: true } } },
      });

      return {
        ...course,
        myRole: member?.role ?? null,
        enrollment,
        completedLessonIds: enrollment?.completions.map((c) => c.lessonId) ?? [],
      };
    }),

  create: orgProcedure
    .input(z.object({
      organizationId: z.string(),
      title: z.string().min(2).max(150),
      slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
      description: z.string().max(1000).optional(),
      aiGenerated: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input, ...rest }) => {
      const orgRole = (rest as unknown as { orgRole: string | null }).orgRole;
      if (!canTeach(ctx.user.role, orgRole ?? undefined)) throw new TRPCError({ code: "FORBIDDEN" });

      const exists = await ctx.prisma.course.findUnique({
        where: { organizationId_slug: { organizationId: input.organizationId, slug: input.slug } },
      });
      if (exists) throw new TRPCError({ code: "CONFLICT", message: "Slug already used in this org" });

      const repoDir = `courses/${input.slug}`;
      const course = await ctx.prisma.course.create({
        data: {
          organizationId: input.organizationId,
          authorId: ctx.user.id,
          title: input.title,
          slug: input.slug,
          description: input.description,
          aiGenerated: input.aiGenerated,
          repoDir,
        },
      });

      await ctx.prisma.auditLog.create({ data: { actorId: ctx.user.id, action: "course.created", target: course.id } });

      // Award badge if this is the teacher's first course
      fireAndForget(async () => {
        const badge = await ctx.prisma.badge.findFirst({ where: { trigger: "TEACHER_CREATED" } });
        if (badge) {
          const existingCourses = await ctx.prisma.course.count({ where: { authorId: ctx.user.id } });
          if (existingCourses === 1) {
            await ctx.prisma.userBadge.upsert({
              where: { userId_badgeId: { userId: ctx.user.id, badgeId: badge.id } },
              update: {},
              create: { userId: ctx.user.id, badgeId: badge.id },
            });
          }
        }
        // Ensure GitHub dir exists
        const org = await ctx.prisma.organization.findUnique({
          where: { id: input.organizationId }, select: { slug: true },
        });
        if (org && process.env.GITHUB_TOKEN && process.env.GITHUB_ORG) {
          await ensureDirectory(org.slug, repoDir);
        }
      });

      return course;
    }),

  update: orgProcedure
    .input(z.object({
      organizationId: z.string(),
      courseId: z.string(),
      title: z.string().min(2).max(150).optional(),
      description: z.string().max(1000).optional(),
      status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
      visibleToRoles: z.string().optional(),
      coverUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input, ...rest }) => {
      const orgRole = (rest as unknown as { orgRole: string | null }).orgRole;
      if (!canTeach(ctx.user.role, orgRole ?? undefined)) throw new TRPCError({ code: "FORBIDDEN" });
      const { organizationId: _, courseId, ...data } = input;
      return ctx.prisma.course.update({ where: { id: courseId }, data });
    }),

  delete: orgProcedure
    .input(z.object({ organizationId: z.string(), courseId: z.string() }))
    .mutation(async ({ ctx, input, ...rest }) => {
      const orgRole = (rest as unknown as { orgRole: string | null }).orgRole;
      if (!canManageOrg(ctx.user.role, orgRole ?? undefined)) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.prisma.course.delete({ where: { id: input.courseId } });
    }),

  enroll: authedProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.prisma.course.findUnique({ where: { id: input.courseId } });
      if (!course || course.status !== "PUBLISHED") throw new TRPCError({ code: "NOT_FOUND" });

      const enrollment = await ctx.prisma.enrollment.upsert({
        where: { userId_courseId: { userId: ctx.user.id, courseId: input.courseId } },
        update: {},
        create: { userId: ctx.user.id, courseId: input.courseId },
      });

      // Award first-enrollment badge
      fireAndForget(async () => {
        const badge = await ctx.prisma.badge.findFirst({ where: { trigger: "FIRST_ENROLLMENT" } });
        if (badge) {
          const count = await ctx.prisma.enrollment.count({ where: { userId: ctx.user.id } });
          if (count === 1) {
            await ctx.prisma.userBadge.upsert({
              where: { userId_badgeId: { userId: ctx.user.id, badgeId: badge.id } },
              update: {},
              create: { userId: ctx.user.id, badgeId: badge.id },
            });
          }
        }
      });

      return enrollment;
    }),

  progress: authedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const enrollment = await ctx.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: ctx.user.id, courseId: input.courseId } },
        include: {
          completions: true,
          course: { select: { _count: { select: { lessons: true } } } },
        },
      });
      if (!enrollment) return null;
      const total = enrollment.course._count.lessons;
      const done = enrollment.completions.length;
      return { enrollment, total, done, pct: total ? Math.round((done / total) * 100) : 0 };
    }),
});
