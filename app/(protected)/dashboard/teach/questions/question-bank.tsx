"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Plus, Search, Pencil, Trash2, CheckCircle, Circle,
  ChevronLeft, ChevronRight, X, Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Option = { id: string; label: string };

type FormState = {
  company: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  title: string;
  summary: string;
  prompt: string;
  hint: string;
  solution: string;
  rewardXp: number;
  interactionType: "choice" | "short-text";
  options: Option[];
  answer: string;
  placeholder: string;
};

const EMPTY: FormState = {
  company: "", category: "", difficulty: "Medium",
  title: "", summary: "", prompt: "", hint: "", solution: "",
  rewardXp: 100, interactionType: "choice",
  options: [
    { id: "A", label: "" },
    { id: "B", label: "" },
    { id: "C", label: "" },
    { id: "D", label: "" },
  ],
  answer: "A", placeholder: "",
};

const DIFF_COLOR: Record<string, string> = {
  Easy:   "text-emerald-400 bg-emerald-400/10",
  Medium: "text-amber-400 bg-amber-400/10",
  Hard:   "text-red-400 bg-red-400/10",
};

// ─── Main component ───────────────────────────────────────────────────────────

export function QuestionBank() {
  const [search, setSearch]   = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [page, setPage]       = useState(1);
  const [editId, setEditId]   = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState<FormState>(EMPTY);
  const [error, setError]     = useState("");

  const { data, isLoading, refetch } = trpc.assessment.listQuestions.useQuery(
    { search: search || undefined, category: category || undefined,
      difficulty: difficulty || undefined, page },
    { placeholderData: (prev) => prev },
  );

  const create = trpc.assessment.createQuestion.useMutation({
    onSuccess: () => { setShowForm(false); setForm(EMPTY); setError(""); refetch(); },
    onError: (e) => setError(e.message),
  });

  const update = trpc.assessment.updateQuestion.useMutation({
    onSuccess: () => { setEditId(null); setShowForm(false); setForm(EMPTY); setError(""); refetch(); },
    onError: (e) => setError(e.message),
  });

  const del = trpc.assessment.deleteQuestion.useMutation({
    onSuccess: () => refetch(),
  });

  const togglePublish = trpc.assessment.updateQuestion.useMutation({
    onSuccess: () => refetch(),
  });

  function buildInteraction() {
    return form.interactionType === "choice"
      ? { type: "choice" as const, options: form.options.filter(o => o.label), answer: form.answer }
      : { type: "short-text" as const, placeholder: form.placeholder || undefined, answer: form.answer };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      company:     form.company,
      category:    form.category,
      difficulty:  form.difficulty,
      title:       form.title,
      summary:     form.summary,
      prompt:      form.prompt,
      hint:        form.hint,
      solution:    form.solution,
      rewardXp:    form.rewardXp,
      interaction: buildInteraction(),
    };
    if (editId) {
      update.mutate({ id: editId, data: payload });
    } else {
      create.mutate(payload);
    }
  }

  function openEdit(q: NonNullable<typeof data>["questions"][0]) {
    // We can't reconstruct the interaction type from the server shape easily,
    // so default to short-text for edits unless the server returns it.
    setForm({
      ...EMPTY,
      company:    q.company,
      category:   q.category,
      difficulty: q.difficulty as "Easy" | "Medium" | "Hard",
      title:      q.title,
    });
    setEditId(q.id);
    setShowForm(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false); setEditId(null); setForm(EMPTY); setError("");
  }

  const isSaving = create.isPending || update.isPending;

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Question Bank</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage questions for practice and assessments.
          </p>
        </div>
        <button
          onClick={() => { closeForm(); setShowForm((v) => !v); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {showForm && !editId ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm && !editId ? "Cancel" : "New question"}
        </button>
      </div>

      {/* Question form */}
      {showForm && (
        <form onSubmit={handleSubmit}
          className="rounded-xl border border-indigo-500/30 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{editId ? "Edit question" : "New question"}</h2>
            <button type="button" onClick={closeForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          {/* Meta row */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Company / Source</label>
              <input required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="e.g. Google" className="input-base" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
              <input required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="e.g. System Design" className="input-base" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Difficulty</label>
              <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as "Easy"|"Medium"|"Hard" }))}
                className="input-base">
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Title (short)</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Idempotency in distributed systems" className="input-base" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Summary (card preview)</label>
            <input required value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              placeholder="One-line description" className="input-base" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Prompt <span className="text-muted-foreground/60">(full question shown to student)</span>
            </label>
            <textarea required rows={4} value={form.prompt}
              onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
              placeholder="What does idempotency mean in the context of a distributed payment API, and why is it critical?"
              className="input-base resize-none" />
          </div>

          {/* Interaction type */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Answer type</label>
            <div className="flex gap-3">
              {(["choice", "short-text"] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={t} checked={form.interactionType === t}
                    onChange={() => setForm(f => ({ ...f, interactionType: t }))}
                    className="accent-indigo-500" />
                  <span className="text-sm capitalize">{t === "choice" ? "Multiple choice" : "Short text"}</span>
                </label>
              ))}
            </div>
          </div>

          {/* MCQ options */}
          {form.interactionType === "choice" && (
            <div className="space-y-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Options</label>
              {form.options.map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-center font-mono text-xs font-bold text-indigo-400">{opt.id}</span>
                  <input value={opt.label}
                    onChange={e => setForm(f => ({ ...f, options: f.options.map((o, j) => j === i ? { ...o, label: e.target.value } : o) }))}
                    placeholder={`Option ${opt.id}`} className="input-base flex-1" />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Correct answer (option ID)</label>
                <select value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} className="input-base w-32">
                  {form.options.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Short-text */}
          {form.interactionType === "short-text" && (
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Placeholder</label>
                <input value={form.placeholder} onChange={e => setForm(f => ({ ...f, placeholder: e.target.value }))}
                  placeholder="e.g. Your answer" className="input-base" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Correct answer <span className="text-muted-foreground/60">(exact match, case-insensitive)</span>
                </label>
                <input required value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                  placeholder="idempotency key" className="input-base" />
              </div>
            </div>
          )}

          {/* Hint, solution, XP */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Hint (shown on request)</label>
              <textarea required rows={3} value={form.hint}
                onChange={e => setForm(f => ({ ...f, hint: e.target.value }))}
                placeholder="Think about what happens if a payment request is retried…"
                className="input-base resize-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Solution debrief <span className="text-muted-foreground/60">(shown after correct or reveal)</span>
              </label>
              <textarea required rows={3} value={form.solution}
                onChange={e => setForm(f => ({ ...f, solution: e.target.value }))}
                placeholder="An idempotency key is a client-generated UUID sent with each request…"
                className="input-base resize-none" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">XP reward</label>
            <input type="number" min={50} max={500} value={form.rewardXp}
              onChange={e => setForm(f => ({ ...f, rewardXp: Number(e.target.value) }))}
              className="input-base w-28" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity">
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editId ? "Save changes" : "Create question"}
            </button>
            <button type="button" onClick={closeForm}
              className="rounded-lg border border-border px-5 py-2 text-sm hover:bg-accent transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search questions…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary transition-colors" />
        </div>
        <input value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
          placeholder="Category…"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors w-36" />
        <select value={difficulty} onChange={e => { setDifficulty(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors">
          <option value="">All levels</option>
          <option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
      ) : !data?.questions.length ? (
        <div className="rounded-xl border border-dashed border-border py-14 text-center">
          <p className="text-sm font-medium">No questions yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Create your first question to build your bank.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                {["Question", "Source", "Category", "Difficulty", "XP", "Used", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.questions.map(q => (
                <tr key={q.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 max-w-[260px]">
                    <div className="flex items-center gap-2">
                      {q.published
                        ? <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-label="Published" />
                        : <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Draft" />
                      }
                      <span className="truncate font-medium">{q.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{q.company}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{q.category}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${DIFF_COLOR[q.difficulty] ?? ""}`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-amber-400">+{q.rewardXp}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{q._count.progress}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePublish.mutate({ id: q.id, data: { published: !q.published } })}
                        title={q.published ? "Unpublish" : "Publish"}
                        className={`rounded px-2 py-1 text-[10px] font-bold uppercase transition-colors ${q.published ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-border text-muted-foreground hover:bg-accent"}`}>
                        {q.published ? "Live" : "Draft"}
                      </button>
                      <button onClick={() => openEdit(q)}
                        className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        aria-label="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this question? This cannot be undone.")) del.mutate({ id: q.id }); }}
                        className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{data.total} questions</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-border p-1.5 hover:bg-accent disabled:opacity-40 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-xs">{page} / {data.pages}</span>
            <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-border p-1.5 hover:bg-accent disabled:opacity-40 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input-base {
          @apply w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
            outline-none focus:border-primary transition-colors;
        }
      `}</style>
    </div>
  );
}
