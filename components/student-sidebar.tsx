"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useOrg, canTeachInOrg, canAdminOrg } from "@/contexts/org-context";

// ─── Nav definitions ──────────────────────────────────────────────────────────

/** Links every user gets */
const BASE_NAV = [
  ["Overview", "/dashboard"],
  ["My learning", "/dashboard/learn"],
  ["Explore tracks", "/dashboard/tracks"],
  ["AI companion", "/dashboard/assistant"],
  ["Community", "/dashboard/community"],
  ["Portfolio proof", "/dashboard/portfolio"],
  ["Settings", "/dashboard/settings"],
] as const;

/** Extra links based on global role */
const GLOBAL_ROLE_NAV: Record<string, ReadonlyArray<readonly [string, string]>> = {
  TEACHER: [
    ["Teaching studio", "/dashboard/teach"],
    ["Review queue",    "/dashboard/teach#reviews"],
  ],
  EDITOR: [
    ["Teaching studio", "/dashboard/teach"],
    ["Review queue",    "/dashboard/teach#reviews"],
  ],
  ADMIN: [
    ["Admin overview",  "/dashboard/admin"],
    ["People & access", "/dashboard/admin#people"],
  ],
  SUPERADMIN: [
    ["Platform control",  "/dashboard/platform"],
    ["Org management",    "/dashboard/admin"],
    ["Trust & safety",    "/dashboard/platform#trust"],
    ["User governance",   "/dashboard/platform#analytics"],
  ],
  ORG_MANAGER: [
    ["Org manager",       "/dashboard/org-manager"],
    ["Platform control",  "/dashboard/platform"],
    ["Teaching studio",   "/dashboard/teach"],
    ["Org management",    "/dashboard/admin"],
  ],
};

/** Extra links unlocked purely by org-level role (when global role = STUDENT) */
const ORG_ROLE_NAV: Record<string, ReadonlyArray<readonly [string, string]>> = {
  ORG_OWNER: [
    ["Teaching studio", "/dashboard/teach"],
    ["Org management",  "/dashboard/admin"],
  ],
  ORG_ADMIN: [
    ["Teaching studio", "/dashboard/teach"],
    ["Org management",  "/dashboard/admin"],
  ],
  INSTRUCTOR: [
    // Instructors get the teaching studio but NOT the org management page
    ["Teaching studio", "/dashboard/teach"],
  ],
  // LEARNER gets no extra nav items
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * The `role` prop is still accepted for compatibility when rendered before
 * context is available, but the component prefers live context data.
 */
export function StudentSidebar({
  name,
  email,
  role: _propRole = "STUDENT",
}: {
  name: string;
  email: string;
  role?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const org = useOrg();

  const globalRole = org.globalRole ?? _propRole;
  const currentOrgRole = org.currentOrgRole;
  const currentOrg = org.currentOrg;

  // Build the nav: base + role-specific extras (deduplicate by href)
  const seen = new Set<string>();
  const navItems: Array<readonly [string, string]> = [];

  for (const item of BASE_NAV) {
    if (!seen.has(item[1])) { seen.add(item[1]); navItems.push(item); }
  }

  // Add global-role extras
  for (const item of GLOBAL_ROLE_NAV[globalRole] ?? []) {
    if (!seen.has(item[1])) { seen.add(item[1]); navItems.push(item); }
  }

  // Add org-role extras only when they add something the global role didn't already unlock
  if (currentOrgRole) {
    for (const item of ORG_ROLE_NAV[currentOrgRole] ?? []) {
      if (!seen.has(item[1])) { seen.add(item[1]); navItems.push(item); }
    }
  }

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  // Friendly label for the workspace line
  const workspaceLabel = currentOrg
    ? `${currentOrg.name} · ${(currentOrgRole ?? globalRole).toLowerCase().replace("_", " ")}`
    : `${globalRole.toLowerCase().replace("_", " ")} workspace`;

  return (
    <aside className="w-full shrink-0 flex-col border-r border-l border-border md:h-full md:w-60 fixed top-10 left-10 h-full">
      <div className="px-4 border-b border-border py-2">
        <p className="mt-1 truncate font-mono text-sm font-bold text-text">
          {email || name}
        </p>
        <p className="font-mono text-[10px] font-bold uppercase text-indigo-400 truncate" title={workspaceLabel}>
          {workspaceLabel}
        </p>
      </div>

      <div className="flex flex-col justify-between">
        <nav
          className="flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible"
          aria-label="Main navigation"
        >
          {navItems.map(([label, href]) => {
            // Strip hash for active matching
            const basePath = href.split("#")[0];
            const active =
              basePath === "/dashboard"
                ? pathname === basePath
                : pathname.startsWith(basePath);
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors ${
                  active
                    ? "bg-indigo-500 text-white"
                    : "text-zinc-500 hover:bg-accent hover:text-text"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-mono text-xs font-bold uppercase text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <span>↪</span> Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
