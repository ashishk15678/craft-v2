/**
 * Seed script for the new schema.
 * Run: npx tsx seeds/seed.ts
 *
 * Creates: 5 users (SUPERADMIN, ADMIN, 3×USER), 3 orgs, 2 courses, 8 lessons, 3 badges.
 * All passwords: password123
 */

import { prisma } from "../lib/db";
import { hashPassword } from "better-auth/crypto";
import type { GlobalRole } from "../lib/rbac";
// Prisma GlobalRole enum values
type PrismaRole = "SUPERADMIN" | "ADMIN" | "USER";

async function main() {
  console.log("🌱 Seeding…");

  const pw = await hashPassword("password123");

  // ─── Users ───────────────────────────────────────────────────────────────
  const userDefs: { id: string; name: string; email: string; username: string; role: PrismaRole }[] = [
    { id: "u-super",   name: "Super Admin",  email: "super@craft.local",   username: "superadmin", role: "SUPERADMIN" },
    { id: "u-admin",   name: "Platform Admin", email: "admin@craft.local", username: "admin",      role: "ADMIN" },
    { id: "u-alice",   name: "Alice Chen",   email: "alice@craft.local",   username: "alice",      role: "USER" },
    { id: "u-bob",     name: "Bob Patel",    email: "bob@craft.local",     username: "bob",        role: "USER" },
    { id: "u-carol",   name: "Carol Kim",    email: "carol@craft.local",   username: "carol",      role: "USER" },
  ];

  for (const u of userDefs) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { role: u.role },
      create: { id: u.id, name: u.name, email: u.email, username: u.username, role: u.role, emailVerified: true },
    });
    await prisma.account.upsert({
      where: { id: `acc-${u.id}` },
      update: { password: pw },
      create: { id: `acc-${u.id}`, userId: u.id, accountId: u.id, providerId: "credential", password: pw },
    });
  }

  // ─── Badges ───────────────────────────────────────────────────────────────
  const badgeDefs = [
    { id: "badge-first", name: "First Step",     icon: "🎯", description: "Enrolled in your first course.",    trigger: "FIRST_ENROLLMENT" as const, threshold: 1 },
    { id: "badge-org",   name: "Founder",        icon: "🏛️", description: "Created your first organization.", trigger: "ORG_CREATED" as const,      threshold: 1 },
    { id: "badge-done",  name: "Completionist",  icon: "🏆", description: "Completed a full course.",         trigger: "COURSE_COMPLETE" as const,  threshold: 1 },
    { id: "badge-quiz",  name: "Perfect Score",  icon: "💯", description: "Scored 100% on a quiz.",           trigger: "QUIZ_PERFECT" as const,     threshold: 1 },
    { id: "badge-teach", name: "Educator",       icon: "📚", description: "Published your first course.",     trigger: "TEACHER_CREATED" as const,  threshold: 1 },
  ];
  for (const b of badgeDefs) {
    await prisma.badge.upsert({ where: { id: b.id }, update: b, create: b });
  }

  // ─── Organizations ────────────────────────────────────────────────────────
  const eng = await prisma.organization.upsert({
    where: { slug: "engineering-guild" },
    update: {},
    create: {
      id: "org-eng", name: "Engineering Guild", slug: "engineering-guild",
      description: "Internal engineering learning org.", ownerId: "u-alice",
    },
  });

  const design = await prisma.organization.upsert({
    where: { slug: "design-collective" },
    update: {},
    create: {
      id: "org-design", name: "Design Collective", slug: "design-collective",
      description: "UX, product, and design education.", ownerId: "u-bob",
      visibility: "INVITE", joinToken: "invite-design-abc123",
    },
  });

  // ─── Org members ──────────────────────────────────────────────────────────
  const members = [
    { id: "m-alice-eng",    orgId: eng.id,    userId: "u-alice", role: "ORG_OWNER" },
    { id: "m-bob-eng",      orgId: eng.id,    userId: "u-bob",   role: "TEACHER"   },
    { id: "m-carol-eng",    orgId: eng.id,    userId: "u-carol", role: "STUDENT"   },
    { id: "m-bob-design",   orgId: design.id, userId: "u-bob",   role: "ORG_OWNER" },
    { id: "m-carol-design", orgId: design.id, userId: "u-carol", role: "STUDENT"   },
  ];
  for (const m of members) {
    await prisma.orgMember.upsert({
      where: { organizationId_userId: { organizationId: m.orgId, userId: m.userId } },
      update: { role: m.role },
      create: { id: m.id, organizationId: m.orgId, userId: m.userId, role: m.role },
    });
  }

  // ─── Courses ──────────────────────────────────────────────────────────────
  const course1 = await prisma.course.upsert({
    where: { organizationId_slug: { organizationId: eng.id, slug: "intro-typescript" } },
    update: {},
    create: {
      id: "c-ts", organizationId: eng.id, authorId: "u-bob",
      title: "Introduction to TypeScript", slug: "intro-typescript",
      description: "From zero to type-safe in one course. Covers types, generics, and real-world patterns.",
      status: "PUBLISHED", repoDir: "courses/intro-typescript",
    },
  });

  const course2 = await prisma.course.upsert({
    where: { organizationId_slug: { organizationId: eng.id, slug: "system-design-101" } },
    update: {},
    create: {
      id: "c-sd", organizationId: eng.id, authorId: "u-alice",
      title: "System Design 101", slug: "system-design-101",
      description: "Load balancers, caches, queues, databases — how real systems are built.",
      status: "PUBLISHED", repoDir: "courses/system-design-101",
    },
  });

  // ─── Lessons ──────────────────────────────────────────────────────────────
  const lessons1 = [
    { id: "l-ts-1", pos: 1, title: "Why TypeScript?",       type: "TEXT"  as const },
    { id: "l-ts-2", pos: 2, title: "Types & Interfaces",    type: "TEXT"  as const },
    { id: "l-ts-3", pos: 3, title: "Generics Deep Dive",    type: "TEXT"  as const },
    { id: "l-ts-4", pos: 4, title: "Knowledge Check",       type: "QUIZ"  as const },
  ];
  for (const l of lessons1) {
    await prisma.lesson.upsert({
      where: { courseId_position: { courseId: course1.id, position: l.pos } },
      update: {},
      create: {
        id: l.id, courseId: course1.id, authorId: "u-bob",
        title: l.title, position: l.pos, type: l.type, published: true,
        content: l.type === "QUIZ"
          ? JSON.stringify({ questions: [{ q: "What does `unknown` mean in TypeScript?", options: ["Any type", "Top type — requires narrowing", "Null type", "Never type"], answer: 1 }] })
          : JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: `Content for: ${l.title}` }] }] }),
        repoPath: `courses/intro-typescript/${String(l.pos).padStart(2, "0")}-${l.title.toLowerCase().replace(/\s+/g, "-")}.json`,
      },
    });
  }

  const lessons2 = [
    { id: "l-sd-1", pos: 1, title: "CAP Theorem",          type: "TEXT"        as const },
    { id: "l-sd-2", pos: 2, title: "Caching Strategies",   type: "TEXT"        as const },
    { id: "l-sd-3", pos: 3, title: "Design Whiteboard",    type: "WHITEBOARD"  as const },
    { id: "l-sd-4", pos: 4, title: "Code Walkthrough",     type: "GIST"        as const },
  ];
  for (const l of lessons2) {
    await prisma.lesson.upsert({
      where: { courseId_position: { courseId: course2.id, position: l.pos } },
      update: {},
      create: {
        id: l.id, courseId: course2.id, authorId: "u-alice",
        title: l.title, position: l.pos, type: l.type, published: true,
        content: JSON.stringify({ type: "doc", content: [] }),
        repoPath: `courses/system-design-101/${String(l.pos).padStart(2, "0")}-${l.title.toLowerCase().replace(/\s+/g, "-")}.json`,
      },
    });
  }

  // ─── Enrollments ──────────────────────────────────────────────────────────
  const enr = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: "u-carol", courseId: course1.id } },
    update: {},
    create: { id: "enr-carol-ts", userId: "u-carol", courseId: course1.id },
  });

  // Carol completed lessons 1 and 2
  for (const lessonId of ["l-ts-1", "l-ts-2"]) {
    await prisma.lessonComplete.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enr.id, lessonId } },
      update: {},
      create: { enrollmentId: enr.id, lessonId },
    });
  }

  // Award first-enrollment badge to Carol
  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId: "u-carol", badgeId: "badge-first" } },
    update: {},
    create: { userId: "u-carol", badgeId: "badge-first" },
  });

  // Award founder badge to Alice and Bob
  for (const uid of ["u-alice", "u-bob"]) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: uid, badgeId: "badge-org" } },
      update: {},
      create: { userId: uid, badgeId: "badge-org" },
    });
  }

  // ─── Kanban board ─────────────────────────────────────────────────────────
  const board = await prisma.kanbanBoard.upsert({
    where: { id: "board-ts" },
    update: {},
    create: { id: "board-ts", courseId: course1.id, title: "TypeScript Course Board" },
  });

  const cols = [
    { id: "col-backlog", title: "Backlog", pos: 1 },
    { id: "col-doing",   title: "In Progress", pos: 2 },
    { id: "col-done",    title: "Done", pos: 3 },
  ];
  for (const c of cols) {
    await prisma.kanbanColumn.upsert({
      where: { id: c.id },
      update: {},
      create: { id: c.id, boardId: board.id, title: c.title, position: c.pos },
    });
  }

  const cards = [
    { id: "card-1", colId: "col-doing", title: "Write generics exercises", pos: 1, assigneeId: "u-bob" },
    { id: "card-2", colId: "col-backlog", title: "Add visualizer lesson",   pos: 1, assigneeId: null },
    { id: "card-3", colId: "col-done",   title: "Record intro video",      pos: 1, assigneeId: "u-alice" },
  ];
  for (const c of cards) {
    await prisma.kanbanCard.upsert({
      where: { id: c.id },
      update: {},
      create: { id: c.id, columnId: c.colId, title: c.title, position: c.pos, assigneeId: c.assigneeId },
    });
  }

  // ─── Audit log ────────────────────────────────────────────────────────────
  const logs = [
    { id: "al-1", actorId: "u-alice", action: "org.created",    target: eng.id },
    { id: "al-2", actorId: "u-bob",   action: "course.created", target: course1.id },
    { id: "al-3", actorId: "u-alice", action: "course.created", target: course2.id },
  ];
  for (const l of logs) {
    const exists = await prisma.auditLog.findUnique({ where: { id: l.id } });
    if (!exists) await prisma.auditLog.create({ data: l });
  }

  console.log("✅ Seed complete. Login with password: password123");
  console.log("   SUPERADMIN : super@craft.local");
  console.log("   ADMIN      : admin@craft.local");
  console.log("   USER/Owner : alice@craft.local  (ORG_OWNER in Engineering Guild)");
  console.log("   USER/Teach : bob@craft.local    (TEACHER in Engineering Guild)");
  console.log("   USER/Learn : carol@craft.local  (STUDENT in Engineering Guild)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
