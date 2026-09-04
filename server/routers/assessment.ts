/**
 * Assessment router
 *
 * Two types of test:
 *   PRACTICE  — relaxed, hints available, retries unlimited, NO lockdown
 *   ASSESSMENT — timed, locked environment, violations logged, auto-submitted on expiry
 *
 * Violations logged (client fires these server-side):
 *   tab_hidden, window_blur, fullscreen_exit, copy_attempt, paste_attempt,
 *   right_click, devtools_open, context_menu
 *
 * Security note: the answer key lives only server-side. The `interaction`
 * JSON stored in PracticeChallenge has the `answer` field removed before
 * being sent to the client. Grading always runs server-side on submit.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../trpc";
import { hasGlobalRole } from "@/lib/rbac";
import { prisma as _prismaType } from "@/lib/db";

type PrismaClient = typeof _prismaType;

// ─── Internal types ───────────────────────────────────────────────────────────

type Interaction = {
  answer?: string | string[];
  type: "choice" | "short-text";
  options?: { id: string; label: string }[];
  placeholder?: string;
};

type ViolationEntry = { event: string; ts: number };

// ─── Pure helpers (no I/O) ────────────────────────────────────────────────────

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

function parseInteraction(raw: string): Interaction {
  try {
    return JSON.parse(raw) as Interaction;
  } catch {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Corrupt question interaction" });
  }
}

/** Strip the answer key before sending to client */
function clientInteraction(raw: string): Omit<Interaction, "answer"> {
  const { answer: _stripped, ...safe } = parseInteraction(raw);
  return safe;
}

function parseIds(raw: string): string[] {
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

function parseViolations(raw: string): ViolationEntry[] {
  try { return JSON.parse(raw) as ViolationEntry[]; } catch { return []; }
}

function isCorrect(raw: string, answer: string): boolean {
  const { answer: expected } = parseInteraction(raw);
  const choices = Array.isArray(expected) ? expected : [expected ?? ""];
  return choices.some(
    (v) => typeof v === "string" && normalize(answer) === normalize(v),
  );
}

/** Compute level from total XP: every 500 XP = 1 level */
function xpToLevel(xp: number) { return Math.floor(xp / 500) + 1; }

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const zOption = z.object({ id: z.string().min(1), label: z.string().min(1) });

const zInteractionInput = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("choice"),
    options: z.array(zOption).min(2).max(6),
    answer: z.union([z.string(), z.array(z.string())]),
  }),
  z.object({
    type: z.literal("short-text"),
    placeholder: z.string().optional(),
    answer: z.union([z.string(), z.array(z.string())]),
  }),
]);

const zCreateQuestion = z.object({
  company:    z.string().min(1).max(80),
  category:   z.string().min(1).max(80),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  title:      z.string().min(3).max(200),
  summary:    z.string().min(3).max(500),
  prompt:     z.string().min(10).max(2000),
  hint:       z.string().min(5).max(1000),
  solution:   z.string().min(10).max(2000),
  rewardXp:   z.number().int().min(50).max(500).default(100),
  interaction: zInteractionInput,
});

