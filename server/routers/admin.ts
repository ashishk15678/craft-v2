import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure, superadminProcedure } from "@/server/trpc";

export const adminRouter = router({
  // Platform-wide user list
  users: adminProcedure
    .input(z.object({ query: z.string().optional(), page: z.number().default(1) }))
    .query(async ({ ctx, input }) => {
      const take = 50;
      const skip = (input.page - 1) * take;
      const where = input.query
        ? { OR: [{ email: { contains: input.query } }, { name: { contains: input.query } }, { username: { contains: input.query } }] }
        : {};
      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          select: { id: true, name: true, email: true, username: true, role: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take,
          skip,
        }),
        ctx.prisma.user.count({ where }),
      ]);
      return { users, total, pages: Math.ceil(total / take) };
    }),

  setUserRole: superadminProcedure
    .input(z.object({ userId: z.string(), role: z.enum(["SUPERADMIN", "ADMIN", "USER"]) }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot change your own role" });
      return ctx.prisma.user.update({ where: { id: input.userId }, data: { role: input.role } });
    }),

  stats: adminProcedure.query(async ({ ctx }) => {
    const [users, orgs, courses, enrollments] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.organization.count(),
      ctx.prisma.course.count(),
      ctx.prisma.enrollment.count(),
    ]);
    return { users, orgs, courses, enrollments };
  }),

  auditLog: adminProcedure
    .input(z.object({ page: z.number().default(1) }))
    .query(async ({ ctx, input }) => {
      const take = 50;
      const skip = (input.page - 1) * take;
      const [entries, total] = await Promise.all([
        ctx.prisma.auditLog.findMany({
          include: { actor: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
          take,
          skip,
        }),
        ctx.prisma.auditLog.count(),
      ]);
      return { entries, total, pages: Math.ceil(total / take) };
    }),
});
