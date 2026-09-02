"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
// Matches what better-auth's organization plugin returns from listOrganizations.
// Each item IS an organization the user belongs to — not a membership wrapper.

export type BaOrg = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
};

export type GlobalRole =
  | "ORG_MANAGER"
  | "SUPERADMIN"
  | "ADMIN"
  | "EDITOR"
  | "TEACHER"
  | "STUDENT";

export type OrgContextValue = {
  /** The currently-active organisation, or undefined if none selected */
  currentOrg: BaOrg | undefined;
  /** All orgs the user belongs to (from better-auth listOrganizations) */
  orgs: BaOrg[];
  /** The user's platform-level (global) role */
  globalRole: GlobalRole;
  /** Switch to a different org by id — persists choice to cookie */
  switchOrg: (orgId: string) => void;
};

// ─── Context ───────────────────────────────────────────────────────────────────

const OrgContext = createContext<OrgContextValue | null>(null);

/** Throws if used outside <OrgProvider>. Use inside protected routes only. */
export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used inside <OrgProvider>");
  return ctx;
}

/** Returns null when used outside <OrgProvider> — safe for top-nav etc. */
export function useOrgSafe(): OrgContextValue | null {
  return useContext(OrgContext);
}

// ─── Provider ──────────────────────────────────────────────────────────────────

interface OrgProviderProps {
  orgs: BaOrg[];
  globalRole: GlobalRole;
  initialOrgId?: string;
  children: ReactNode;
}

const COOKIE_NAME = "craft_active_org";

export function OrgProvider({
  orgs,
  globalRole,
  initialOrgId,
  children,
}: OrgProviderProps) {
  const [activeOrgId, setActiveOrgId] = useState<string | undefined>(
    initialOrgId ?? orgs[0]?.id,
  );

  const currentOrg = orgs.find((o) => o.id === activeOrgId);

  const switchOrg = useCallback((orgId: string) => {
    setActiveOrgId(orgId);
    document.cookie = `${COOKIE_NAME}=${orgId}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }, []);

  return (
    <OrgContext.Provider value={{ currentOrg, orgs, globalRole, switchOrg }}>
      {children}
    </OrgContext.Provider>
  );
}
