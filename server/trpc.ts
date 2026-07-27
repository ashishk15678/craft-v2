import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import superjson from "superjson";
import { getSession, type AuthUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { hasGlobalRole, hasOrgRole, type GlobalRole } from "@/lib/rbac";

// ─── Context ─────────────────────────────────────────────────────────────────

export type Context = {
  user: AuthUser | null;
  prisma: typeof prisma;
};

export const createContext = cache(async (): Promise<Context> => {
  const user = await getSession();
  return { user, prisma };
});

// ─── Init ─────────────────────────────────────────────────────────────────────

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

// ─── Auth middleware ───────────────────────────────────────────────────────────

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const authedProcedure = t.procedure.use(isAuthed);

/** Require a minimum global role */
export function requireGlobalRole(min: GlobalRole) {
  return isAuthed.unstable_pipe(({ ctx, next }) => {
    if (!hasGlobalRole(ctx.user.role, min)) {
      throw new TRPCError({ code: "FORBIDDEN", message: `Requires ${min} or above` });
    }
    return next({ ctx });
  });
}

export const adminProcedure = t.procedure.use(requireGlobalRole("ADMIN"));
export const superadminProcedure = t.procedure.use(requireGlobalRole("SUPERADMIN"));

/**
 * Org-scoped procedure — injects the caller's OrgMember row.
 * Input must include { organizationId: string }.
 */
export const orgProcedure = authedProcedure.use(async ({ ctx, rawInput, next }) => {
  const input = rawInput as { organizationId?: string };
  if (!input.organizationId) throw new TRPCError({ code: "BAD_REQUEST", message: "organizationId required" });

  const member = await ctx.prisma.orgMember.findUnique({
    where: { organizationId_userId: { organizationId: input.organizationId, userId: ctx.user.id } },
    include: { organization: true },
  });

  // ADMIN+ can always act on any org even without membership
  if (!member && !hasGlobalRole(ctx.user.role, "ADMIN")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this organization" });
  }

  return next({ ctx: { ...ctx, member, orgRole: (member?.role ?? null) as string | null } });
});
