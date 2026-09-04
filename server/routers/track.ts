// trpc.ts
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

export const trackRouter = router({
  getPublicTracks: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.track.findMany({
      where: { isPublic: true },
      include: {
        modules: {
          include: {
            items: true,
          },
        },
      },
    });
  }),

  getTrackById: publicProcedure
    .input(z.object({ trackId: z.string() }))
    .query(async ({ ctx, input }) => {
      const track = await ctx.prisma.track.findUnique({
        where: { id: input.trackId },
        include: {
          modules: {
            include: {
              items: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      });
      if (!track) throw new TRPCError({ code: "NOT_FOUND" });
      return track;
    }),

  startTrack: protectedProcedure
    .input(z.object({ trackId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const enrollment = await ctx.prisma.trackEnrollment.upsert({
        where: {
          userId_trackId: {
            userId: ctx.user.id,
            trackId: input.trackId,
          },
        },
        update: {},
        create: {
          userId: ctx.user.id,
          trackId: input.trackId,
        },
      });
      return enrollment;
    }),

  getMyLearnings: protectedProcedure.query(async ({ ctx }) => {
    const enrollments = await ctx.prisma.trackEnrollment.findMany({
      where: { userId: ctx.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        track: {
          include: {
            modules: {
              select: {
                id: true,
                items: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    const trackProgress = await ctx.prisma.trackItemProgress.findMany({
      where: {
        userId: ctx.user.id,
        item: {
          module: { track: { enrollments: { some: { userId: ctx.user.id } } } },
        },
      },
    });

    return { enrollments, trackProgress };
  }),

  getLearningById: protectedProcedure
    .input(z.object({ trackId: z.string() }))
    .query(async ({ ctx, input }) => {
      const enrollment = await ctx.prisma.trackEnrollment.findUnique({
        where: {
          userId_trackId: {
            userId: ctx.user.id,
            trackId: input.trackId,
          },
        },
        include: {
          track: {
            include: {
              modules: {
                orderBy: { order: "asc" },
                include: { items: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      });

      if (!enrollment) throw new TRPCError({ code: "NOT_FOUND" });

      const trackProgress = await ctx.prisma.trackItemProgress.findMany({
        where: {
          userId: ctx.user.id,
          item: { module: { trackId: input.trackId } },
        },
      });

      return { track: enrollment.track, trackProgress };
    }),

  updateProgress: protectedProcedure
    .input(z.object({ itemId: z.string(), completed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const progress = await ctx.prisma.trackItemProgress.upsert({
        where: {
          userId_itemId: {
            userId: ctx.user.id,
            itemId: input.itemId,
          },
        },
        update: {
          completed: input.completed,
        },
        create: {
          userId: ctx.user.id,
          itemId: input.itemId,
          completed: input.completed,
        },
      });
      return progress;
    }),
});
