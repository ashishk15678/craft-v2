"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Plus, X, Clock, Users, BarChart2, ChevronDown, ChevronUp,
  CheckSquare, Square, Loader2, Eye, EyeOff, AlertTriangle,
} from "lucide-react";

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  title: string;
  description: string;
  durationMin: number;
  rewardXp: number;
  published: boolean;
  selectedIds: string[];
};

const EMPTY: FormState = {
  title: "", description: "", durationMin: 30, rewardXp: 150,
  published: false, selectedIds: [],
};

export function AssessmentBuilder() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Data
  const { data: assessments, refetch: refetchAssessments } =
    trpc.assessment.listAssessments.useQuery();

  const { data: qData } = trpc.assessment.listQuestions.useQuery(
    { page: 1 },
    { staleTime: 30_000 },
  );

  // Results panel per assessment
  const { data: results } = trpc.assessment.attemptResults.useQuery(
    { assessmentId: expandedId! },
    { enabled: !!expandedId },
  );

  const create = trpc.assessment.createAssessment.useMutation({
    onSuccess: () => { setShowForm(false); setEditId(null); setForm(EMPTY); setError(""); refetchAssessments(); },
    onError: (e) => setError(e.message),
  });
  const update = trpc.assessment.updateAssessment.useMutation({
    onSuccess: () => { setShowForm(false); setEditId(null); setForm(EMPTY); setError(""); refetchAssessments(); },
    onError: (e) => setError(e.message),
  });
  const togglePublish = trpc.assessment.updateAssessment.useMutation({
    onSuccess: () => refetchAssessments(),
  });

  const isSaving = create.isPending || update.isPending;

  function openCreate() {
    setForm(EMPTY); setEditId(null); setError(""); setShowForm(true);
  }

  function openEdit(a: NonNullable<typeof assessments>[0]) {
    setForm({
      title: a.title, description: a.description, durationMin: a.durationMin,
      rewardXp: a.rewardXp, published: a.published,
      selectedIds: (() => { try { return JSON.parse(a.questionIds) as string[]; } catch { return []; } })(),
    });
    setEditId(a.id); setError(""); setShowForm(true);
  }

  function toggleQ(id: string) {
    setForm(f => ({
      ...f,
      selectedIds: f.selectedIds.includes(id)
        ? f.selectedIds.filter(x => x !== id)
        : [...f.selectedIds, id],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.selectedIds.length === 0) { setError("Select at least one question."); return; }
    const payload = {
      title: form.title, description: form.description,
      durationMin: form.durationMin, rewardXp: form.rewardXp,
      questionIds: form.selectedIds, published: form.published,
    };
    if (editId) { update.mutate({ id: editId, data: payload }); }
    else { create.mutate(payload); }
  }

  const questions = qData?.questions ?? [];

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Assessments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build timed tests from your question bank. Students work under a strict lockdown environment.
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> New assessment
        </button>
      </div>

      {/* Builder form */}
      {showForm && (
        <form onSubmit={handleSubmit}
          className="rounded-xl border border-indigo-500/30 bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{editId ? "Edit assessment" : "Create assessment"}</h2>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}>
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
              <input required value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Backend Engineering OA — Round 1"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Duration (min)</label>
                <input type="number" min={5} max={180} required value={form.durationMin}
                  onChange={e => setForm(f => ({ ...f, durationMin: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">XP reward</label>
                <input type="number" min={50} max={1000} value={form.rewardXp}
                  onChange={e => setForm(f => ({ ...f, rewardXp: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors" />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
            <textarea required rows={3} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe what this assessment covers and what students should expect."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none" />
          </div>

          {/* Question picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">
                Questions <span className="text-primary">({form.selectedIds.length} selected)</span>
              </label>
              {form.selectedIds.length > 0 && (
                <button type="button" onClick={() => setForm(f => ({ ...f, selectedIds: [] }))}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Clear all
                </button>
              )}
            </div>
            {questions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                No published questions yet. Create some in the Question Bank first.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {questions.map(q => {
                  const selected = form.selectedIds.includes(q.id);
                  return (
                    <button key={q.id} type="button" onClick={() => toggleQ(q.id)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/40 transition-colors ${selected ? "bg-indigo-500/5" : ""}`}>
                      {selected
                        ? <CheckSquare className="h-4 w-4 shrink-0 text-indigo-400" />
                        : <Square className="h-4 w-4 shrink-0 text-muted-foreground" />
                      }
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{q.title}</p>
                        <p className="text-[10px] text-muted-foreground">{q.company} · {q.category} · {q.difficulty}</p>
                      </div>
                      <span className="shrink-0 text-xs font-mono text-amber-400">+{q.rewardXp}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Estimated time */}
          {form.selectedIds.length > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {form.selectedIds.length} questions · {form.durationMin} min ·{" "}
              ~{Math.round(form.durationMin / form.selectedIds.length)} min per question
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button type="submit" disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity">
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editId ? "Save changes" : "Create assessment"}
            </button>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.published}
                onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                className="accent-indigo-500 h-4 w-4" />
              Publish immediately
            </label>
          </div>
        </form>
      )}

      {/* Assessment list */}
      {!assessments ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
      ) : assessments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-14 text-center">
          <p className="text-sm font-medium">No assessments yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map(a => {
            const qIds: string[] = (() => { try { return JSON.parse(a.questionIds) as string[]; } catch { return []; } })();
            const isExpanded = expandedId === a.id;
            return (
              <div key={a.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 p-4">
                  {/* Status */}
                  <div className={`h-2 w-2 rounded-full shrink-0 ${a.published ? "bg-emerald-500" : "bg-zinc-500"}`} aria-hidden />

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{a.title}</p>
                    <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.durationMin} min</span>
                      <span>{qIds.length} questions</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{a._count.attempts} attempts</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => togglePublish.mutate({ id: a.id, data: { published: !a.published } })}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${a.published ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-border text-muted-foreground hover:bg-accent"}`}>
                      {a.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {a.published ? "Published" : "Draft"}
                    </button>
                    <button onClick={() => openEdit(a)}
                      className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-accent transition-colors">
                      Edit
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : a.id)}
                      className="flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs hover:bg-accent transition-colors">
                      <BarChart2 className="h-3 w-3" />
                      Results
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {/* Results panel */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-4">
                    <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                      Attempt results
                    </p>
                    {!results ? (
                      <p className="text-xs text-muted-foreground">Loading…</p>
                    ) : results.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No submissions yet.</p>
                    ) : (
                      <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border bg-accent/50">
                              {["Student", "Score", "Violations", "Auto-submit", "Submitted"].map(h => (
                                <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {results.map(r => (
                              <tr key={r.id} className="hover:bg-accent/20 transition-colors">
                                <td className="px-3 py-2">
                                  <p className="font-medium">{r.user.name}</p>
                                  <p className="text-muted-foreground">{r.user.email}</p>
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`font-bold ${(r.score ?? 0) >= 70 ? "text-emerald-500" : (r.score ?? 0) >= 40 ? "text-amber-500" : "text-red-500"}`}>
                                    {r.score ?? "—"}%
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  {r.violationCount > 0 ? (
                                    <span className="flex items-center gap-1 font-bold text-amber-500">
                                      <AlertTriangle className="h-3 w-3" />{r.violationCount}
                                    </span>
                                  ) : (
                                    <span className="text-emerald-500">✓ Clean</span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {r.autoSubmitted
                                    ? <span className="text-amber-500 font-medium">Yes (expired)</span>
                                    : <span className="text-muted-foreground">No</span>
                                  }
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">
                                  {r.submittedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(r.submittedAt)) : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