const zCreateAssessment = z.object({
  title:       z.string().min(3).max(200),
  description: z.string().min(10).max(1000),
  durationMin: z.number().int().min(5).max(180),
  questionIds: z.array(z.string().cuid()).min(1).max(50),
  rewardXp:    z.number().int().min(50).max(1000).default(150),
  orgId:       z.string().cuid().optional(),
  published:   z.boolean().default(false),
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const assessmentRouter = router({

  // ── Student-facing: list available assessments ──────────────────────────────

  list: protectedProcedure
    .input(z.object({ orgId: z.string().cuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const assessments = await ctx.prisma.assessment.findMany({
        where: {
          published: true,
          ...(input?.orgId ? { OR: [{ orgId: input.orgId }, { orgId: null }] } : {}),
        },
        orderBy: { title: "asc" },
        include: {
          attempts: {
            where: { userId: ctx.user.id, submittedAt: { not: null } },
            orderBy: { submittedAt: "desc" },
            take: 1,
            select: { score: true, submittedAt: true, violations: true, autoSubmitted: true },
          },
        },
      });
      return assessments.map(({ questionIds, attempts, ...rest }) => ({
        ...rest,
        questionCount: parseIds(questionIds).length,
        latest: attempts[0]
          ? {
              score: attempts[0].score,
              submittedAt: attempts[0].submittedAt,
              violationCount: parseViolations(attempts[0].violations).length,
              autoSubmitted: attempts[0].autoSubmitted,
            }
          : null,
      }));
    }),

  // ── Start or resume an attempt ───────────────────────────────────────────────

  start: protectedProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const assessment = await ctx.prisma.assessment.findFirst({
        where: { slug: input.slug, published: true },
      });
      if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });

      // Resume an in-flight attempt (not yet submitted, not expired)
      const deadlineCutoff = new Date(Date.now() - assessment.durationMin * 60_000);
      const existing = await ctx.prisma.assessmentAttempt.findFirst({
        where: {
          userId: ctx.user.id,
          assessmentId: assessment.id,
          submittedAt: null,
          startedAt: { gt: deadlineCutoff },
        },
        orderBy: { startedAt: "desc" },
      });
      if (existing) return existing;

      return ctx.prisma.assessmentAttempt.create({
        data: { userId: ctx.user.id, assessmentId: assessment.id },
      });
    }),

  // ── Fetch attempt + questions (answer key stripped) ─────────────────────────

  attempt: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const attempt = await ctx.prisma.assessmentAttempt.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        include: { assessment: true },
      });
      if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });

      const questionIds = parseIds(attempt.assessment.questionIds);
      const rows = await ctx.prisma.practiceChallenge.findMany({
        where: { id: { in: questionIds }, published: true },
      });
      const byId = new Map(rows.map((r) => [r.id, r]));
      const submittedAnswers = JSON.parse(attempt.answers) as Record<string, string>;
      const isDone = !!attempt.submittedAt;

      const questions = questionIds.flatMap((qid) => {
        const q = byId.get(qid);
        if (!q) return [];
        return [{
          id: q.id,
          title: q.title,
          prompt: q.prompt,
          company: q.company,
          category: q.category,
          difficulty: q.difficulty,
          // Strip answer key — never sent to client before submission
          interaction: clientInteraction(q.interaction),
          answer: submittedAnswers[q.id] ?? null,
          // Solution only visible after submission
          solution: isDone ? q.solution : null,
          // Was this question answered correctly? Only after submission.
          correct: isDone
            ? isCorrect(q.interaction, submittedAnswers[q.id] ?? "")
            : null,
        }];
      });

      const elapsed = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
      const durationSec = attempt.assessment.durationMin * 60;

      return {
        id: attempt.id,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        autoSubmitted: attempt.autoSubmitted,
        score: attempt.score,
        violations: isDone ? parseViolations(attempt.violations) : [],
        violationCount: parseViolations(attempt.violations).length,
        durationSec,
        remainingSec: Math.max(0, durationSec - elapsed),
        assessment: {
          id: attempt.assessment.id,
          title: attempt.assessment.title,
          description: attempt.assessment.description,
          rewardXp: attempt.assessment.rewardXp,
        },
        questions,
      };
    }),

  // ── Log a proctoring violation ───────────────────────────────────────────────
  // Fires from the client lockdown layer on every suspicious event.
  // This is fire-and-forget from the client — kept cheap (single UPDATE).

  logViolation: protectedProcedure
    .input(z.object({
      attemptId: z.string().cuid(),
      event: z.enum([
        "tab_hidden",
        "window_blur",
        "fullscreen_exit",
        "copy_attempt",
        "paste_attempt",
        "right_click",
        "context_menu",
        "devtools_resize",
      ]),
      ts: z.number().int(),
    }))
    .mutation(async ({ ctx, input }) => {
      const attempt = await ctx.prisma.assessmentAttempt.findFirst({
        where: { id: input.attemptId, userId: ctx.user.id, submittedAt: null },
        select: { id: true, violations: true },
      });
      if (!attempt) return { ok: false }; // already submitted or not found — ignore

      const existing = parseViolations(attempt.violations);
      existing.push({ event: input.event, ts: input.ts });

      await ctx.prisma.assessmentAttempt.update({
        where: { id: attempt.id },
        data: { violations: JSON.stringify(existing) },
      });
      return { ok: true, total: existing.length };
    }),

  // ── Auto-submit on timer expiry ──────────────────────────────────────────────
  // Called by the client when remainingSec hits 0. Server re-validates the deadline
  // before writing to prevent early calls gaming the system.

  autoSubmit: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
      answers: z.record(z.string(), z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const attempt = await ctx.prisma.assessmentAttempt.findFirst({
        where: { id: input.id, userId: ctx.user.id, submittedAt: null },
        include: { assessment: true },
      });
      if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });

      // Server-side deadline gate: must actually be expired (± 5 s grace)
      const deadline = attempt.startedAt.getTime() + attempt.assessment.durationMin * 60_000;
      if (Date.now() < deadline - 5_000) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Timer has not expired yet" });
      }

      return gradeAndCommit(ctx.prisma, ctx.user.id, attempt, input.answers, true);
    }),

  // ── Manual submit ────────────────────────────────────────────────────────────

  submit: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
      answers: z.record(z.string(), z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const attempt = await ctx.prisma.assessmentAttempt.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        include: { assessment: true },
      });
      if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });
      if (attempt.submittedAt) return { score: attempt.score ?? 0, total: 0, reward: 0 };

      // Reject if timer already expired (shouldn't happen — client auto-submits first)
      const deadline = attempt.startedAt.getTime() + attempt.assessment.durationMin * 60_000;
      if (Date.now() > deadline + 10_000) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Assessment expired" });
      }

      return gradeAndCommit(ctx.prisma, ctx.user.id, attempt, input.answers, false);
    }),

  // ─────────────────────────────────────────────────────────────────────────────
  // Teacher/Admin CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Question bank ─────────────────────────────────────────────────────────────

  listQuestions: protectedProcedure
    .input(z.object({
      search:     z.string().optional(),
      category:   z.string().optional(),
      difficulty: z.string().optional(),
      page:       z.number().int().min(1).default(1),
    }))
    .query(async ({ ctx, input }) => {
      const isTeacher = hasGlobalRole(ctx.user.role, "TEACHER");
      if (!isTeacher) throw new TRPCError({ code: "FORBIDDEN" });

      const take = 30;
      const skip = (input.page - 1) * take;

      const where = {
        ...(input.search
          ? { OR: [
              { title: { contains: input.search } },
              { company: { contains: input.search } },
              { prompt: { contains: input.search } },
            ]}
          : {}),
        ...(input.category   ? { category: input.category }     : {}),
        ...(input.difficulty ? { difficulty: input.difficulty }  : {}),
      };

      const [total, questions] = await Promise.all([
        ctx.prisma.practiceChallenge.count({ where }),
        ctx.prisma.practiceChallenge.findMany({
          where,
          orderBy: [{ category: "asc" }, { difficulty: "asc" }, { title: "asc" }],
          take,
          skip,
          select: {
            id: true, slug: true, title: true, company: true,
            category: true, difficulty: true, rewardXp: true,
            published: true, authorId: true, createdAt: true,
            _count: { select: { progress: true } },
          },
        }),
      ]);

      return { questions, total, pages: Math.ceil(total / take) };
    }),

  createQuestion: protectedProcedure
    .input(zCreateQuestion)
    .mutation(async ({ ctx, input }) => {
      if (!hasGlobalRole(ctx.user.role, "TEACHER")) throw new TRPCError({ code: "FORBIDDEN" });

      const base = input.title
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
      // Ensure unique slug
      let slug = base;
      let i = 0;
      while (await ctx.prisma.practiceChallenge.findUnique({ where: { slug }, select: { id: true } })) {
        slug = `${base}-${++i}`;
      }

      return ctx.prisma.practiceChallenge.create({
        data: {
          slug,
          company:    input.company,
          category:   input.category,
          difficulty: input.difficulty,
          title:      input.title,
          summary:    input.summary,
          prompt:     input.prompt,
          hint:       input.hint,
          solution:   input.solution,
          rewardXp:   input.rewardXp,
          interaction: JSON.stringify(input.interaction),
          authorId:   ctx.user.id,
          published:  false, // requires explicit publish
        },
      });
    }),

  updateQuestion: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
      data: zCreateQuestion.partial().extend({ published: z.boolean().optional() }),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!hasGlobalRole(ctx.user.role, "TEACHER")) throw new TRPCError({ code: "FORBIDDEN" });

      const q = await ctx.prisma.practiceChallenge.findUnique({ where: { id: input.id } });
      if (!q) throw new TRPCError({ code: "NOT_FOUND" });

      // Teachers can only edit their own questions; admins can edit any
      if (q.authorId !== ctx.user.id && !hasGlobalRole(ctx.user.role, "ADMIN")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { interaction: interactionInput, ...rest } = input.data;
      return ctx.prisma.practiceChallenge.update({
        where: { id: input.id },
        data: {
          ...rest,
          ...(interactionInput ? { interaction: JSON.stringify(interactionInput) } : {}),
        },
      });
    }),

  deleteQuestion: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.practiceChallenge.delete({ where: { id: input.id } });
      return { deleted: true };
    }),

  // ── Assessment builder ────────────────────────────────────────────────────────

  listAssessments: protectedProcedure.query(async ({ ctx }) => {
    if (!hasGlobalRole(ctx.user.role, "TEACHER")) throw new TRPCError({ code: "FORBIDDEN" });
    return ctx.prisma.assessment.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { attempts: true } } },
    });
  }),

  createAssessment: protectedProcedure
    .input(zCreateAssessment)
    .mutation(async ({ ctx, input }) => {
      if (!hasGlobalRole(ctx.user.role, "TEACHER")) throw new TRPCError({ code: "FORBIDDEN" });

      const base = input.title
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
      let slug = base;
      let i = 0;
      while (await ctx.prisma.assessment.findUnique({ where: { slug }, select: { id: true } })) {
        slug = `${base}-${++i}`;
      }

      // Validate all question IDs exist
      const found = await ctx.prisma.practiceChallenge.findMany({
        where: { id: { in: input.questionIds }, published: true },
        select: { id: true },
      });
      if (found.length !== input.questionIds.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Some questions are unpublished or do not exist" });
      }

      return ctx.prisma.assessment.create({
        data: {
          slug,
          title:       input.title,
          description: input.description,
          durationMin: input.durationMin,
          questionIds: JSON.stringify(input.questionIds),
          rewardXp:    input.rewardXp,
          orgId:       input.orgId ?? null,
          published:   input.published,
          authorId:    ctx.user.id,
        },
      });
    }),

  updateAssessment: protectedProcedure
    .input(z.object({
      id:   z.string().cuid(),
      data: zCreateAssessment.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!hasGlobalRole(ctx.user.role, "TEACHER")) throw new TRPCError({ code: "FORBIDDEN" });

      const a = await ctx.prisma.assessment.findUnique({ where: { id: input.id } });
      if (!a) throw new TRPCError({ code: "NOT_FOUND" });
      if (a.authorId !== ctx.user.id && !hasGlobalRole(ctx.user.role, "ADMIN")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { questionIds, ...rest } = input.data;
      return ctx.prisma.assessment.update({
        where: { id: input.id },
        data: {
          ...rest,
          ...(questionIds ? { questionIds: JSON.stringify(questionIds) } : {}),
        },
      });
    }),

  // ── Teacher analytics: view attempt results + violation report ───────────────

  attemptResults: protectedProcedure
    .input(z.object({ assessmentId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      if (!hasGlobalRole(ctx.user.role, "TEACHER")) throw new TRPCError({ code: "FORBIDDEN" });

      const attempts = await ctx.prisma.assessmentAttempt.findMany({
        where: { assessmentId: input.assessmentId, submittedAt: { not: null } },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { submittedAt: "desc" },
      });

      return attempts.map((a) => ({
        id: a.id,
        user: a.user,
        score: a.score,
        submittedAt: a.submittedAt,
        autoSubmitted: a.autoSubmitted,
        violationCount: parseViolations(a.violations).length,
        violations: parseViolations(a.violations),
        startedAt: a.startedAt,
      }));
    }),
});

