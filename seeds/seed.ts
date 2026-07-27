import { prisma } from "../lib/db";
import { hashPassword } from "better-auth/crypto";

async function main() {
  console.log("Seeding database…");

  const passwordHash = await hashPassword("password123");

  // ─── Users ─────────────────────────────────────────────────────────────────
  const users = [
    {
      id: "seed-org-manager",
      name: "Ashish (Platform Owner)",
      email: "ashish@craft.local",
      username: "ashish",
      displayUsername: "ashish",
      role: "ORG_MANAGER" as const,
      emailVerified: true,
    },
    {
      id: "seed-superadmin",
      name: "Avery Morgan",
      email: "avery@craft.local",
      username: "avery",
      displayUsername: "avery",
      role: "SUPERADMIN" as const,
      emailVerified: true,
    },
    {
      id: "seed-admin",
      name: "Jordan Lee",
      email: "jordan@craft.local",
      username: "jordan",
      displayUsername: "jordan",
      role: "ADMIN" as const,
      emailVerified: true,
    },
    {
      id: "seed-teacher",
      name: "Mira Chen",
      email: "mira@craft.local",
      username: "mira",
      displayUsername: "mira",
      role: "TEACHER" as const,
      emailVerified: true,
    },
    {
      id: "seed-student",
      name: "Dev Patel",
      email: "dev@craft.local",
      username: "dev",
      displayUsername: "dev",
      role: "STUDENT" as const,
      emailVerified: true,
    },
    {
      id: "seed-student-2",
      name: "Priya Sharma",
      email: "priya@craft.local",
      username: "priya",
      displayUsername: "priya",
      role: "STUDENT" as const,
      emailVerified: true,
    },
    {
      id: "seed-student-3",
      name: "Lucas Oliveira",
      email: "lucas@craft.local",
      username: "lucas",
      displayUsername: "lucas",
      role: "STUDENT" as const,
      emailVerified: true,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { id: userData.id },
      update: userData,
      create: userData,
    });

    await prisma.account.upsert({
      where: { id: `acc-${user.id}` },
      update: { password: passwordHash },
      create: {
        id: `acc-${user.id}`,
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: passwordHash,
      },
    });
  }

  // ─── Organizations ─────────────────────────────────────────────────────────
  const craftLabs = await prisma.organization.upsert({
    where: { slug: "craft-labs" },
    update: { ownerId: "seed-admin", description: "The flagship Craft internal engineering org." },
    create: {
      id: "seed-org",
      name: "Craft Labs",
      slug: "craft-labs",
      description: "The flagship Craft internal engineering org.",
      ownerId: "seed-admin",
    },
  });

  const aiBrigade = await prisma.organization.upsert({
    where: { slug: "ai-brigade" },
    update: { ownerId: "seed-teacher", description: "ML engineers shipping vector databases and RAG pipelines." },
    create: {
      id: "seed-org-2",
      name: "AI Brigade",
      slug: "ai-brigade",
      description: "ML engineers shipping vector databases and RAG pipelines.",
      ownerId: "seed-teacher",
    },
  });

  const devOpsGuild = await prisma.organization.upsert({
    where: { slug: "devops-guild" },
    update: { ownerId: "seed-student", description: "Infra builders focused on containers, networking, and reliability." },
    create: {
      id: "seed-org-3",
      name: "DevOps Guild",
      slug: "devops-guild",
      description: "Infra builders focused on containers, networking, and reliability.",
      ownerId: "seed-student",
    },
  });

  // ─── Org memberships ───────────────────────────────────────────────────────
  const memberships: { orgId: string; userId: string; orgRole: string; membershipId: string }[] = [
    // Craft Labs
    { orgId: craftLabs.id, userId: "seed-admin",     orgRole: "ORG_OWNER",  membershipId: "m-craft-admin" },
    { orgId: craftLabs.id, userId: "seed-teacher",   orgRole: "INSTRUCTOR", membershipId: "m-craft-mira" },
    { orgId: craftLabs.id, userId: "seed-student",   orgRole: "LEARNER",    membershipId: "m-craft-dev" },
    { orgId: craftLabs.id, userId: "seed-student-2", orgRole: "LEARNER",    membershipId: "m-craft-priya" },
    // AI Brigade
    { orgId: aiBrigade.id, userId: "seed-teacher",   orgRole: "ORG_OWNER",  membershipId: "m-ai-mira" },
    { orgId: aiBrigade.id, userId: "seed-student-3", orgRole: "LEARNER",    membershipId: "m-ai-lucas" },
    { orgId: aiBrigade.id, userId: "seed-student",   orgRole: "LEARNER",    membershipId: "m-ai-dev" },
    // DevOps Guild
    { orgId: devOpsGuild.id, userId: "seed-student",   orgRole: "ORG_OWNER",  membershipId: "m-dg-dev" },
    { orgId: devOpsGuild.id, userId: "seed-student-3", orgRole: "ORG_ADMIN",  membershipId: "m-dg-lucas" },
    { orgId: devOpsGuild.id, userId: "seed-student-2", orgRole: "LEARNER",    membershipId: "m-dg-priya" },
    { orgId: devOpsGuild.id, userId: "seed-admin",     orgRole: "INSTRUCTOR", membershipId: "m-dg-jordan" },
  ];

  for (const m of memberships) {
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: m.orgId, userId: m.userId } },
      update: { role: m.orgRole },
      create: {
        id: m.membershipId,
        organizationId: m.orgId,
        userId: m.userId,
        role: m.orgRole,
      },
    });
  }

  // ─── Challenges ─────────────────────────────────────────────────────────────
  const challenges = [
    {
      id: "seed-kv-store",
      slug: "build-your-own-kv-store",
      title: "Build Your Own KV Store",
      summary: "Build a persistent networked key/value store one observable milestone at a time.",
      track: "DevOps & Infra",
      status: "PUBLISHED" as const,
      access: "OPEN" as const,
      priceCents: 0,
      languages: "TypeScript,Python,Go,Rust,C++,Java",
      dockerImage: "ghcr.io/craft/kv-store-tests:latest",
      starterRepo: "github.com/craft-labs/kv-store-starter",
      creatorId: "seed-teacher",
    },
    {
      id: "seed-vector-db",
      slug: "build-your-own-vector-database",
      title: "Build Your Own Vector Database",
      summary: "Implement embeddings, similarity search, and durable vector segments.",
      track: "AI & ML Engineering",
      status: "PUBLISHED" as const,
      access: "PAID" as const,
      priceCents: 4900,
      languages: "TypeScript,Python,Go,Rust",
      dockerImage: "ghcr.io/craft/vector-db-tests:latest",
      starterRepo: "github.com/craft-labs/vector-db-starter",
      creatorId: "seed-teacher",
    },
    {
      id: "seed-oauth",
      slug: "build-your-own-oauth-server",
      title: "Build an OAuth2 Server",
      summary: "Implement secure authorization flows, signing keys, and refresh rotation.",
      track: "Fintech & Security",
      status: "REVIEW" as const,
      access: "PRIVATE" as const,
      priceCents: 0,
      languages: "TypeScript,Python,Go,Java",
      dockerImage: "ghcr.io/craft/oauth-tests:latest",
      starterRepo: "github.com/craft-labs/oauth-starter",
      creatorId: "seed-teacher",
    },
    {
      id: "seed-mini-docker",
      slug: "build-your-own-container-runtime",
      title: "Build a Container Runtime",
      summary: "Implement cgroups, namespaces, and overlay filesystems from scratch.",
      track: "DevOps & Infra",
      status: "DRAFT" as const,
      access: "OPEN" as const,
      priceCents: 0,
      languages: "Go,Rust,C++",
      dockerImage: null,
      starterRepo: "github.com/craft-labs/container-starter",
      creatorId: "seed-teacher",
    },
  ];

  for (const c of challenges) {
    await prisma.challenge.upsert({ where: { id: c.id }, update: c, create: c });
  }

  // ─── Challenge Stages (KV Store) ───────────────────────────────────────────
  const kvStages = [
    { id: "seed-kv-1", challengeId: "seed-kv-store", position: 1, title: "PING", brief: "Expose a health command over a TCP connection.", hint: "Keep parsing and command handling separate.", testCommand: "craft test --stage 1" },
    { id: "seed-kv-2", challengeId: "seed-kv-store", position: 2, title: "GET / SET", brief: "Store and retrieve string keys in memory.", hint: "Start with one map behind a tiny storage interface.", testCommand: "craft test --stage 2" },
    { id: "seed-kv-3", challengeId: "seed-kv-store", position: 3, title: "Persistence", brief: "Retain values safely across process restarts.", hint: "Append before acknowledging a write.", testCommand: "craft test --stage 3" },
    { id: "seed-kv-4", challengeId: "seed-kv-store", position: 4, title: "Indexes", brief: "Add indexes without changing the command boundary.", hint: "Make index rebuilding a deterministic startup concern.", testCommand: "craft test --stage 4" },
    { id: "seed-kv-5", challengeId: "seed-kv-store", position: 5, title: "Query planner", brief: "Plan scans against available indexes.", hint: "Describe a query before executing it.", testCommand: "craft test --stage 5" },
    { id: "seed-kv-6", challengeId: "seed-kv-store", position: 6, title: "Benchmarks", brief: "Run the standard load harness and submit proof.", hint: "Measure p99 and memory as well as throughput.", testCommand: "craft test --stage 6" },
  ];

  for (const s of kvStages) {
    await prisma.challengeStage.upsert({
      where: { challengeId_position: { challengeId: s.challengeId, position: s.position } },
      update: s,
      create: s,
    });
  }

  // ─── Enrollments ────────────────────────────────────────────────────────────
  const enrollment = await prisma.enrollment.upsert({
    where: { userId_challengeId: { userId: "seed-student", challengeId: "seed-kv-store" } },
    update: {},
    create: { id: "seed-enrollment", userId: "seed-student", challengeId: "seed-kv-store", language: "TypeScript", currentStage: 4 },
  });

  const enrollment2 = await prisma.enrollment.upsert({
    where: { userId_challengeId: { userId: "seed-student-2", challengeId: "seed-kv-store" } },
    update: {},
    create: { id: "seed-enrollment-2", userId: "seed-student-2", challengeId: "seed-kv-store", language: "Python", currentStage: 2 },
  });

  const enrollment3 = await prisma.enrollment.upsert({
    where: { userId_challengeId: { userId: "seed-student-3", challengeId: "seed-vector-db" } },
    update: {},
    create: { id: "seed-enrollment-3", userId: "seed-student-3", challengeId: "seed-vector-db", language: "Go", currentStage: 3 },
  });

  // ─── Benchmarks ─────────────────────────────────────────────────────────────
  if (!(await prisma.benchmark.findUnique({ where: { id: "seed-benchmark" } }))) {
    await prisma.benchmark.create({
      data: { id: "seed-benchmark", enrollmentId: enrollment.id, requestsPerSecond: 42000, p99LatencyMs: 18.4, memoryMb: 92 },
    });
  }
  if (!(await prisma.benchmark.findUnique({ where: { id: "seed-benchmark-2" } }))) {
    await prisma.benchmark.create({
      data: { id: "seed-benchmark-2", enrollmentId: enrollment3.id, requestsPerSecond: 28500, p99LatencyMs: 24.1, memoryMb: 134 },
    });
  }

  // ─── Peer reviews ───────────────────────────────────────────────────────────
  if (!(await prisma.peerReview.findUnique({ where: { id: "seed-review" } }))) {
    await prisma.peerReview.create({
      data: { id: "seed-review", enrollmentId: enrollment.id, status: "REQUESTED", notes: "Persistence boundary ready for architecture review." },
    });
  }
  if (!(await prisma.peerReview.findUnique({ where: { id: "seed-review-2" } }))) {
    await prisma.peerReview.create({
      data: { id: "seed-review-2", enrollmentId: enrollment2.id, status: "REQUESTED", notes: "Stage 2 complete, checking for idiomatic storage separation." },
    });
  }

  // ─── StudentProgress ────────────────────────────────────────────────────────
  await prisma.studentProgress.upsert({
    where: { userId: "seed-student" },
    update: {},
    create: {
      id: "seed-progress",
      userId: "seed-student",
      activeChallengeId: "seed-kv-store",
      activeStage: 4,
      language: "typescript",
      hintsUsed: 1,
      peerReviewRequested: true,
    },
  });

  // ─── Team tracks ────────────────────────────────────────────────────────────
  const teamTracks = [
    { id: "seed-tt-1", organizationId: craftLabs.id, title: "Platform API Foundations", description: "Backend systems challenge path for all new Craft engineers.", challengeId: "seed-kv-store", createdById: "seed-admin" },
    { id: "seed-tt-2", organizationId: craftLabs.id, title: "Security Onboarding", description: "OAuth2 server challenge as the security engineering onboarding track.", challengeId: "seed-oauth", createdById: "seed-admin" },
    { id: "seed-tt-3", organizationId: aiBrigade.id, title: "Vector Search Deep Dive", description: "Build a vector database as the core AI onboarding experience.", challengeId: "seed-vector-db", createdById: "seed-teacher" },
    { id: "seed-tt-4", organizationId: devOpsGuild.id, title: "Infra Bootcamp", description: "KV store as the first milestone in the DevOps Guild onboarding path.", challengeId: "seed-kv-store", createdById: "seed-student" },
  ];

  for (const tt of teamTracks) {
    const existing = await prisma.teamTrack.findUnique({ where: { id: tt.id } });
    if (!existing) {
      await prisma.teamTrack.create({ data: tt });
    }
  }

  // ─── Audit logs ─────────────────────────────────────────────────────────────
  const auditLogs = [
    { id: "seed-audit-1", actorId: "seed-org-manager", action: "platform.initialized", target: "craft-v2", metadata: JSON.stringify({ source: "seed" }) },
    { id: "seed-audit-2", actorId: "seed-superadmin", action: "challenge.published", target: "build-your-own-kv-store", metadata: JSON.stringify({ source: "seed" }) },
    { id: "seed-audit-3", actorId: "seed-superadmin", action: "challenge.published", target: "build-your-own-vector-database", metadata: JSON.stringify({ source: "seed" }) },
    { id: "seed-audit-4", actorId: "seed-admin", action: "organization.created", target: craftLabs.id, metadata: JSON.stringify({ source: "seed" }) },
    { id: "seed-audit-5", actorId: "seed-teacher", action: "organization.created", target: aiBrigade.id, metadata: JSON.stringify({ source: "seed" }) },
    { id: "seed-audit-6", actorId: "seed-student", action: "organization.created", target: devOpsGuild.id, metadata: JSON.stringify({ source: "seed" }) },
    { id: "seed-audit-7", actorId: "seed-admin", action: "organization.track_created", target: "seed-tt-1", metadata: JSON.stringify({ source: "seed" }) },
    { id: "seed-audit-8", actorId: "seed-teacher", action: "challenge.submitted_for_review", target: "seed-oauth", metadata: JSON.stringify({ source: "seed" }) },
  ];

  for (const log of auditLogs) {
    if (!(await prisma.auditLog.findUnique({ where: { id: log.id } }))) {
      await prisma.auditLog.create({ data: log });
    }
  }

  console.log("✓ Seeding complete!");
  console.log("  Login credentials (password: password123):");
  console.log("  ORG_MANAGER : ashish@craft.local");
  console.log("  SUPERADMIN  : avery@craft.local");
  console.log("  ADMIN       : jordan@craft.local");
  console.log("  TEACHER     : mira@craft.local");
  console.log("  STUDENT     : dev@craft.local");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
