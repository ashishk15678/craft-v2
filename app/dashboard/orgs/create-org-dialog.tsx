"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export function CreateOrgDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "INVITE" | "PRIVATE">(
    "PUBLIC",
  );
  const [error, setError] = useState("");
  const router = useRouter();

  const createOrg = trpc.org.create.useMutation({
    onSuccess: (org) => {
      setOpen(false);
      router.push(`/dashboard/orgs/${org.slug}`);
      router.refresh();
    },
    onError: (e) => setError(e.message),
  });

  function handleNameChange(v: string) {
    setName(v);
    if (!slug || slug === toSlug(name)) setSlug(toSlug(v));
  }

  function toSlug(v: string) {
    return v
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    createOrg.mutate({
      name,
      slug,
      description: description || undefined,
      visibility,
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-accent px-4 py-1 text-sm font-semibold text-foreground hover:opacity-90 transition-opacity"
      >
        New org
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black">Create organization</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <div className="space-y-1.5">
                <label htmlFor="org-name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="org-name"
                  required
                  minLength={2}
                  maxLength={80}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Engineering Guild"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="org-slug" className="text-sm font-medium">
                  Slug{" "}
                  <span className="text-muted-foreground font-normal">
                    (URL identifier)
                  </span>
                </label>
                <div className="flex items-center rounded-lg border border-border bg-background focus-within:border-primary transition-colors overflow-hidden">
                  <span className="shrink-0 px-3 py-2 text-sm text-muted-foreground border-r border-border bg-accent">
                    /orgs/
                  </span>
                  <input
                    id="org-slug"
                    required
                    minLength={2}
                    maxLength={60}
                    pattern="[a-z0-9-]+"
                    title="Lowercase letters, numbers, and hyphens only"
                    value={slug}
                    onChange={(e) => setSlug(toSlug(e.target.value))}
                    className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="org-desc" className="text-sm font-medium">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="org-desc"
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What is this organization for?"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="org-vis" className="text-sm font-medium">
                  Visibility
                </label>
                <select
                  id="org-vis"
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as typeof visibility)
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                >
                  <option value="PUBLIC">
                    Public — anyone can discover and join
                  </option>
                  <option value="INVITE">Invite only — join via link</option>
                  <option value="PRIVATE">
                    Private — owner adds members manually
                  </option>
                </select>
              </div>

              <button
                type="submit"
                disabled={createOrg.isPending}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {createOrg.isPending ? "Creating…" : "Create organization"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
