"use client";

import { useRouter } from "next/navigation";
import { Button } from "react-aria-components";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown } from "lucide-react";
import { useOrgSafe } from "@/contexts/org-context";

export function OrgSwitcher() {
  const router = useRouter();
  const orgCtx = useOrgSafe();

  // Not inside OrgProvider (unauthenticated / non-protected page) – render nothing
  if (!orgCtx) return null;

  const { memberships, currentOrg, switchOrg } = orgCtx;

  if (memberships.length === 0) return null;

  function handleSelect(orgId: string) {
    switchOrg(orgId);
    router.refresh();
  }

  return (
    // react-aria MenuTrigger requires: first child = Button, second child = Popover (DropdownMenu)
    <DropdownMenuTrigger>
      <Button className="flex items-center gap-x-1.5 bg-accent text-text hover:bg-indigo-500 hover:text-white text-xs font-medium py-1 px-3 rounded-lg transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
        <Building2 className="w-3.5 h-3.5" />
        <span className="max-w-[120px] truncate">
          {currentOrg?.name ?? "Select org"}
        </span>
        <ChevronDown className="w-3 h-3 opacity-80" />
      </Button>
      <DropdownMenu placement="bottom start">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuGroup>
          {memberships.map((m) => (
            <DropdownMenuItem
              key={m.organizationId}
              textValue={m.organization.name}
              onAction={() => handleSelect(m.organizationId)}
            >
              <span className="flex items-center justify-between w-full gap-2">
                <span>{m.organization.name}</span>
                {currentOrg?.id === m.organization.id && (
                  <span className="font-mono text-[10px] text-indigo-400">active</span>
                )}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          textValue="Manage organizations"
          onAction={() => router.push("/dashboard/admin")}
        >
          Manage organizations →
        </DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  );
}
