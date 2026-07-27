"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export function CreateCourseDialog({ organizationId, orgSlug }: { organizationId: string; orgSlug: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const create = trpc.course.create.useMutation({
    onSuccess: (c) => { setOpen(false); router.push(`/dashboard/orgs/${orgSlug}/courses/${c.slug}`); router.refresh(); },
    onError: (e) => setError(e.message),
  });

  function toSlug(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  }
  function handleTitleChange(v: string) { setTitle(v); if (!slug || slug === toSlug(title)) setSlug(toSlug(v)); }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
        <Plus className="h-3.5 w-3.5" /> New course
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black">New course</h2>
              <button onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setError(""); create.mutate({ organizationId, title, slug, description: description || undefined }); }} className="space-y-4">
              {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

              <div className="space-y-1.5">
                <label htmlFor="c-title" className="text-sm font-medium">Title</label>
                <input id="c-title" required minLength={2} value={title} onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Introduction to TypeScript"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="c-slug" className="text-sm font-medium">Slug</label>
                <input id="c-slug" required minLength={2} pattern="[a-z0-9-]+" value={slug} onChange={(e) => setSlug(toSlug(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="c-desc" className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
                <textarea id="c-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none" />
              </div>

              <button type="submit" disabled={create.isPending}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity">
                {create.isPending ? "Creating…" : "Create course"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
