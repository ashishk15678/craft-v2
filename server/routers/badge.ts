import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure, adminProcedure } from "@/server/trpc";

export const badgeRouter = router({
  // My badges
  mine: authedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.userBadge.findMany({
      where: { userId: ctx.user.id },
      include: { badge: true },
      orderBy: { awardedAt: "desc" },
    });
  }),

  // All badge definitions
  all: authedProcedure.query(async ({ ctx }) => ctx.prisma.badge.findMany({ orderBy: { name: "asc" } })),

  // User's badges (for profile/leaderboard)
  forUser: authedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.userBadge.findMany({
        where: { userId: input.userId },
        include: { badge: true },
        orderBy: { awardedAt: "desc" },
      });
    }),

  // Admin: manually award a badge
  award: adminProcedure
    .input(z.object({ userId: z.string(), badgeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [user, badge] = await Promise.all([
        ctx.prisma.user.findUnique({ where: { id: input.userId } }),
        ctx.prisma.badge.findUnique({ where: { id: input.badgeId } }),
      ]);
      if (!user || !badge) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.userBadge.upsert({
        where: { userId_badgeId: { userId: input.userId, badgeId: input.badgeId } },
        update: {},
        create: { userId: input.userId, badgeId: input.badgeId },
      });
    }),

  // Admin: create a new badge definition
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(60),
      description: z.string().max(300),
      icon: z.string().max(100),
      trigger: z.enum(["COURSE_COMPLETE", "LESSON_STREAK", "FIRST_ENROLLMENT", "QUIZ_PERFECT", "TEACHER_CREATED", "ORG_CREATED"]),
      threshold: z.number().int().min(1).default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.badge.create({ data: input });
    }),
});
