"use client";

import { useMobileNav } from "@/contexts/mobile-nav-context";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function MobileNavToggle() {
  const { setMobileOpen } = useMobileNav();

  return (
    <button
      onClick={() => setMobileOpen(true)}
      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-1 px-1.5 rounded-md transition-colors lg:hidden"
    >
      <HugeiconsIcon icon={Menu01Icon} size={18} />
    </button>
  );
}
