import { NextResponse } from "next/server";
import {
  ChallengeAccess,
  ChallengeStatus,
  ReviewStatus,
  ROLE,
} from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { requireRole, slugify, text, type Role } from "@/lib/workspace-auth";
import { canManageOrgMember } from "@/rbac/permissions";

type Scope = "creator" | "organization" | "platform" | "org-manager";
const scopes: Scope[] = ["creator", "organization", "platform", "org-manager"];
const creatorRoles: Role[] = [
  "TEACHER",
  "EDITOR",
  "ADMIN",
  "SUPERADMIN",
  "ORG_MANAGER",
];
// Every authenticated role can access the organization workspace (everyone can create orgs)
const orgRoles: Role[] = [
  "STUDENT",
  "TEACHER",
  "EDITOR",
  "ADMIN",
  "SUPERADMIN",
  "ORG_MANAGER",
];

function bad(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

function validEnum<T extends Record<string, string>>(
  source: T,
  value: unknown,
): T[keyof T] | null {
  return typeof value === "string" && Object.values(source).includes(value)
    ? (value as T[keyof T])
    : null;
}

async function audit(
  actorId: string,
  action: string,
  target: string,
  metadata?: object,
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      target,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    },
  });
}

// ─── Org-role hierarchy ────────────────────────────────────────────────────
const ORG_ROLES = ["ORG_OWNER", "ORG_ADMIN", "INSTRUCTOR", "LEARNER"] as const;
type OrgRole = (typeof ORG_ROLES)[number];
const ORG_ROLE_HIERARCHY: Record<string, number> = {
  ORG_OWNER: 4,
  ORG_ADMIN: 3,
  INSTRUCTOR: 2,
  LEARNER: 1,
};

function isValidOrgRole(value: unknown): value is OrgRole {
  return typeof value === "string" && ORG_ROLES.includes(value as OrgRole);
}

// ─── Dashboard data builders ────────────────────────────────────────────────

