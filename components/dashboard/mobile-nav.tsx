"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { DashboardSidebar } from "./sidebar";
import type { GlobalRole } from "@/lib/rbac";

interface MobileNavProps {
  user: { name: string; email: string; role: GlobalRole };
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 flex w-56 flex-col shadow-xl">
            <div className="absolute right-2 top-2 z-10">
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <DashboardSidebar user={user} />
          </div>
        </div>
      )}
    </>
  );
}
