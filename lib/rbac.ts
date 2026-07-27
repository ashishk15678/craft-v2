/**
 * RBAC — single source of truth.
 *
 * Global roles (User.role):  SUPERADMIN > ADMIN > USER
 * Org roles (OrgMember.role): ORG_OWNER > TEACHER > STUDENT
 */

export type GlobalRole = "SUPERADMIN" | "ADMIN" | "USER";
export type OrgRole = "ORG_OWNER" | "TEACHER" | "STUDENT";

const GLOBAL_LEVEL: Record<GlobalRole, number> = {
  SUPERADMIN: 3,
  ADMIN: 2,
  USER: 1,
};

const ORG_LEVEL: Record<OrgRole, number> = {
  ORG_OWNER: 3,
  TEACHER: 2,
  STUDENT: 1,
};

export function isOrgRole(v: unknown): v is OrgRole {
  return v === "ORG_OWNER" || v === "TEACHER" || v === "STUDENT";
}

/** True when globalRole meets the minimum required */
export function hasGlobalRole(role: GlobalRole | string | undefined, min: GlobalRole): boolean {
  return (GLOBAL_LEVEL[role as GlobalRole] ?? 0) >= GLOBAL_LEVEL[min];
}

/** True when orgRole meets the minimum required */
export function hasOrgRole(role: OrgRole | string | undefined, min: OrgRole): boolean {
  return (ORG_LEVEL[role as OrgRole] ?? 0) >= ORG_LEVEL[min];
}

/** A TEACHER or above in org, OR ADMIN+ globally */
export function canTeach(globalRole: string | undefined, orgRole: string | undefined): boolean {
  return hasGlobalRole(globalRole, "ADMIN") || hasOrgRole(orgRole, "TEACHER");
}

/** ORG_OWNER or ADMIN+ globally */
export function canManageOrg(globalRole: string | undefined, orgRole: string | undefined): boolean {
  return hasGlobalRole(globalRole, "ADMIN") || hasOrgRole(orgRole, "ORG_OWNER");
}
