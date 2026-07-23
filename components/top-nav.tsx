// components/top-nav.tsx  –  server component
import ToggleTheme from "./mode-toggle";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { OrgSwitcher } from "./org-switcher";

export async function TopNavBar() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isLoggedIn = true || !!session?.user?.email;

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="relative md:max-w-4xl max-w-md mx-auto h-10 flex flex-row justify-between items-center px-4">
        {/* Brand & Org Switcher */}
        <div className="flex flex-row items-center space-x-3">
          <Link href="/" className="black-ops-one-regular text-sm tracking-wide">
            Craft-v2
          </Link>

        </div>

        {/* Center navigation */}
        <div />

        {/* Actions / Auth state */}
        <div className="flex items-center gap-x-2">
          <ToggleTheme />
          {/* OrgSwitcher reads from OrgContext – renders nothing outside protected routes */}
          {isLoggedIn && <OrgSwitcher />}

          {isLoggedIn ? (
            <Link
              href="/profile"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-1 px-3 rounded-lg transition-colors"
            >
              Profile
            </Link>
          ) : (
            <Link
              href="/login"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-1 px-3 rounded-lg transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
