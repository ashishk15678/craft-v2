import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { router, authedProcedure, orgProcedure, adminProcedure } from "@/server/trpc";
import { canManageOrg, hasGlobalRole } from "@/lib/rbac";
import { provisionOrgRepo } from "@/lib/github";

function fireAndForget(fn: () => Promise<unknown>) {
  fn().catch((e: unknown) => console.warn("[bg]", e instanceof Error ? e.message : e));
}

export const orgRouter = router({
  // List all orgs the caller is a member of (or all if ADMIN+)
  list: authedProcedure.query(async ({ ctx }) => {
    if (hasGlobalRole(ctx.user.role, "ADMIN")) {
      return ctx.prisma.organization.findMany({
        include: { _count: { select: { members: true, courses: true } } },
        orderBy: { createdAt: "desc" },
      });
    }
    const memberships = await ctx.prisma.orgMember.findMany({
      where: { userId: ctx.user.id },
      include: {
        organization: { include: { _count: { select: { members: true, courses: true } } } },
      },
    });
    return memberships.map((m) => ({ ...m.organization, myRole: m.role }));
  }),

  get: authedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.prisma.organization.findUnique({
        where: { slug: input.slug },
        include: { owner: { select: { id: true, name: true, username: true } }, _count: { select: { members: true, courses: true } } },
      });
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      const member = await ctx.prisma.orgMember.findUnique({
        where: { organizationId_userId: { organizationId: org.id, userId: ctx.user.id } },
      });
      return { ...org, myRole: member?.role ?? null };
    }),

  create: authedProcedure
    .input(z.object({
      name: z.string().min(2).max(80),
      slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
      description: z.string().max(500).optional(),
      visibility: z.enum(["PUBLIC", "INVITE", "PRIVATE"]).default("PUBLIC"),
    }))
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.prisma.organization.findUnique({ where: { slug: input.slug } });
      if (exists) throw new TRPCError({ code: "CONFLICT", message: "Slug already taken" });

      const joinToken = input.visibility !== "PUBLIC" ? randomBytes(20).toString("hex") : null;

      const org = await ctx.prisma.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          visibility: input.visibility,
          joinToken,
          ownerId: ctx.user.id,
          members: { create: { userId: ctx.user.id, role: "ORG_OWNER" } },
        },
      });

      await ctx.prisma.auditLog.create({ data: { actorId: ctx.user.id, action: "org.created", target: org.id } });

      // Award ORG_CREATED badge asynchronously
      fireAndForget(async () => {
        const badge = await ctx.prisma.badge.findFirst({ where: { trigger: "ORG_CREATED" } });
        if (badge) {
          await ctx.prisma.userBadge.upsert({
            where: { userId_badgeId: { userId: ctx.user.id, badgeId: badge.id } },
            update: {},
            create: { userId: ctx.user.id, badgeId: badge.id },
          });
        }
        // Provision GitHub repo
        if (process.env.GITHUB_TOKEN && process.env.GITHUB_ORG) {
          const repo = await provisionOrgRepo(input.slug, { description: input.description });
          await ctx.prisma.organization.update({
            where: { id: org.id },
            data: { githubRepo: repo.fullName },
          });
        }
      });

      return org;
    }),

  update: orgProcedure
    .input(z.object({
      organizationId: z.string(),
      name: z.string().min(2).max(80).optional(),
      description: z.string().max(500).optional(),
      visibility: z.enum(["PUBLIC", "INVITE", "PRIVATE"]).optional(),
      logoUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input, ...rest }) => {
      const orgRole = (rest as unknown as { orgRole: string | null }).orgRole;
      if (!canManageOrg(ctx.user.role, orgRole ?? undefined)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { organizationId, ...data } = input;
      const joinToken =
        data.visibility && data.visibility !== "PUBLIC"
          ? randomBytes(20).toString("hex")
          : data.visibility === "PUBLIC"
          ? null
          : undefined;
      return ctx.prisma.organization.update({
        where: { id: organizationId },
        data: { ...data, ...(joinToken !== undefined ? { joinToken } : {}) },
      });
    }),

  rotateInviteToken: orgProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input, ...rest }) => {
      const orgRole = (rest as unknown as { orgRole: string | null }).orgRole;
      if (!canManageOrg(ctx.user.role, orgRole ?? undefined)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const token = randomBytes(20).toString("hex");
      return ctx.prisma.organization.update({ where: { id: input.organizationId }, data: { joinToken: token } });
    }),

  join: authedProcedure
    .input(z.object({ slug: z.string(), token: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.prisma.organization.findUnique({ where: { slug: input.slug } });
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });

      if (org.visibility === "PRIVATE") throw new TRPCError({ code: "FORBIDDEN", message: "This org is private" });
      if (org.visibility === "INVITE") {
        if (!input.token || org.joinToken !== input.token)
          throw new TRPCError({ code: "FORBIDDEN", message: "Invalid invite token" });
      }

      return ctx.prisma.orgMember.upsert({
        where: { organizationId_userId: { organizationId: org.id, userId: ctx.user.id } },
        update: {},
        create: { organizationId: org.id, userId: ctx.user.id, role: "STUDENT" },
      });
    }),

  members: orgProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.orgMember.findMany({
        where: { organizationId: input.organizationId },
        include: { user: { select: { id: true, name: true, email: true, username: true, image: true } } },
        orderBy: { joinedAt: "asc" },
      });
    }),

  updateMemberRole: orgProcedure
    .input(z.object({
      organizationId: z.string(),
      memberId: z.string(),
      role: z.enum(["ORG_OWNER", "TEACHER", "STUDENT"]),
    }))
    .mutation(async ({ ctx, input, ...rest }) => {
      const orgRole = (rest as unknown as { orgRole: string | null }).orgRole;
      if (!canManageOrg(ctx.user.role, orgRole ?? undefined)) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.prisma.orgMember.update({ where: { id: input.memberId }, data: { role: input.role } });
    }),

  removeMember: orgProcedure
    .input(z.object({ organizationId: z.string(), memberId: z.string() }))
    .mutation(async ({ ctx, input, ...rest }) => {
      const orgRole = (rest as unknown as { orgRole: string | null }).orgRole;
      if (!canManageOrg(ctx.user.role, orgRole ?? undefined)) throw new TRPCError({ code: "FORBIDDEN" });
      const member = await ctx.prisma.orgMember.findUnique({ where: { id: input.memberId } });
      if (!member) throw new TRPCError({ code: "NOT_FOUND" });
      if (member.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove yourself" });
      return ctx.prisma.orgMember.delete({ where: { id: input.memberId } });
    }),

  // Admin-only: list all orgs with full data
  adminList: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.organization.findMany({
      include: {
        owner: { select: { name: true, email: true } },
        _count: { select: { members: true, courses: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),
});
