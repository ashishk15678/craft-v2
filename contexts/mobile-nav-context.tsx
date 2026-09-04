"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface MobileNavContextType {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const MobileNavContext = createContext<MobileNavContextType | undefined>(
  undefined,
);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <MobileNavContext.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const context = useContext(MobileNavContext);
  if (context === undefined) {
    throw new Error("useMobileNav must be used within a MobileNavProvider");
  }
  return context;
}
