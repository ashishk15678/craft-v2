import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

type Interaction = {
  type: "choice" | "short-text";
  options?: { id: string; label: string }[];
  answer?: string | string[];
  placeholder?: string;
};

function readInteraction(raw: string): Interaction {
  try {
    return JSON.parse(raw) as Interaction;
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Challenge interaction is invalid.",
    });
  }
}

function clientInteraction(interaction: Interaction) {
  const safeInteraction = { ...interaction };
  delete safeInteraction.answer;
  return safeInteraction;
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isCorrectAnswer(answer: string, interaction: Interaction) {
  const expected = (
    Array.isArray(interaction.answer)
      ? interaction.answer
      : [interaction.answer]
  ).filter((value): value is string => typeof value === "string");
  return expected.some(
    (value) => normalizeAnswer(answer) === normalizeAnswer(value),
  );
}

function isSameUtcDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function wasYesterday(date: Date, now: Date) {
  const yesterday = new Date(now);
  yesterday.setUTCDate(now.getUTCDate() - 1);
  return isSameUtcDay(date, yesterday);
}

export const practiceRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const challenges = await ctx.prisma.practiceChallenge.findMany({
      where: { published: true },
      orderBy: [{ category: "asc" }, { difficulty: "asc" }, { title: "asc" }],
      include: {
        progress: {
          where: { userId: ctx.user.id },
          select: { status: true, attempts: true, xpEarned: true },
        },
      },
    });

    return challenges.map(({ interaction, progress, ...challenge }) => ({
      ...challenge,
      interaction: clientInteraction(readInteraction(interaction)),
      progress: progress[0] ?? null,
    }));
  }),

  getChallenge: protectedProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const challenge = await ctx.prisma.practiceChallenge.findFirst({
        where: { slug: input.slug, published: true },
        include: {
          progress: {
            where: { userId: ctx.user.id },
            select: {
              status: true,
              attempts: true,
              solutionRevealed: true,
              xpEarned: true,
              completedAt: true,
            },
          },
        },
      });

      if (!challenge)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found.",
        });

      const { interaction, progress, solution, ...publicChallenge } = challenge;
      const userProgress = progress[0] ?? null;
      return {
        ...publicChallenge,
        interaction: clientInteraction(readInteraction(interaction)),
        progress: userProgress,
        solution:
          userProgress?.status === "COMPLETED" || userProgress?.solutionRevealed
            ? solution
            : null,
      };
    }),

  start: protectedProcedure
    .input(z.object({ challengeId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.prisma.practiceChallenge.findFirst({
        where: { id: input.challengeId, published: true },
        select: { id: true },
      });
      if (!challenge)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found.",
        });

      const [progress] = await ctx.prisma.$transaction([
        ctx.prisma.practiceProgress.upsert({
          where: {
            userId_challengeId: {
              userId: ctx.user.id,
              challengeId: input.challengeId,
            },
          },
          update: {},
          create: {
            userId: ctx.user.id,
            challengeId: input.challengeId,
            status: "IN_PROGRESS",
          },
        }),
        ctx.prisma.rewardProfile.upsert({
          where: { userId: ctx.user.id },
          update: {},
          create: { userId: ctx.user.id },
        }),
      ]);
      return progress;
    }),

  submit: protectedProcedure
    .input(
      z.object({
        challengeId: z.string().min(1),
        answer: z.string().min(1).max(10_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.prisma.practiceChallenge.findFirst({
        where: { id: input.challengeId, published: true },
      });
      if (!challenge)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found.",
        });

      const correct = isCorrectAnswer(
        input.answer,
        readInteraction(challenge.interaction),
      );
      const now = new Date();

      return ctx.prisma.$transaction(async (tx) => {
        const existing = await tx.practiceProgress.findUnique({
          where: {
            userId_challengeId: {
              userId: ctx.user.id,
              challengeId: challenge.id,
            },
          },
        });
        const firstCompletion = correct && existing?.status !== "COMPLETED";

        const progress = await tx.practiceProgress.upsert({
          where: {
            userId_challengeId: {
              userId: ctx.user.id,
              challengeId: challenge.id,
            },
          },
          update: {
            status: correct ? "COMPLETED" : "IN_PROGRESS",
            attempts: { increment: 1 },
            answer: input.answer,
            completedAt: correct ? (existing?.completedAt ?? now) : undefined,
            xpEarned: firstCompletion ? challenge.rewardXp : undefined,
          },
          create: {
            userId: ctx.user.id,
            challengeId: challenge.id,
            status: correct ? "COMPLETED" : "IN_PROGRESS",
            attempts: 1,
            answer: input.answer,
            completedAt: correct ? now : null,
            xpEarned: correct ? challenge.rewardXp : 0,
          },
        });

        let reward = null;
        if (firstCompletion || (correct && !existing)) {
          const profile = await tx.rewardProfile.findUnique({
            where: { userId: ctx.user.id },
          });
          const currentStreak =
            profile?.lastActiveAt && isSameUtcDay(profile.lastActiveAt, now)
              ? profile.currentStreak
              : profile?.lastActiveAt && wasYesterday(profile.lastActiveAt, now)
                ? profile.currentStreak + 1
                : 1;
          const xp = (profile?.xp ?? 0) + challenge.rewardXp;
          const level = Math.floor(xp / 500) + 1;
          reward = await tx.rewardProfile.upsert({
            where: { userId: ctx.user.id },
            update: {
              xp,
              level,
              currentStreak,
              longestStreak: Math.max(
                profile?.longestStreak ?? 0,
                currentStreak,
              ),
              completedCount: { increment: 1 },
              lastActiveAt: now,
            },
            create: {
              userId: ctx.user.id,
              xp,
              level,
              currentStreak,
              longestStreak: currentStreak,
              completedCount: 1,
              lastActiveAt: now,
            },
          });
        }

        return { correct, progress, reward };
      });
    }),

  revealSolution: protectedProcedure
    .input(z.object({ challengeId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.prisma.practiceChallenge.findFirst({
        where: { id: input.challengeId, published: true },
        select: { id: true },
      });
      if (!challenge)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found.",
        });

      const progress = await ctx.prisma.practiceProgress.upsert({
        where: {
          userId_challengeId: {
            userId: ctx.user.id,
            challengeId: input.challengeId,
          },
        },
        update: { solutionRevealed: true },
        create: {
          userId: ctx.user.id,
          challengeId: input.challengeId,
          status: "IN_PROGRESS",
          solutionRevealed: true,
        },
      });
      return progress;
    }),

  profile: protectedProcedure.query(async ({ ctx }) => {
    const [profile, recent] = await Promise.all([
      ctx.prisma.rewardProfile.findUnique({ where: { userId: ctx.user.id } }),
      ctx.prisma.practiceProgress.findMany({
        where: { userId: ctx.user.id },
        orderBy: { updatedAt: "desc" },
        take: 6,
        include: {
          challenge: {
            select: {
              slug: true,
              title: true,
              company: true,
              category: true,
              difficulty: true,
            },
          },
        },
      }),
    ]);
    return {
      profile: profile ?? {
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        completedCount: 0,
      },
      recent,
    };
  }),
});
