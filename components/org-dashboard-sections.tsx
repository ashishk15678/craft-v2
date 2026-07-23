"use client";

import Link from "next/link";
import { useOrg, canTeachInOrg, canAdminOrg } from "@/contexts/org-context";

// ─── Org section ──────────────────────────────────────────────────────────────
// Only shown to users who can actually manage orgs (ORG_OWNER, ORG_ADMIN,
// or global ADMIN / SUPERADMIN / ORG_MANAGER).
// Plain STUDENT, INSTRUCTOR, and LEARNER do NOT see this section.

export function OrgDashboardSection() {
  const org = useOrg();
  const { memberships, currentOrg } = org;

  // Gate: must be able to admin at least one org
  if (!canAdminOrg(org)) return null;
  if (memberships.length === 0) return null;

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">
          Organizations
        </p>
        <Link
          href="/dashboard/admin"
          className="font-mono text-[10px] uppercase text-zinc-500 hover:text-indigo-400 transition-colors"
        >
          Manage →
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {memberships.map((m) => {
          const isActive = currentOrg?.id === m.organization.id;
          return (
            <Link
              key={m.id}
              href="/dashboard/admin"
              className={`group rounded-lg border px-4 py-2.5 transition-colors hover:border-indigo-500/50 ${
                isActive
                  ? "border-indigo-500/40 bg-indigo-500/10"
                  : "border-border bg-accent hover:bg-accent"
              }`}
            >
              <p className="font-mono text-xs font-bold uppercase text-text group-hover:text-indigo-400 transition-colors">
                {m.organization.name}
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase text-indigo-400">
                {m.role.replace(/_/g, " ")}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ─── Role gateway ─────────────────────────────────────────────────────────────

export function OrgAwareRoleGateway() {
  const org = useOrg();
  const { globalRole, currentOrgRole } = org;

  const workspaces: { title: string; href: string; desc: string; badge?: string }[] = [];

  if (globalRole === "ORG_MANAGER") {
    workspaces.push({ title: "Org Manager", href: "/dashboard/org-manager", desc: "Full platform-level org control.", badge: "owner" });
    workspaces.push({ title: "Platform",    href: "/dashboard/platform",    desc: "Moderate challenges and govern users." });
  }
  if (globalRole === "SUPERADMIN") {
    workspaces.push({ title: "Platform",    href: "/dashboard/platform",    desc: "Moderate challenges and govern users.", badge: "superadmin" });
  }

  if (canTeachInOrg(org) && !workspaces.some(w => w.href === "/dashboard/teach")) {
    workspaces.push({ title: "Teaching Studio", href: "/dashboard/teach", desc: "Author challenges and review submissions." });
  }

  // Only show org management link to actual admins
  if (canAdminOrg(org) && !workspaces.some(w => w.href === "/dashboard/admin")) {
    workspaces.push({ title: "Org Management", href: "/dashboard/admin", desc: "Manage members, tracks, and org settings." });
  }

  if (workspaces.length === 0) return null;

  return (
    <section className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">
          Your workspaces
        </p>
        {currentOrgRole && (
          <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 font-mono text-[9px] uppercase text-indigo-300">
            {currentOrgRole.replace(/_/g, " ")} in current org
          </span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {workspaces.map((ws) => (
          <Link
            key={ws.href}
            href={ws.href}
            className="group flex items-center justify-between rounded-lg border border-indigo-500/20 bg-indigo-950/20 px-4 py-3 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs font-bold uppercase text-indigo-100">{ws.title}</p>
                {ws.badge && (
                  <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 font-mono text-[9px] uppercase text-amber-400">{ws.badge}</span>
                )}
              </div>
              <p className="mt-0.5 text-[10px] text-zinc-500">{ws.desc}</p>
            </div>
            <span className="ml-3 font-mono text-xs text-indigo-500 group-hover:text-indigo-300 transition-colors shrink-0">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
