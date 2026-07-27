import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { router, authedProcedure } from "@/server/trpc";
import { hasGlobalRole } from "@/lib/rbac";

export const pageRouter = router({
  list: authedProcedure
    .input(z.object({ courseId: z.string().optional(), organizationId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.page.findMany({
        where: {
          ...(input.courseId ? { courseId: input.courseId } : {}),
          ...(input.organizationId ? { organizationId: input.organizationId } : {}),
          OR: [
            { authorId: ctx.user.id },
            { access: "ORG" },
            // shared pages are fetchable but access is checked on get
          ],
        },
        include: { author: { select: { name: true, username: true } } },
        orderBy: { updatedAt: "desc" },
      });
    }),

  get: authedProcedure
    .input(z.object({ pageId: z.string(), shareToken: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const page = await ctx.prisma.page.findUnique({
        where: { id: input.pageId },
        include: {
          author: { select: { id: true, name: true, username: true } },
          comments: {
            include: { author: { select: { id: true, name: true, username: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      });
      if (!page) throw new TRPCError({ code: "NOT_FOUND" });

      const isAuthor = page.authorId === ctx.user.id;
      const isAdmin = hasGlobalRole(ctx.user.role, "ADMIN");
      const isOrgMember = page.organizationId
        ? !!(await ctx.prisma.orgMember.findUnique({
            where: { organizationId_userId: { organizationId: page.organizationId, userId: ctx.user.id } },
          }))
        : false;

      // Access control
      if (page.access === "PRIVATE" && !isAuthor && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      if (page.access === "ORG" && !isOrgMember && !isAuthor && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      if (["VIEW", "COMMENT", "EDIT"].includes(page.access)) {
        if (!isAuthor && !isAdmin && !isOrgMember) {
          if (!input.shareToken || page.shareToken !== input.shareToken) throw new TRPCError({ code: "FORBIDDEN" });
        }
      }

      return { ...page, canEdit: isAuthor || isAdmin || (page.access === "EDIT" && input.shareToken === page.shareToken) };
    }),

  create: authedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      courseId: z.string().optional(),
      organizationId: z.string().optional(),
      access: z.enum(["PRIVATE", "ORG", "VIEW", "COMMENT", "EDIT"]).default("PRIVATE"),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.page.create({
        data: {
          ...input,
          authorId: ctx.user.id,
          shareToken: input.access !== "PRIVATE" && input.access !== "ORG"
            ? randomBytes(16).toString("hex")
            : null,
        },
      });
    }),

  update: authedProcedure
    .input(z.object({
      pageId: z.string(),
      title: z.string().min(1).max(200).optional(),
      content: z.string().optional(),
      access: z.enum(["PRIVATE", "ORG", "VIEW", "COMMENT", "EDIT"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const page = await ctx.prisma.page.findUnique({ where: { id: input.pageId } });
      if (!page) throw new TRPCError({ code: "NOT_FOUND" });
      if (page.authorId !== ctx.user.id && !hasGlobalRole(ctx.user.role, "ADMIN")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { pageId, access, ...rest } = input;
      const shareToken =
        access && access !== "PRIVATE" && access !== "ORG"
          ? page.shareToken ?? randomBytes(16).toString("hex")
          : access === "PRIVATE" || access === "ORG"
          ? null
          : undefined;
      return ctx.prisma.page.update({
        where: { id: pageId },
        data: { ...rest, ...(access ? { access } : {}), ...(shareToken !== undefined ? { shareToken } : {}) },
      });
    }),

  addComment: authedProcedure
    .input(z.object({ pageId: z.string(), body: z.string().min(1).max(5000), shareToken: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const page = await ctx.prisma.page.findUnique({ where: { id: input.pageId } });
      if (!page) throw new TRPCError({ code: "NOT_FOUND" });

      const canComment =
        page.authorId === ctx.user.id ||
        hasGlobalRole(ctx.user.role, "ADMIN") ||
        page.access === "ORG" ||
        (["COMMENT", "EDIT"].includes(page.access) && input.shareToken === page.shareToken);

      if (!canComment) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.prisma.comment.create({
        data: { pageId: input.pageId, authorId: ctx.user.id, body: input.body },
      });
    }),
});
