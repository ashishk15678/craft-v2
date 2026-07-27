"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface OrgData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: "PUBLIC" | "INVITE" | "PRIVATE";
  joinToken: string | null;
}

export function OrgSettingsPanel({ org }: { org: OrgData }) {
  const router = useRouter();
  const [name, setName] = useState(org.name);
  const [description, setDescription] = useState(org.description ?? "");
  const [visibility, setVisibility] = useState(org.visibility);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const update = trpc.org.update.useMutation({
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); router.refresh(); },
    onError: (e) => setError(e.message),
  });

  const rotate = trpc.org.rotateInviteToken.useMutation({
    onSuccess: () => router.refresh(),
    onError: (e) => setError(e.message),
  });

  const inviteUrl = org.joinToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${org.slug}?token=${org.joinToken}`
    : null;

  function copyInvite() {
    if (!inviteUrl) return;
    void navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-lg">
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {/* General settings */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-bold">General</h2>

        <div className="space-y-1.5">
          <label htmlFor="s-name" className="text-sm font-medium">Name</label>
          <input id="s-name" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="s-desc" className="text-sm font-medium">Description</label>
          <textarea id="s-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="s-vis" className="text-sm font-medium">Visibility</label>
          <select id="s-vis" value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors">
            <option value="PUBLIC">Public — anyone can join</option>
            <option value="INVITE">Invite only — link required</option>
            <option value="PRIVATE">Private — manual invites only</option>
          </select>
        </div>

        <button
          onClick={() => update.mutate({ organizationId: org.id, name, description: description || undefined, visibility })}
          disabled={update.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {update.isPending ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
        </button>
      </section>

      {/* Invite link */}
      {visibility !== "PUBLIC" && (
        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-bold">Invite link</h2>
          <p className="text-sm text-muted-foreground">
            Share this link so people can join your organization. Rotate it to invalidate the old link.
          </p>
          {inviteUrl ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-hidden rounded-lg bg-accent px-3 py-2 text-xs truncate">{inviteUrl}</code>
              <button onClick={copyInvite} aria-label="Copy invite link"
                className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Copy className="h-4 w-4" />
              </button>
              {copied && <span className="text-xs text-emerald-500">Copied!</span>}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No invite link yet — save your settings first.</p>
          )}
          <button
            onClick={() => rotate.mutate({ organizationId: org.id })}
            disabled={rotate.isPending}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {rotate.isPending ? "Rotating…" : "Rotate link"}
          </button>
        </section>
      )}

      {/* Danger zone */}
      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
        <h2 className="font-bold text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground">
          Deleting an organization removes all its courses, lessons, and memberships. This cannot be undone.
        </p>
        <button
          onClick={() => {
            if (confirm(`Type the org name to confirm deletion:\n\n"${org.name}"`)) {
              // org deletion is an admin-level action handled via tRPC admin router
              alert("Contact a platform ADMIN to delete this organization.");
            }
          }}
          className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/20 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete organization
        </button>
      </section>
    </div>
  );
}
