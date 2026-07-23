// Platform-level roles and permissions.
// ORG_MANAGER is a singleton role – only one user holds it at a time (the platform owner).
// It sits above SUPERADMIN and can do everything, plus manage all organisations globally.

export type AppRole =
  | "ORG_MANAGER"
  | "SUPERADMIN"
  | "ADMIN"
  | "EDITOR"
  | "TEACHER"
  | "STUDENT";

export type Permission =
  | "challenges:read"
  | "challenges:write"
  | "submissions:review"
  | "students:read"
  | "organization:create"    // any user can create an org; enforced in API separately
  | "organization:manage"    // manage members within orgs you own/admin
  | "organization:global"    // ORG_MANAGER: full control over every org
  | "marketplace:manage"
  | "users:manage"
  | "platform:manage"
  | "platform:owner";        // ORG_MANAGER only – change other superadmin roles, etc.

// Per-organization granular roles (stored as string in OrganizationMember.role)
export type OrgRole = "ORG_OWNER" | "ORG_ADMIN" | "INSTRUCTOR" | "LEARNER";

export const ORG_ROLES: OrgRole[] = ["ORG_OWNER", "ORG_ADMIN", "INSTRUCTOR", "LEARNER"];

export function isOrgRole(value: unknown): value is OrgRole {
  return typeof value === "string" && ORG_ROLES.includes(value as OrgRole);
}

/** Returns true if `actorOrgRole` has authority over `targetOrgRole` (can change/remove them). */
export function canManageOrgMember(
  actorOrgRole: OrgRole | string,
  targetOrgRole: OrgRole | string,
): boolean {
  const hierarchy: Record<string, number> = {
    ORG_OWNER: 4,
    ORG_ADMIN: 3,
    INSTRUCTOR: 2,
    LEARNER: 1,
  };
  const actorLevel = hierarchy[actorOrgRole] ?? 0;
  const targetLevel = hierarchy[targetOrgRole] ?? 0;
  // Must be strictly above the target (owners can't remove owners unless ORG_MANAGER)
  return actorLevel > targetLevel;
}

export const Roles: Record<AppRole, { allowed: Permission[] }> = {
  STUDENT: {
    allowed: ["challenges:read", "organization:create"],
  },
  TEACHER: {
    allowed: [
      "challenges:read",
      "challenges:write",
      "submissions:review",
      "students:read",
      "organization:create",
      "organization:manage",
    ],
  },
  EDITOR: {
    allowed: [
      "challenges:read",
      "challenges:write",
      "submissions:review",
      "students:read",
      "organization:create",
      "organization:manage",
    ],
  },
  ADMIN: {
    allowed: [
      "challenges:read",
      "challenges:write",
      "submissions:review",
      "students:read",
      "organization:create",
      "organization:manage",
      "marketplace:manage",
      "users:manage",
    ],
  },
  SUPERADMIN: {
    allowed: [
      "challenges:read",
      "challenges:write",
      "submissions:review",
      "students:read",
      "organization:create",
      "organization:manage",
      "marketplace:manage",
      "users:manage",
      "platform:manage",
    ],
  },
  ORG_MANAGER: {
    allowed: [
      "challenges:read",
      "challenges:write",
      "submissions:review",
      "students:read",
      "organization:create",
      "organization:manage",
      "organization:global",
      "marketplace:manage",
      "users:manage",
      "platform:manage",
      "platform:owner",
    ],
  },
};

export function isAllowed(
  role: AppRole | string | undefined,
  permission: Permission,
): boolean {
  return Boolean(
    role &&
      role in Roles &&
      Roles[role as AppRole].allowed.includes(permission),
  );
}
