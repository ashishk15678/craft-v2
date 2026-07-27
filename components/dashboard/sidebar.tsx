"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Trophy,
  FileText,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import type { GlobalRole } from "@/lib/rbac";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: GlobalRole[];        // undefined = all authenticated users
  exact?: boolean;
};

const NAV: NavItem[] = [
  { label: "Home",       href: "/dashboard",         icon: LayoutDashboard, exact: true },
  { label: "Orgs",       href: "/dashboard/orgs",    icon: Building2 },
  { label: "Badges",     href: "/dashboard/badges",  icon: Trophy },
  { label: "Pages",      href: "/dashboard/pages",   icon: FileText },
  { label: "Settings",   href: "/dashboard/settings",icon: Settings },
  // Admin-only section
  { label: "Admin",      href: "/admin",             icon: Shield, roles: ["ADMIN", "SUPERADMIN"] },
];

interface SidebarProps {
  user: { name: string; email: string; role: GlobalRole };
  collapsed?: boolean;
}

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  const visibleNav = NAV.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-background">
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <Link href="/" className="text-lg font-black tracking-tight">Craft</Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Dashboard navigation">
        <ul className="space-y-2">
          {visibleNav.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-1 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-secondary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="ml-auto h-3 w-3 opacity-50" aria-hidden />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-border p-3 space-y-2">
        {/* Role badge */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          {user.role !== "USER" && <span className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            user.role === "SUPERADMIN" && "bg-red-500/10 text-red-500",
            user.role === "ADMIN"      && "bg-amber-500/10 text-amber-500",
            // user.role === "USER"       && "bg-blue-500/10 text-blue-500",
          )}>
            {user.role === "SUPERADMIN" ? "super" : user.role.toLowerCase()}
          </span>}
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  );
}
