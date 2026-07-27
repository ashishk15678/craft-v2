// components/top-nav.tsx
// Server component — keeps auth check server-side.

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import ToggleTheme from "./mode-toggle";
import { OrgSwitcher } from "./org-switcher";
import { NavHamburger } from "./nav-hamburger";

export async function TopNavBar() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isLoggedIn = !!session?.user?.email;

  return (
    <div className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto h-10 flex flex-row items-center gap-2 px-4 max-w-6xl">
        <NavHamburger />

        <Link href="/" className="black-ops-one-regular text-sm tracking-wide shrink-0">
          Craft
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-x-2">
          {isLoggedIn && <OrgSwitcher />}
          <ToggleTheme />
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase py-1 px-3 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-mono font-bold uppercase text-zinc-400 hover:text-indigo-400 transition-colors py-1 px-2"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase py-1 px-3 rounded-lg transition-colors"
              >
                Join free
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
