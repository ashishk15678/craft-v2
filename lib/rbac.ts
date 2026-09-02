/**
 * RBAC — single source of truth.
 *
 * Global platform roles (User.role from the ROLE enum):
 *   ORG_MANAGER > SUPERADMIN > ADMIN > EDITOR > TEACHER > STUDENT
 *
 * Per-org roles (OrganizationMember.role string):
 *   ORG_OWNER > ORG_ADMIN > INSTRUCTOR > LEARNER
 */

export type GlobalRole =
  | "ORG_MANAGER"
  | "SUPERADMIN"
  | "ADMIN"
  | "EDITOR"
  | "TEACHER"
  | "STUDENT";

export type OrgRole = "ORG_OWNER" | "ORG_ADMIN" | "INSTRUCTOR" | "LEARNER";

const GLOBAL_LEVEL: Record<GlobalRole, number> = {
  ORG_MANAGER: 6,
  SUPERADMIN:  5,
  ADMIN:       4,
  EDITOR:      3,
  TEACHER:     2,
  STUDENT:     1,
};

const ORG_LEVEL: Record<OrgRole, number> = {
  ORG_OWNER: 4,
  ORG_ADMIN: 3,
  INSTRUCTOR: 2,
  LEARNER:    1,
};

/** Returns true when the user's global role meets the minimum required. */
export function hasGlobalRole(
  role: GlobalRole | string | undefined,
  min: GlobalRole,
): boolean {
  return (GLOBAL_LEVEL[role as GlobalRole] ?? 0) >= GLOBAL_LEVEL[min];
}

/** Returns true when the user's org role meets the minimum required. */
export function hasOrgRole(
  role: OrgRole | string | null | undefined,
  min: OrgRole,
): boolean {
  return (ORG_LEVEL[role as OrgRole] ?? 0) >= ORG_LEVEL[min];
}

/** True when the user can act as a teacher: TEACHER+ globally, or INSTRUCTOR+ in org. */
export function canTeach(
  globalRole: string | undefined,
  orgRole: string | null | undefined,
): boolean {
  return hasGlobalRole(globalRole, "TEACHER") || hasOrgRole(orgRole, "INSTRUCTOR");
}

/** True when the user can manage org settings: ADMIN+ globally, or ORG_OWNER/ORG_ADMIN in org. */
export function canManageOrg(
  globalRole: string | undefined,
  orgRole: string | null | undefined,
): boolean {
  return hasGlobalRole(globalRole, "ADMIN") || hasOrgRole(orgRole, "ORG_ADMIN");
}
