import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-2.5rem)] flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}
