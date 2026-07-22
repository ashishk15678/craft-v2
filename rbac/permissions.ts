export type AppRole = "STUDENT" | "TEACHER" | "ADMIN" | "SUPERADMIN" | "EDITOR";
export type Permission =
  | "challenges:read" | "challenges:write" | "submissions:review" | "students:read"
  | "organization:manage" | "marketplace:manage" | "users:manage" | "platform:manage";

export const Roles: Record<AppRole, { allowed: Permission[] }> = {
  STUDENT: { allowed: ["challenges:read"] },
  TEACHER: { allowed: ["challenges:read", "challenges:write", "submissions:review", "students:read"] },
  EDITOR: { allowed: ["challenges:read", "challenges:write", "submissions:review", "students:read"] },
  ADMIN: { allowed: ["challenges:read", "challenges:write", "submissions:review", "students:read", "organization:manage", "marketplace:manage", "users:manage"] },
  SUPERADMIN: { allowed: ["challenges:read", "challenges:write", "submissions:review", "students:read", "organization:manage", "marketplace:manage", "users:manage", "platform:manage"] },
};

export function isAllowed(role: AppRole | string | undefined, permission: Permission) {
  return Boolean(role && role in Roles && Roles[role as AppRole].allowed.includes(permission));
}