async function creatorDashboard(userId: string, role: Role) {
  const challengeWhere = role === "EDITOR" ? {} : { creatorId: userId };
  const [challenges, reviewQueue] = await Promise.all([
    prisma.challenge.findMany({
      where: challengeWhere,
      include: { _count: { select: { stages: true, enrollments: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.peerReview.findMany({
      where: {
        status: { in: [ReviewStatus.REQUESTED, ReviewStatus.ASSIGNED] },
        enrollment: { challenge: challengeWhere },
      },
      include: {
        enrollment: {
          include: {
            user: { select: { name: true, email: true } },
            challenge: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 30,
    }),
  ]);
  return {
    challenges,
    reviewQueue,
    metrics: {
      total: challenges.length,
      published: challenges.filter(
        (item) => item.status === ChallengeStatus.PUBLISHED,
      ).length,
      learners: challenges.reduce(
        (total, item) => total + item._count.enrollments,
        0,
      ),
      pendingReviews: reviewQueue.length,
    },
  };
}

async function organizationDashboard(userId: string, role: Role) {
  // ORG_MANAGER / SUPERADMIN see all orgs; everyone else sees only their own
  const isSuperUser = role === "ORG_MANAGER" || role === "SUPERADMIN";
  const organizationWhere = isSuperUser
    ? {}
    : { members: { some: { userId } } };

  const organizations = await prisma.organization.findMany({
    where: organizationWhere,
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { user: { name: "asc" } },
      },
      teamTracks: {
        include: { challenge: { select: { id: true, title: true } } },
        orderBy: { updatedAt: "desc" },
      },
      _count: { select: { members: true } },
    },
    orderBy: { name: "asc" },
  });

  return {
    currentUser: { id: userId, globalRole: role },
    organizations,
    metrics: {
      organizations: organizations.length,
      members: organizations.reduce(
        (total, item) => total + item._count.members,
        0,
      ),
      tracks: organizations.reduce(
        (total, item) => total + item.teamTracks.length,
        0,
      ),
    },
  };
}

async function platformDashboard() {
  const [
    challengeCounts,
    userCounts,
    pendingChallenges,
    recentAudit,
    users,
    orgCount,
  ] = await Promise.all([
    prisma.challenge.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.challenge.findMany({
      where: { status: ChallengeStatus.REVIEW },
      include: {
        creator: { select: { name: true, email: true } },
        _count: { select: { stages: true } },
      },
      orderBy: { updatedAt: "asc" },
      take: 40,
    }),
    prisma.auditLog.findMany({
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.organization.count(),
  ]);
  return {
    challengeCounts,
    userCounts,
    pendingChallenges,
    recentAudit,
    users,
    orgCount,
  };
}

async function orgManagerDashboard() {
  const [organizations, userCounts, recentAudit] = await Promise.all([
    prisma.organization.findMany({
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: { user: { name: "asc" } },
        },
        teamTracks: {
          include: { challenge: { select: { id: true, title: true } } },
          orderBy: { updatedAt: "desc" },
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.auditLog.findMany({
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const totalMembers = organizations.reduce((t, o) => t + o._count.members, 0);
  const totalTracks = organizations.reduce(
    (t, o) => t + o.teamTracks.length,
    0,
  );
  const totalUsers = userCounts.reduce((t, u) => t + u._count._all, 0);

  return {
    organizations,
    userCounts,
    recentAudit,
    metrics: {
      organizations: organizations.length,
      totalMembers,
      totalTracks,
      totalUsers,
    },
  };
}

// ─── Route handlers ─────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  context: RouteContext<"/api/workspace/[scope]">,
) {
  const { scope } = await context.params;
  if (!scopes.includes(scope as Scope)) return bad("Unknown workspace", 404);

  const access = await requireRole(
    scope === "creator"
      ? creatorRoles
      : scope === "organization"
        ? orgRoles
        : scope === "org-manager"
          ? (["ORG_MANAGER"] as Role[])
          : (["SUPERADMIN", "ORG_MANAGER"] as Role[]),
  );
  if ("error" in access) return access.error;

  const data =
    scope === "creator"
      ? await creatorDashboard(access.user.id, access.role)
      : scope === "organization"
        ? await organizationDashboard(access.user.id, access.role)
        : scope === "org-manager"
          ? await orgManagerDashboard()
          : await platformDashboard();

  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/workspace/[scope]">,
) {
  const { scope } = await context.params;
  if (!scopes.includes(scope as Scope)) return bad("Unknown workspace", 404);

  const access = await requireRole(
    scope === "creator"
      ? creatorRoles
      : scope === "organization"
        ? orgRoles
        : scope === "org-manager"
          ? (["ORG_MANAGER"] as Role[])
          : (["SUPERADMIN", "ORG_MANAGER"] as Role[]),
  );
  if ("error" in access) return access.error;

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) return bad("Invalid JSON body");

  if (scope === "creator")
    return creatorMutation(body, access.user.id, access.role);
  if (scope === "organization")
    return organizationMutation(body, access.user.id, access.role);
  if (scope === "org-manager") return orgManagerMutation(body, access.user.id);
  return platformMutation(body, access.user.id);
}

// ─── Creator mutations ───────────────────────────────────────────────────────

async function creatorMutation(
  body: Record<string, unknown>,
  userId: string,
  role: Role,
) {
  if (body.action === "createChallenge") {
    const title = text(body.title, 120),
      summary = text(body.summary, 500),
      track = text(body.track, 80);
    const stages = Array.isArray(body.stages) ? body.stages : [];
    if (!title || !summary || !track || stages.length < 6 || stages.length > 12)
      return bad("A title, summary, track, and 6–12 stages are required.");
    const parsedStages = stages.map((stage, index) => ({
      title: text((stage as Record<string, unknown>)?.title, 100),
      brief: text((stage as Record<string, unknown>)?.brief, 1000),
      hint: text((stage as Record<string, unknown>)?.hint, 1000),
      testCommand: text((stage as Record<string, unknown>)?.testCommand, 200),
      position: index + 1,
    }));
    if (
      parsedStages.some(
        (s) => !s.title || !s.brief || !s.hint || !s.testCommand,
      )
    )
      return bad("Every stage needs a title, brief, hint, and test command.");
    const access =
      validEnum(ChallengeAccess, body.access) ?? ChallengeAccess.OPEN;
    const priceCents =
      access === ChallengeAccess.PAID ? Number(body.priceCents) : 0;
    if (
      !Number.isInteger(priceCents) ||
      priceCents < 0 ||
      priceCents > 100000000
    )
      return bad("Invalid price.");
    const baseSlug = slugify(text(body.slug, 100) || title);
    if (!baseSlug) return bad("Title must contain letters or numbers.");
    const exists = await prisma.challenge.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    });
    if (exists) return bad("That challenge slug is already in use.", 409);
    const challenge = await prisma.challenge.create({
      data: {
        slug: baseSlug,
        title,
        summary,
        track,
        access,
        priceCents,
        languages: text(body.languages, 300) || "TypeScript",
        dockerImage: text(body.dockerImage, 300) || null,
        starterRepo: text(body.starterRepo, 300) || null,
        creatorId: userId,
        stages: { create: parsedStages },
      },
      include: { stages: true },
    });
    await audit(userId, "challenge.created", challenge.id, { role });
    return NextResponse.json(challenge, { status: 201 });
  }

  if (body.action === "submitForReview") {
    const challengeId = text(body.challengeId, 100);
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge || (role === "TEACHER" && challenge.creatorId !== userId))
      return bad("Challenge not found.", 404);
    if (challenge.status !== ChallengeStatus.DRAFT)
      return bad("Only drafts can be submitted for review.");
    const updated = await prisma.challenge.update({
      where: { id: challengeId },
      data: { status: ChallengeStatus.REVIEW },
    });
    await audit(userId, "challenge.submitted_for_review", challengeId);
    return NextResponse.json(updated);
  }

  if (body.action === "resolveReview") {
    const reviewId = text(body.reviewId, 100),
      status = validEnum(ReviewStatus, body.status),
      notes = text(body.notes, 2000);
    if (
      !status ||
      (status !== ReviewStatus.APPROVED &&
        status !== ReviewStatus.CHANGES_REQUESTED)
    )
      return bad("Choose an approval or changes-requested outcome.");
    const review = await prisma.peerReview.findUnique({
      where: { id: reviewId },
      include: { enrollment: { include: { challenge: true } } },
    });
    if (
      !review ||
      (role === "TEACHER" && review.enrollment.challenge.creatorId !== userId)
    )
      return bad("Review not found.", 404);
    const updated = await prisma.peerReview.update({
      where: { id: reviewId },
      data: { reviewerId: userId, status, notes: notes || null },
    });
    await audit(userId, "peer_review.resolved", reviewId, { status });
    return NextResponse.json(updated);
  }

  return bad("Unknown creator action");
}

// ─── Organization mutations ──────────────────────────────────────────────────

async function organizationMutation(
  body: Record<string, unknown>,
  userId: string,
  role: Role,
) {
  const isSuperUser = role === "ORG_MANAGER" || role === "SUPERADMIN";

  // ── Create org – available to everyone ────────────────────────────────────
  if (body.action === "createOrganization") {
    const name = text(body.name, 120),
      description = text(body.description, 500),
      slug = slugify(text(body.slug, 100) || name);
    if (!name || !slug) return bad("Organization name is required.");
    const organization = await prisma.organization
      .create({
        data: {
          name,
          slug,
          description: description || null,
          ownerId: userId,
          // Use our custom RBAC membership table (not the better-auth Member table)
          orgMembers: { create: { userId, role: "ORG_OWNER" } },
        },
      })
      .catch(() => null);
    if (!organization)
      return bad("That organization slug is already in use.", 409);
    await audit(userId, "organization.created", organization.id);
    return NextResponse.json(organization, { status: 201 });
  }

  // ── Join org as learner ───────────────────────────────────────────────────
  if (body.action === "joinOrganization") {
    const slug = text(body.slug, 100);
    if (!slug) return bad("Organization slug is required.");
    const org = await prisma.organization.findUnique({ where: { slug } });
    if (!org) return bad("Organization not found.", 404);
    const member = await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId } },
      update: {},
      create: { organizationId: org.id, userId, role: "LEARNER" },
    });
    await audit(userId, "organization.joined", org.id);
    return NextResponse.json(member, { status: 200 });
  }

  // All remaining actions require org-level authority
  const organizationId = text(body.organizationId, 100);

  // Load org + caller's membership
  const orgRecord = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { members: { where: { userId } } },
  });
  if (!orgRecord) return bad("Organization not found.", 404);

  const callerMembership = orgRecord.members[0];
  const callerOrgRole = callerMembership?.role ?? null;

  // Permission check: ORG_MANAGER/SUPERADMIN bypass org-level checks
  const hasOrgAuth =
    isSuperUser ||
    callerOrgRole === "ORG_OWNER" ||
    callerOrgRole === "ORG_ADMIN";

  // ── Create team track ────────────────────────────────────────────────────
  if (body.action === "createTeamTrack") {
    if (!hasOrgAuth && callerOrgRole !== "INSTRUCTOR")
      return bad("Forbidden: you need INSTRUCTOR or higher org role.", 403);
    const title = text(body.title, 120),
      description = text(body.description, 1000),
      challengeId = text(body.challengeId, 100);
    if (!title || !description)
      return bad("Track title and description are required.");
    if (challengeId) {
      const ch = await prisma.challenge.findUnique({
        where: { id: challengeId },
        select: { id: true },
      });
      if (!ch) return bad("Selected challenge does not exist.");
    }
    const teamTrack = await prisma.teamTrack.create({
      data: {
        organizationId,
        title,
        description,
        challengeId: challengeId || null,
        createdById: userId,
      },
    });
    await audit(userId, "organization.track_created", teamTrack.id, {
      organizationId,
    });
    return NextResponse.json(teamTrack, { status: 201 });
  }

  // ── Add member ────────────────────────────────────────────────────────────
  if (body.action === "addMember") {
    if (!hasOrgAuth) return bad("Forbidden: org admin or owner required.", 403);
    const email = text(body.email, 320).toLowerCase();
    const newOrgRole = text(body.memberRole, 40).toUpperCase();
    if (!email || !isValidOrgRole(newOrgRole))
      return bad(
        "A valid email and org role (ORG_OWNER/ORG_ADMIN/INSTRUCTOR/LEARNER) are required.",
      );
    // Only ORG_OWNER / ORG_MANAGER can assign ORG_OWNER
    if (
      newOrgRole === "ORG_OWNER" &&
      callerOrgRole !== "ORG_OWNER" &&
      !isSuperUser
    )
      return bad(
        "Only an existing owner or the platform manager can grant ORG_OWNER.",
        403,
      );
    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!targetUser) return bad("No registered user has that email.", 404);
    const member = await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: { organizationId, userId: targetUser.id },
      },
      update: { role: newOrgRole },
      create: { organizationId, userId: targetUser.id, role: newOrgRole },
    });
    await audit(userId, "organization.member_upserted", member.id, {
      organizationId,
      newOrgRole,
    });
    return NextResponse.json(member);
  }

  // ── Update existing member role ───────────────────────────────────────────
  if (body.action === "updateMemberRole") {
    if (!hasOrgAuth) return bad("Forbidden: org admin or owner required.", 403);
    const targetMemberId = text(body.memberId, 100);
    const newOrgRole = text(body.newRole, 40).toUpperCase();
    if (!targetMemberId || !isValidOrgRole(newOrgRole))
      return bad("memberId and a valid newRole are required.");
    const targetMember = await prisma.organizationMember.findUnique({
      where: { id: targetMemberId },
    });
    if (!targetMember || targetMember.organizationId !== organizationId)
      return bad("Member not found.", 404);
    // Callers cannot promote beyond their own level (unless ORG_MANAGER)
    const callerLevel = ORG_ROLE_HIERARCHY[callerOrgRole ?? ""] ?? 0;
    const targetCurrentLevel = ORG_ROLE_HIERARCHY[targetMember.role] ?? 0;
    const targetNewLevel = ORG_ROLE_HIERARCHY[newOrgRole] ?? 0;
    if (
      !isSuperUser &&
      (targetCurrentLevel >= callerLevel || targetNewLevel >= callerLevel)
    )
      return bad("You cannot change roles at or above your own level.", 403);
    const updated = await prisma.organizationMember.update({
      where: { id: targetMemberId },
      data: { role: newOrgRole },
    });
    await audit(userId, "organization.member_role_updated", targetMemberId, {
      organizationId,
      from: targetMember.role,
      to: newOrgRole,
    });
    return NextResponse.json(updated);
  }

  // ── Remove member ─────────────────────────────────────────────────────────
  if (body.action === "removeMember") {
    if (!hasOrgAuth) return bad("Forbidden: org admin or owner required.", 403);
    const targetMemberId = text(body.memberId, 100);
    const targetMember = await prisma.organizationMember.findUnique({
      where: { id: targetMemberId },
    });
    if (!targetMember || targetMember.organizationId !== organizationId)
      return bad("Member not found.", 404);
    // Cannot remove yourself
    if (targetMember.userId === userId)
      return bad("Cannot remove yourself from the organization.");
    // Check hierarchy
    const callerLevel = ORG_ROLE_HIERARCHY[callerOrgRole ?? ""] ?? 0;
    const targetLevel = ORG_ROLE_HIERARCHY[targetMember.role] ?? 0;
    if (!isSuperUser && targetLevel >= callerLevel)
      return bad("You cannot remove a member at or above your own level.", 403);
    await prisma.organizationMember.delete({ where: { id: targetMemberId } });
    await audit(userId, "organization.member_removed", targetMemberId, {
      organizationId,
    });
    return NextResponse.json({ removed: true });
  }

  // ── Delete organization (owner + ORG_MANAGER only) ────────────────────────
  if (body.action === "deleteOrganization") {
    if (callerOrgRole !== "ORG_OWNER" && !isSuperUser)
      return bad(
        "Only the org owner or platform manager can delete an org.",
        403,
      );
    await prisma.organization.delete({ where: { id: organizationId } });
    await audit(userId, "organization.deleted", organizationId);
    return NextResponse.json({ deleted: true });
  }

  return bad("Unknown organization action");
}