// ─── Shared grading logic ─────────────────────────────────────────────────────

async function gradeAndCommit(
  prisma: PrismaClient,
  userId: string,
  attempt: {
    id: string;
    assessment: { durationMin: number; questionIds: string; rewardXp: number };
  },
  rawAnswers: Record<string, string>,
  auto: boolean,
) {
  const questionIds = parseIds(attempt.assessment.questionIds);
  const questions = await prisma.practiceChallenge.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, interaction: true },
  });

  const correctCount = questions.filter((q) =>
    isCorrect(q.interaction, rawAnswers[q.id] ?? ""),
  ).length;

  const score  = Math.round((correctCount / Math.max(questions.length, 1)) * 100);
  const reward = Math.round((attempt.assessment.rewardXp * score) / 100);

  await prisma.$transaction(async (tx) => {
    await tx.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        answers:       JSON.stringify(rawAnswers),
        score,
        submittedAt:   new Date(),
        autoSubmitted: auto,
      },
    });

    if (reward > 0) {
      const existing = await tx.rewardProfile.findUnique({ where: { userId }, select: { xp: true } });
      const newXp = (existing?.xp ?? 0) + reward;
      await tx.rewardProfile.upsert({
        where: { userId },
        update: { xp: newXp, level: xpToLevel(newXp), lastActiveAt: new Date() },
        create: {
          userId,
          xp: newXp,
          level: xpToLevel(newXp),
          currentStreak: 1,
          longestStreak: 1,
          completedCount: 1,
          lastActiveAt: new Date(),
        },
      });
    }
  });

  return { score, total: questions.length, reward, autoSubmitted: auto };
}
