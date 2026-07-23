"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type OrgRole = "ORG_OWNER" | "ORG_ADMIN" | "INSTRUCTOR" | "LEARNER";
export type GlobalRole = "ORG_MANAGER" | "SUPERADMIN" | "ADMIN" | "EDITOR" | "TEACHER" | "STUDENT";

export type OrgMembership = {
  id: string;
  organizationId: string;
  role: OrgRole;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

export type OrgContextValue = {
  /** The currently-active organisation (undefined = no org selected) */
  currentOrg: OrgMembership["organization"] | undefined;
  /** The user's per-org role in the active org (null = not a member) */
  currentOrgRole: OrgRole | null;
  /** All org memberships the user holds */
  memberships: OrgMembership[];
  /** The user's platform-level (global) role */
  globalRole: GlobalRole;
  /** Switch to a different org by id – persists choice to cookie */
  switchOrg: (orgId: string) => void;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const OrgContext = createContext<OrgContextValue | null>(null);

/** Throws if used outside <OrgProvider>. Use inside protected routes only. */
export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used inside <OrgProvider>");
  return ctx;
}

/** Returns null when used outside <OrgProvider> – safe for top-nav etc. */
export function useOrgSafe(): OrgContextValue | null {
  return useContext(OrgContext);
}

// ─── Derived helpers ──────────────────────────────────────────────────────────

/** Returns true when the user can act as a teacher/instructor in the current org */
export function canTeachInOrg(value: OrgContextValue): boolean {
  const { currentOrgRole, globalRole } = value;
  if (["SUPERADMIN", "ORG_MANAGER", "ADMIN", "TEACHER", "EDITOR"].includes(globalRole)) return true;
  if (currentOrgRole && ["ORG_OWNER", "ORG_ADMIN", "INSTRUCTOR"].includes(currentOrgRole)) return true;
  return false;
}

/** Returns true when the user can admin the current org */
export function canAdminOrg(value: OrgContextValue): boolean {
  const { currentOrgRole, globalRole } = value;
  if (["SUPERADMIN", "ORG_MANAGER"].includes(globalRole)) return true;
  if (currentOrgRole && ["ORG_OWNER", "ORG_ADMIN"].includes(currentOrgRole)) return true;
  return false;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface OrgProviderProps {
  memberships: OrgMembership[];
  globalRole: GlobalRole;
  /** Id of the initially-active org (resolved from cookie on the server) */
  initialOrgId?: string;
  children: ReactNode;
}

const COOKIE_NAME = "craft_active_org";

export function OrgProvider({
  memberships,
  globalRole,
  initialOrgId,
  children,
}: OrgProviderProps) {
  const [activeOrgId, setActiveOrgId] = useState<string | undefined>(
    // Prefer the initial resolved org id; fall back to first membership
    initialOrgId ?? memberships[0]?.organizationId,
  );

  const currentMembership = memberships.find(
    (m) => m.organizationId === activeOrgId,
  );

  const currentOrg = currentMembership?.organization;
  const currentOrgRole = (currentMembership?.role ?? null) as OrgRole | null;

  const switchOrg = useCallback(
    (orgId: string) => {
      setActiveOrgId(orgId);
      // Persist to cookie so the server can read it on next load
      document.cookie = `${COOKIE_NAME}=${orgId}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    },
    [],
  );

  return (
    <OrgContext.Provider
      value={{ currentOrg, currentOrgRole, memberships, globalRole, switchOrg }}
    >
      {children}
    </OrgContext.Provider>
  );
}
