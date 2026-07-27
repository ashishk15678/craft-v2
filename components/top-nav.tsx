import Link from "next/link";
import { getSession } from "@/lib/session";
import ToggleTheme from "./mode-toggle";

export async function TopNavBar() {
  const user = await getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          Craft
        </Link>
        <nav className="flex items-center gap-3">
          <ToggleTheme />
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
