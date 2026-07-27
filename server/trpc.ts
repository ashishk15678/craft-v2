import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import superjson from "superjson";
import { getSession, type AuthUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { hasGlobalRole, type GlobalRole } from "@/lib/rbac";

// ─── Context ──────────────────────────────────────────────────────────────────

export type Context = {
  user: AuthUser | null;
  prisma: typeof prisma;
};

export const createContext = cache(async (): Promise<Context> => {
  const user = await getSession();
  return { user, prisma };
});

// ─── tRPC init ────────────────────────────────────────────────────────────────

export const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router          = t.router;
export const publicProcedure = t.procedure;

// ─── Reusable middlewares ─────────────────────────────────────────────────────

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const authedProcedure = t.procedure.use(isAuthed);

function requireGlobalRole(min: GlobalRole) {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.user || !hasGlobalRole(ctx.user.role, min))
      throw new TRPCError({ code: "FORBIDDEN", message: `Requires ${min} or above` });
    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

export const adminProcedure      = t.procedure.use(requireGlobalRole("ADMIN"));
export const superadminProcedure = t.procedure.use(requireGlobalRole("SUPERADMIN"));

/**
 * Org-scoped procedure.
 *
 * In tRPC v11 raw input isn't available in middleware; we parse it ourselves
 * via `getInput()` which is available on the middleware context.
 * Callers MUST include `organizationId: z.string()` in their input schema.
 */
export const orgProcedure = authedProcedure.use(async ({ ctx, input, next }) => {
  const { organizationId } = input as { organizationId?: string };
  if (!organizationId)
    throw new TRPCError({ code: "BAD_REQUEST", message: "organizationId required" });

  const member = await ctx.prisma.orgMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: ctx.user.id } },
    include: { organization: true },
  });

  if (!member && !hasGlobalRole(ctx.user.role, "ADMIN"))
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this organization" });

  return next({
    ctx: { ...ctx, member, orgRole: (member?.role ?? null) as string | null },
  });
});
