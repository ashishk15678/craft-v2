import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import ToggleTheme from "@/components/mode-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const userForClient = { name: user.name, email: user.email, role: user.role };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — fixed height, scrollable internally */}
      <div className="hidden md:flex md:shrink-0">
        <DashboardSidebar user={userForClient} />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar (mobile only) */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:hidden">
          <MobileNav user={userForClient} />
          <span className="text-lg font-black tracking-tight">Craft</span>
          <div className="ml-auto">
            <ToggleTheme />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
