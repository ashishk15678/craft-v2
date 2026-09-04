import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/trpc";

const MAX_FREE = Number(process.env.MAX_FREE_TOPICS ?? 3);

export const topicRouter = router({
  /** List all topics the user created, optionally filtered to one org. */
  list: protectedProcedure
    .input(z.object({ organizationId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.topic.findMany({
        where: {
          creatorId: ctx.user.id,
          ...(input.organizationId
            ? { organizationId: input.organizationId }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          subject: true,
          aiGenerated: true,
          createdAt: true,
          organizationId: true,
          organization: { select: { name: true, slug: true } },
        },
      });
    }),

  /** Return the full content of a single topic. */
  get: protectedProcedure
    .input(z.object({ topicId: z.string() }))
    .query(async ({ ctx, input }) => {
      const topic = await ctx.prisma.topic.findUnique({
        where: { id: input.topicId },
        include: { organization: { select: { name: true, slug: true } } },
      });
      if (!topic) throw new TRPCError({ code: "NOT_FOUND" });
      if (topic.creatorId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });
      return topic;
    }),

  /** How many AI topics the current user has already generated. */
  freeUsage: protectedProcedure.query(async ({ ctx }) => {
    const used = await ctx.prisma.topic.count({
      where: { creatorId: ctx.user.id, aiGenerated: true },
    });
    return { used, max: MAX_FREE, remaining: Math.max(0, MAX_FREE - used) };
  }),

  /** Delete a topic the user owns. */
  delete: protectedProcedure
    .input(z.object({ topicId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const topic = await ctx.prisma.topic.findUnique({
        where: { id: input.topicId },
        select: { creatorId: true },
      });
      if (!topic) throw new TRPCError({ code: "NOT_FOUND" });
      if (topic.creatorId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });
      await ctx.prisma.topic.delete({ where: { id: input.topicId } });
      return { deleted: true };
    }),
});