// ─── Org-manager mutations ───────────────────────────────────────────────────

async function orgManagerMutation(
  body: Record<string, unknown>,
  userId: string,
) {
  // Override any org member's role (global power)
  if (body.action === "setOrgMemberRole") {
    const memberId = text(body.memberId, 100);
    const newOrgRole = text(body.newRole, 40).toUpperCase();
    if (!memberId || !isValidOrgRole(newOrgRole))
      return bad("memberId and a valid newRole are required.");
    const member = await prisma.organizationMember
      .update({
        where: { id: memberId },
        data: { role: newOrgRole },
      })
      .catch(() => null);
    if (!member) return bad("Member not found.", 404);
    await audit(userId, "org_manager.member_role_set", memberId, {
      newOrgRole,
    });
    return NextResponse.json(member);
  }

  // Force-remove a member from any org
  if (body.action === "forceRemoveMember") {
    const memberId = text(body.memberId, 100);
    const member = await prisma.organizationMember.findUnique({
      where: { id: memberId },
    });
    if (!member) return bad("Member not found.", 404);
    await prisma.organizationMember.delete({ where: { id: memberId } });
    await audit(userId, "org_manager.member_removed", memberId);
    return NextResponse.json({ removed: true });
  }

  // Force-delete any organization
  if (body.action === "forceDeleteOrganization") {
    const organizationId = text(body.organizationId, 100);
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) return bad("Organization not found.", 404);
    await prisma.organization.delete({ where: { id: organizationId } });
    await audit(userId, "org_manager.organization_deleted", organizationId);
    return NextResponse.json({ deleted: true });
  }

  // Update any user's global platform role (ORG_MANAGER cannot self-demote)
  if (body.action === "updateUserRole") {
    const targetUserId = text(body.userId, 100),
      role = validEnum(ROLE, body.role);
    if (!role) return bad("Choose a valid role.");
    if (targetUserId === userId)
      return bad("You cannot change your own ORG_MANAGER role.");
    // Nobody can be promoted to ORG_MANAGER via this endpoint – that's a direct DB operation
    if (role === ("ORG_MANAGER" as unknown))
      return bad("ORG_MANAGER cannot be assigned via API.");
    const user = await prisma.user
      .update({ where: { id: targetUserId }, data: { role } })
      .catch(() => null);
    if (!user) return bad("User not found.", 404);
    await audit(userId, "org_manager.user_role_updated", targetUserId, {
      role,
    });
    return NextResponse.json({ id: user.id, role: user.role });
  }

  return bad("Unknown org-manager action");
}

