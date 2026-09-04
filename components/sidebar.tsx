"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useOrg } from "@/contexts/org-context";
import CreateOrganization from "./createOrganization";
import { useState } from "react";
import { useMobileNav } from "@/contexts/mobile-nav-context";

const BASE_NAV = [
  ["Overview", "/dashboard"],
  ["My learning", "/dashboard/learn"],
  ["AI Topics", "/dashboard/topics"],
  ["Explore tracks", "/dashboard/tracks"],
  ["Practice arena", "/dashboard/practice"],
  ["Timed assessments", "/dashboard/assessments"],
  ["AI companion", "/dashboard/assistant"],
  ["Community", "/dashboard/community"],
  ["Portfolio proof", "/dashboard/portfolio"],
  ["Profile & rewards", "/dashboard/profile"],
  ["Settings", "/dashboard/settings"],
] as const;

const GLOBAL_ROLE_NAV: Record<
  string,
  ReadonlyArray<readonly [string, string]>
> = {
  TEACHER: [
    ["Teaching studio", "/dashboard/teach"],
    ["Review queue", "/dashboard/teach#reviews"],
  ],
  EDITOR: [
    ["Teaching studio", "/dashboard/teach"],
    ["Review queue", "/dashboard/teach#reviews"],
  ],
  ADMIN: [
    ["Admin overview", "/dashboard/admin"],
    ["People & access", "/dashboard/admin#people"],
  ],
  SUPERADMIN: [
    ["Platform control", "/dashboard/platform"],
    ["Org management", "/dashboard/admin"],
    ["Trust & safety", "/dashboard/platform#trust"],
    ["User governance", "/dashboard/platform#analytics"],
  ],
  ORG_MANAGER: [
    ["Org manager", "/dashboard/org-manager"],
    ["Platform control", "/dashboard/platform"],
    ["Teaching studio", "/dashboard/teach"],
    ["Org management", "/dashboard/admin"],
  ],
};

const ORG_ROLE_NAV: Record<string, ReadonlyArray<readonly [string, string]>> = {
  ORG_OWNER: [
    ["Teaching studio", "/dashboard/teach"],
    ["Org management", "/dashboard/admin"],
  ],
  ORG_ADMIN: [
    ["Teaching studio", "/dashboard/teach"],
    ["Org management", "/dashboard/admin"],
  ],
  INSTRUCTOR: [["Teaching studio", "/dashboard/teach"]],
};

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
  const { mobileOpen, setMobileOpen } = useMobileNav();
  const [isCreateOrgOpen, setCreateOrgOpen] = useState(false);

  const globalRole = org.globalRole ?? _propRole;
  const currentOrgRole = org.currentOrg?.name;
  const currentOrg = org.currentOrg;

  const seen = new Set<string>();
  const navItems: Array<readonly [string, string]> = [];

  for (const item of BASE_NAV) {
    if (!seen.has(item[1])) {
      seen.add(item[1]);
      navItems.push(item);
    }
  }

  for (const item of GLOBAL_ROLE_NAV[globalRole] ?? []) {
    if (!seen.has(item[1])) {
      seen.add(item[1]);
      navItems.push(item);
    }
  }

  if (currentOrgRole) {
    for (const item of ORG_ROLE_NAV[currentOrgRole] ?? []) {
      if (!seen.has(item[1])) {
        seen.add(item[1]);
        navItems.push(item);
      }
    }
  }

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  const workspaceLabel = currentOrg
    ? `${currentOrg.name} · ${(currentOrgRole ?? globalRole).toLowerCase().replace("_", " ")}`
    : `${globalRole.toLowerCase().replace("_", " ")} workspace`;

  const renderNavContent = () => (
    <div className="flex h-full flex-col justify-between">
      <div className="px-4 border-b border-border py-4">
        <p className="mt-1 truncate font-mono text-sm font-bold text-text">
          {email || name}
        </p>
        <p
          className="font-mono text-[10px] font-bold uppercase text-indigo-400 truncate"
          title={workspaceLabel}
        >
          {workspaceLabel}
        </p>
      </div>

      <nav
        className="flex flex-col gap-1 overflow-y-auto p-3 flex-1"
        aria-label="Main navigation"
      >
        {navItems.map(([label, href]) => {
          const basePath = href.split("#")[0];
          const active =
            basePath === "/dashboard"
              ? pathname === basePath
              : pathname.startsWith(basePath);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 font-mono text-xs font-bold uppercase transition-colors ${
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

      <div className="border-t border-border p-3">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-mono text-xs font-bold uppercase text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <span>↪</span> Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header Bar */}

      {/* Mobile Slide-out Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border transform transition-transform duration-200 ease-in-out lg:hidden flex flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderNavContent()}
      </aside>
      <aside className="hidden lg:fixed lg:top-10 lg:left-10 lg:flex lg:w-60 lg:flex-col lg:h-[calc(100vh-5rem)] lg:border lg:border-border lg:bg-background z-30 overflow-hidden shadow-sm">
        {renderNavContent()}
      </aside>

      <CreateOrganization
        isOpen={isCreateOrgOpen}
        onOpenChange={setCreateOrgOpen}
      />
    </>
  );
}
