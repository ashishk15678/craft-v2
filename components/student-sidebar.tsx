"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const navigation = [
  ["Overview", "/dashboard"],
  ["My learning", "/dashboard/learn"],
  ["Explore tracks", "/dashboard/tracks"],
  ["AI companion", "/dashboard/assistant"],
  ["Community", "/dashboard/community"],
  ["Portfolio proof", "/dashboard/portfolio"],
  ["Settings", "/dashboard/settings"],
] as const;

const roleNavigation = {
  TEACHER: [["Teaching studio", "/dashboard/teach"], ["Challenge authoring", "/dashboard/teach#authoring"], ["Review queue", "/dashboard/teach#reviews"], ["Creator earnings", "/dashboard/teach#earnings"]],
  EDITOR: [["Teaching studio", "/dashboard/teach"], ["Challenge authoring", "/dashboard/teach#authoring"], ["Review queue", "/dashboard/teach#reviews"]],
  ADMIN: [["Admin overview", "/dashboard/admin"], ["Team onboarding", "/dashboard/admin#onboarding"], ["Marketplace", "/dashboard/admin#marketplace"], ["People & access", "/dashboard/admin#people"]],
  SUPERADMIN: [["Platform control", "/dashboard/platform"], ["Admin overview", "/dashboard/admin"], ["Trust & safety", "/dashboard/platform#trust"], ["Platform analytics", "/dashboard/platform#analytics"]],
} as const;

export function StudentSidebar({
  name,
  email,
  role = "STUDENT",
}: {
  name: string;
  email: string;
  role?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-card md:h-full md:w-60 md:border-r md:border-b-0">

      <div className="border-b border-border px-4 py-5">
        <p className="mt-1 truncate font-mono text-sm font-bold text-text">
          { email || name }
        </p>
        <p className="font-mono text-[10px] font-bold uppercase text-indigo-400">
          {role.toLowerCase()} workspace
        </p>
      </div>
      <nav
        className="flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible"
        aria-label="Student navigation"
      >
        {(role === "STUDENT" ? navigation : roleNavigation[role as keyof typeof roleNavigation] ?? navigation).map(([label, href]) => {
          const active =
            href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors ${active ? "bg-indigo-500 text-white" : "text-zinc-500 hover:bg-accent hover:text-text"}`}
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
    </aside>
  );
}