// ─── Platform mutations ──────────────────────────────────────────────────────

async function platformMutation(body: Record<string, unknown>, userId: string) {
  if (body.action === "moderateChallenge") {
    const challengeId = text(body.challengeId, 100),
      status = validEnum(ChallengeStatus, body.status);
    if (
      !status ||
      (status !== ChallengeStatus.PUBLISHED &&
        status !== ChallengeStatus.ARCHIVED &&
        status !== ChallengeStatus.DRAFT)
    )
      return bad("Invalid moderation status.");
    const challenge = await prisma.challenge
      .update({ where: { id: challengeId }, data: { status } })
      .catch(() => null);
    if (!challenge) return bad("Challenge not found.", 404);
    await audit(userId, "challenge.moderated", challengeId, { status });
    return NextResponse.json(challenge);
  }

  if (body.action === "updateUserRole") {
    const targetUserId = text(body.userId, 100),
      role = validEnum(ROLE, body.role);
    if (!role || targetUserId === userId)
      return bad("Choose a valid role for another user.");
    // Superadmin cannot set ORG_MANAGER
    if ((role as unknown) === "ORG_MANAGER")
      return bad("ORG_MANAGER cannot be assigned via this endpoint.");
    const user = await prisma.user
      .update({ where: { id: targetUserId }, data: { role } })
      .catch(() => null);
    if (!user) return bad("User not found.", 404);
    await audit(userId, "user.role_updated", targetUserId, { role });
    return NextResponse.json({ id: user.id, role: user.role });
  }

  return bad("Unknown platform action");
}
