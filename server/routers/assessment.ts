import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

type Interaction = {
  answer?: string | string[];
  type: string;
  options?: { id: string; label: string }[];
  placeholder?: string;
};
const normalize = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");
function interaction(raw: string) {
  return JSON.parse(raw) as Interaction;
}
function safe(raw: string) {
  const value = { ...interaction(raw) };
  delete value.answer;
  return value;
}
function ids(raw: string) {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export const assessmentRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const assessments = await ctx.prisma.assessment.findMany({
      where: { published: true },
      orderBy: { title: "asc" },
      include: {
        attempts: {
          where: { userId: ctx.user.id, submittedAt: { not: null } },
          orderBy: { submittedAt: "desc" },
          take: 1,
          select: { score: true, submittedAt: true },
        },
      },
    });
    return assessments.map(({ questionIds, attempts, ...assessment }) => ({
      ...assessment,
      questionCount: ids(questionIds).length,
      latest: attempts[0] ?? null,
    }));
  }),

  start: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const assessment = await ctx.prisma.assessment.findFirst({
        where: { slug: input.slug, published: true },
      });
      if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
      const existing = await ctx.prisma.assessmentAttempt.findFirst({
        where: {
          userId: ctx.user.id,
          assessmentId: assessment.id,
          submittedAt: null,
        },
        orderBy: { startedAt: "desc" },
      });
      return (
        existing ??
        ctx.prisma.assessmentAttempt.create({
          data: { userId: ctx.user.id, assessmentId: assessment.id },
        })
      );
    }),

  attempt: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const attempt = await ctx.prisma.assessmentAttempt.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        include: { assessment: true },
      });
      if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });
      const questionIds = ids(attempt.assessment.questionIds);
      const rows = await ctx.prisma.practiceChallenge.findMany({
        where: { id: { in: questionIds }, published: true },
      });
      const byId = new Map(rows.map((row) => [row.id, row]));
      const answers = JSON.parse(attempt.answers) as Record<string, string>;
      const questions = questionIds.flatMap((id) => {
        const question = byId.get(id);
        return question
          ? [
              {
                id: question.id,
                title: question.title,
                prompt: question.prompt,
                company: question.company,
                category: question.category,
                difficulty: question.difficulty,
                interaction: safe(question.interaction),
                answer: answers[question.id] ?? null,
                solution: attempt.submittedAt ? question.solution : null,
              },
            ]
          : [];
      });
      const elapsed = Math.floor(
        (Date.now() - attempt.startedAt.getTime()) / 1000,
      );
      return {
        id: attempt.id,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        score: attempt.score,
        durationSec: attempt.assessment.durationMin * 60,
        remainingSec: Math.max(
          0,
          attempt.assessment.durationMin * 60 - elapsed,
        ),
        assessment: {
          title: attempt.assessment.title,
          description: attempt.assessment.description,
          rewardXp: attempt.assessment.rewardXp,
        },
        questions,
      };
    }),

  submit: protectedProcedure
    .input(
      z.object({ id: z.string(), answers: z.record(z.string(), z.string()) }),
    )
    .mutation(async ({ ctx, input }) => {
      const attempt = await ctx.prisma.assessmentAttempt.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        include: { assessment: true },
      });
      if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });
      if (attempt.submittedAt)
        return { score: attempt.score ?? 0, total: 0, reward: 0 };
      if (
        attempt.startedAt.getTime() + attempt.assessment.durationMin * 60_000 <=
        Date.now()
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Assessment expired",
        });
      }
      const questionIds = ids(attempt.assessment.questionIds);
      const questions = await ctx.prisma.practiceChallenge.findMany({
        where: { id: { in: questionIds } },
      });
      const correct = questions.filter((question) => {
        const expected = interaction(question.interaction).answer;
        const choices = Array.isArray(expected) ? expected : [expected];
        return choices.some(
          (value) =>
            typeof value === "string" &&
            normalize(input.answers[question.id] ?? "") === normalize(value),
        );
      }).length;
      const score = Math.round((correct / Math.max(questions.length, 1)) * 100);
      const reward = Math.round((attempt.assessment.rewardXp * score) / 100);
      await ctx.prisma.$transaction(async (tx) => {
        await tx.assessmentAttempt.update({
          where: { id: attempt.id },
          data: {
            answers: JSON.stringify(input.answers),
            score,
            submittedAt: new Date(),
          },
        });
        if (reward) {
          const profile = await tx.rewardProfile.findUnique({
            where: { userId: ctx.user.id },
          });
          const xp = (profile?.xp ?? 0) + reward;
          await tx.rewardProfile.upsert({
            where: { userId: ctx.user.id },
            update: {
              xp,
              level: Math.floor(xp / 500) + 1,
              lastActiveAt: new Date(),
            },
            create: {
              userId: ctx.user.id,
              xp,
              level: Math.floor(xp / 500) + 1,
              lastActiveAt: new Date(),
            },
          });
        }
      });
      return { score, total: questions.length, reward };
    }),
});
