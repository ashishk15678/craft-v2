"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { canManageOrg, type GlobalRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = {
  ORG_OWNER: "bg-red-500/10 text-red-500",
  TEACHER:   "bg-violet-500/10 text-violet-500",
  STUDENT:   "bg-blue-500/10 text-blue-500",
};

interface Props {
  organizationId: string;
  currentUserId: string;
  currentOrgRole: string | null;
  globalRole: GlobalRole;
}

export function OrgMembersPanel({ organizationId, currentUserId, currentOrgRole, globalRole }: Props) {
  const router = useRouter();
  const canAdmin = canManageOrg(globalRole, currentOrgRole ?? undefined);

  const { data: members, isLoading } = trpc.org.members.useQuery({ organizationId });

  const updateRole = trpc.org.updateMemberRole.useMutation({ onSuccess: () => router.refresh() });
  const removeMember = trpc.org.removeMember.useMutation({ onSuccess: () => router.refresh() });

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Loading members…</p>;

  return (
    <div className="space-y-2">
      {members?.map((m) => (
        <div key={m.id}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
            {m.user.name[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{m.user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
          </div>
          {canAdmin && m.user.id !== currentUserId ? (
            <select
              value={m.role}
              disabled={updateRole.isPending}
              onChange={(e) => updateRole.mutate({ organizationId, memberId: m.id, role: e.target.value as "ORG_OWNER" | "TEACHER" | "STUDENT" })}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold outline-none focus:border-primary transition-colors"
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="ORG_OWNER">Owner</option>
            </select>
          ) : (
            <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase", ROLE_COLORS[m.role] ?? "bg-muted text-muted-foreground")}>
              {m.role.replace("_", " ")}
            </span>
          )}
          {canAdmin && m.user.id !== currentUserId && (
            <button
              onClick={() => { if (confirm("Remove this member?")) removeMember.mutate({ organizationId, memberId: m.id }); }}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Remove member"
            >
              <UserX className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
