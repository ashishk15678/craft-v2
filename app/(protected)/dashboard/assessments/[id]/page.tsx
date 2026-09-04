"use client";

/**
 * Secure assessment environment.
 *
 * Lockdown measures (assessment only — practice has NONE of this):
 *   ▸ Fullscreen enforced on start; exit triggers a violation + warning
 *   ▸ Tab / window visibility change → logged + warning shown
 *   ▸ Copy / paste keyboard shortcuts intercepted and blocked
 *   ▸ Right-click context menu disabled
 *   ▸ Text selection disabled via CSS
 *   ▸ DevTools resize heuristic (window height shrinks significantly)
 *   ▸ Timer counts down server-side; client calls autoSubmit when it hits 0
 *   ▸ 5+ violations → forced auto-submit
 *   ▸ All violations fire logViolation to be stored server-side
 *
 * These are deterrence measures — not unbreakable. They raise the bar
 * meaningfully for an online environment without specialized hardware.
 */

import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle, CheckCircle, Clock, Lock,
  ChevronRight, Trophy, XCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Question = {
  id: string;
  title: string;
  prompt: string;
  company: string;
  category: string;
  difficulty: string;
  interaction: {
    type: "choice" | "short-text";
    options?: { id: string; label: string }[];
    placeholder?: string;
  };
  answer: string | null;
  solution: string | null;
  correct: boolean | null;
};

const DIFF_COLOR: Record<string, string> = {
  Easy:   "text-emerald-400",
  Medium: "text-amber-400",
  Hard:   "text-red-400",
};

const AUTO_SUBMIT_VIOLATIONS = 5;

// ─── Lockdown hook ────────────────────────────────────────────────────────────

function useLockdown(
  attemptId: string | undefined,
  done: boolean,
  onViolation: (event: string) => void,
) {
  const logMutation = trpc.assessment.logViolation.useMutation();
  const lastWindowHeight = useRef<number>(typeof window !== "undefined" ? window.innerHeight : 0);

  const log = useCallback(
    (event: string) => {
      if (!attemptId || done) return;
      logMutation.mutate({ attemptId, event: event as Parameters<typeof logMutation.mutate>[0]["event"], ts: Date.now() });
      onViolation(event);
    },
    [attemptId, done, logMutation, onViolation],
  );

  useEffect(() => {
    if (done || !attemptId) return;

    // ── Visibility change (tab switch) ──────────────────────────────────────
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") log("tab_hidden");
    }

    // ── Window blur (alt-tab, OS focus change) ──────────────────────────────
    function onBlur() { log("window_blur"); }

    // ── Block copy/paste ────────────────────────────────────────────────────
    function onKeyDown(e: KeyboardEvent) {
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier && (e.key === "c" || e.key === "C")) {
        e.preventDefault(); log("copy_attempt");
      }
      if (isModifier && (e.key === "v" || e.key === "V")) {
        e.preventDefault(); log("paste_attempt");
      }
      // Block F12, Ctrl+Shift+I/J/C (DevTools shortcuts)
      if (
        e.key === "F12" ||
        (isModifier && e.shiftKey && ["i", "I", "j", "J", "c", "C"].includes(e.key))
      ) {
        e.preventDefault(); log("devtools_resize");
      }
    }

    // ── Block right-click ───────────────────────────────────────────────────
    function onContextMenu(e: MouseEvent) {
      e.preventDefault(); log("context_menu");
    }

    // ── Fullscreen exit ─────────────────────────────────────────────────────
    function onFullscreenChange() {
      if (!document.fullscreenElement) log("fullscreen_exit");
    }

    // ── DevTools resize heuristic ───────────────────────────────────────────
    function onResize() {
      const delta = lastWindowHeight.current - window.innerHeight;
      if (delta > 160) log("devtools_resize");
      lastWindowHeight.current = window.innerHeight;
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("keydown", onKeyDown, { capture: true });
    document.addEventListener("contextmenu", onContextMenu, { capture: true });
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("keydown", onKeyDown, { capture: true });
      document.removeEventListener("contextmenu", onContextMenu, { capture: true });
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("resize", onResize);
    };
  }, [attemptId, done, log]);
}

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(initialSec: number | null, active: boolean): number | null {
  const [seconds, setSeconds] = useState<number | null>(initialSec);
  const deadline = useRef<number | null>(
    initialSec != null ? Date.now() + initialSec * 1000 : null,
  );

  // Sync deadline when initialSec arrives for the first time
  useEffect(() => {
    if (initialSec != null && deadline.current === null) {
      deadline.current = Date.now() + initialSec * 1000;
      setSeconds(initialSec);
    }
  }, [initialSec]);

  useEffect(() => {
    if (!active || deadline.current === null) return;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline.current! - Date.now()) / 1000));
      setSeconds(remaining);
    }, 500);
    return () => window.clearInterval(id);
  }, [active]);

  return seconds;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssessmentAttemptPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, refetch } = trpc.assessment.attempt.useQuery(
    { id },
    { refetchOnWindowFocus: false },
  );

  const submit    = trpc.assessment.submit.useMutation({ onSuccess: () => void refetch() });
  const autoSub   = trpc.assessment.autoSubmit.useMutation({ onSuccess: () => void refetch() });

  const [answers, setAnswers]       = useState<Record<string, string>>({});
  const [violations, setViolations] = useState<string[]>([]);
  const [warning, setWarning]       = useState<string | null>(null);
  const [warningTimer, setWarningTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [fullscreenEntered, setFullscreenEntered] = useState(false);
  const [activeQ, setActiveQ]       = useState(0);
  const hasAutoSubmitted            = useRef(false);

  const done     = !!data?.submittedAt;
  const isPending = submit.isPending || autoSub.isPending;

  const seconds = useCountdown(
    data && !done ? data.remainingSec : null,
    !!data && !done,
  );

  // ── Violation handler ───────────────────────────────────────────────────────
  const handleViolation = useCallback((event: string) => {
    setViolations((v) => {
      const next = [...v, event];

      // Show warning banner
      const msg = {
        tab_hidden:      "⚠ Switching tabs is not allowed during an assessment.",
        window_blur:     "⚠ The assessment window lost focus. Stay focused.",
        fullscreen_exit: "⚠ You exited fullscreen. Please re-enter to continue.",
        copy_attempt:    "⚠ Copying is disabled during assessments.",
        paste_attempt:   "⚠ Pasting is disabled during assessments.",
        context_menu:    "⚠ Right-click is disabled.",
        devtools_resize: "⚠ Developer tools are not allowed.",
      }[event] ?? "⚠ Suspicious activity detected.";

      setWarning(msg);
      if (warningTimer) clearTimeout(warningTimer);
      setWarningTimer(setTimeout(() => setWarning(null), 5000));

      // Force submit after too many violations
      if (next.length >= AUTO_SUBMIT_VIOLATIONS && !hasAutoSubmitted.current) {
        hasAutoSubmitted.current = true;
        setTimeout(() => {
          autoSub.mutate({ id, answers });
        }, 1500);
      }

      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, answers, autoSub, warningTimer]);

  useLockdown(data?.id, done, handleViolation);

  // ── Auto-submit when timer hits 0 ───────────────────────────────────────────
  useEffect(() => {
    if (seconds !== 0 || done || hasAutoSubmitted.current || !data?.id) return;
    hasAutoSubmitted.current = true;
    autoSub.mutate({ id, answers });
  }, [seconds, done, data?.id, id, answers, autoSub]);

  // ── Enter fullscreen on mount ───────────────────────────────────────────────
  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
      setFullscreenEntered(true);
    } catch {
      // Browser denied — proceed anyway, log won't fire until they exit
      setFullscreenEntered(true);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function fmtTime(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function answeredCount() {
    return (data?.questions ?? []).filter(q => answers[q.id]).length;
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground animate-pulse">Loading assessment…</p>
      </div>
    );
  }

  const questions: Question[] = data.questions as Question[];
  const totalQ = questions.length;
  const current = questions[activeQ];

  // ── Pre-assessment: fullscreen gate ──────────────────────────────────────────
  if (!done && !fullscreenEntered) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="w-full max-w-md rounded-2xl border border-indigo-500/30 bg-card p-8 space-y-5">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-indigo-500/10">
            <Lock className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-black">{data.assessment.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{data.assessment.description}</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-400 text-left space-y-1">
            <p className="font-bold">Before you begin:</p>
            <ul className="mt-2 space-y-1 text-amber-300/80 text-xs list-disc list-inside">
              <li>The test opens in fullscreen. Do not exit.</li>
              <li>Tab switching is monitored and logged.</li>
              <li>Copy / paste and right-click are disabled.</li>
              <li>{AUTO_SUBMIT_VIOLATIONS}+ violations will auto-submit your attempt.</li>
              <li>The timer starts the moment you click Begin.</li>
              <li>You have <strong>{data.assessment.rewardXp} XP</strong> on the line.</li>
            </ul>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{Math.floor(data.durationSec / 60)} minutes</span>
            <span>{totalQ} questions</span>
          </div>
          <button onClick={enterFullscreen}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold uppercase text-white hover:bg-indigo-500 transition-colors">
            Enter fullscreen &amp; begin →
          </button>
          <Link href="/dashboard/assessments"
            className="block text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to assessments
          </Link>
        </div>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────────
  if (done) {
    const score = data.score ?? 0;
    const xpEarned = Math.round((data.assessment.rewardXp * score) / 100);
    const vCount = data.violationCount;
    return (
      <div
        className="mx-auto max-w-2xl space-y-5 pb-10"
        /* Re-enable text selection in results */
        style={{ userSelect: "text" }}
      >
        <div className={`rounded-2xl border p-8 text-center space-y-3 ${
          score >= 70 ? "border-emerald-500/30 bg-emerald-500/5"
            : score >= 40 ? "border-amber-500/30 bg-amber-500/5"
            : "border-red-500/30 bg-red-500/5"
        }`}>
          <p className="font-mono text-xs font-bold uppercase text-muted-foreground">Assessment complete</p>
          <p className="text-5xl font-black">{score}%</p>
          <p className={`text-sm ${score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "text-red-400"}`}>
            {score >= 70 ? "Strong performance." : score >= 40 ? "Room to improve." : "Needs more work."}
          </p>
          <p className="text-sm text-muted-foreground">+{xpEarned} XP earned</p>
          {data.autoSubmitted && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-amber-500">
              <Clock className="h-3.5 w-3.5" /> Auto-submitted — time expired
            </p>
          )}
          {vCount > 0 && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-amber-500">
              <AlertTriangle className="h-3.5 w-3.5" /> {vCount} violation{vCount !== 1 ? "s" : ""} logged
            </p>
          )}
        </div>

        {/* Per-question review */}
        <div className="space-y-3">
          <h2 className="font-bold">Review</h2>
          {questions.map((q, i) => (
            <div key={q.id}
              className={`rounded-xl border p-5 space-y-3 ${q.correct ? "border-emerald-500/20" : "border-red-500/20"}`}>
              <div className="flex items-start gap-3">
                {q.correct
                  ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                }
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Q{i + 1} · {q.company} · {q.category}</p>
                  <p className="font-medium text-sm">{q.prompt}</p>
                </div>
              </div>
              {q.solution && (
                <div className="rounded-lg bg-card border border-border px-4 py-3 text-sm">
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Solution</p>
                  <p className="text-muted-foreground leading-relaxed">{q.solution}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/assessments"
            className="rounded-lg border border-border px-5 py-2 text-sm hover:bg-accent transition-colors">
            ← All assessments
          </Link>
          <Link href="/dashboard/profile"
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
            <Trophy className="h-4 w-4" /> View profile
          </Link>
        </div>
      </div>
    );
  }

  // ── Active test ───────────────────────────────────────────────────────────────
  const remaining = seconds ?? data.remainingSec;
  const criticalTime = remaining < 60;
  const pctDone = totalQ > 0 ? Math.round((answeredCount() / totalQ) * 100) : 0;

  return (
    /* Disable text selection, context menu visually */
    <div
      className="mx-auto max-w-3xl pb-10 space-y-4"
      style={{ userSelect: "none" }}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Violation warning banner */}
      {warning && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-400 animate-in slide-in-from-top"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{warning}</span>
          {violations.length >= AUTO_SUBMIT_VIOLATIONS - 1 && (
            <span className="ml-auto font-bold text-red-400 shrink-0">
              1 violation until auto-submit!
            </span>
          )}
        </div>
      )}

      {/* Sticky header */}
      <header className="sticky top-10 z-20 rounded-xl border border-border bg-card/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">{data.assessment.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Q{activeQ + 1} of {totalQ} · {answeredCount()} answered
            </p>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-1.5 font-mono text-lg font-black shrink-0 ${criticalTime ? "text-red-400 animate-pulse" : "text-indigo-400"}`}>
            <Clock className="h-4 w-4" aria-hidden />
            {fmtTime(remaining)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${pctDone}%` }}
            role="progressbar"
            aria-valuenow={pctDone}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Violation counter */}
        {violations.length > 0 && (
          <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-amber-500">
            <AlertTriangle className="h-2.5 w-2.5" />
            {violations.length} violation{violations.length !== 1 ? "s" : ""} recorded
            {violations.length >= AUTO_SUBMIT_VIOLATIONS - 1 && " — next auto-submits"}
          </p>
        )}
      </header>

      {/* Question navigator strip */}
      <div className="flex gap-1.5 flex-wrap">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setActiveQ(i)}
            className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
              i === activeQ
                ? "bg-indigo-600 text-white"
                : answers[q.id]
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                : "bg-accent text-muted-foreground border border-border hover:border-indigo-500/40"
            }`}
            aria-label={`Question ${i + 1}${answers[q.id] ? " — answered" : ""}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Current question */}
      {current && (
        <section className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div>
            <p className="font-mono text-[10px] uppercase text-muted-foreground">
              {current.company} · {current.category} ·{" "}
              <span className={DIFF_COLOR[current.difficulty] ?? ""}>{current.difficulty}</span>
            </p>
            <h2 className="mt-3 text-base font-semibold leading-relaxed"
              /* Allow reading but not selection */
              style={{ userSelect: "none" }}>
              {current.prompt}
            </h2>
          </div>

          {current.interaction.type === "choice" ? (
            <div className="space-y-2" role="radiogroup" aria-label="Answer options">
              {current.interaction.options?.map((opt) => {
                const selected = answers[current.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setAnswers(a => ({ ...a, [current.id]: opt.id }))}
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-all ${
                      selected
                        ? "border-indigo-500 bg-indigo-500/10 shadow-sm shadow-indigo-500/20"
                        : "border-border bg-background hover:border-indigo-500/40"
                    }`}
                  >
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                      selected ? "border-indigo-500 bg-indigo-500 text-white" : "border-border"
                    }`}>
                      {opt.id}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <textarea
                value={answers[current.id] ?? ""}
                onChange={e => setAnswers(a => ({ ...a, [current.id]: e.target.value }))}
                placeholder={current.interaction.placeholder ?? "Type your answer here…"}
                rows={4}
                /* Allow typing but not pasting — keyboard handler blocks Ctrl+V */
                style={{ userSelect: "text" }}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors resize-none font-mono"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Type your answer. Paste is disabled.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Navigation + submit */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            disabled={activeQ === 0}
            onClick={() => setActiveQ(i => i - 1)}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-40 transition-colors"
          >
            ← Prev
          </button>
          <button
            disabled={activeQ === totalQ - 1}
            onClick={() => setActiveQ(i => i + 1)}
            className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-40 transition-colors"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          onClick={() => {
            const unanswered = totalQ - answeredCount();
            if (unanswered > 0) {
              if (!confirm(`You have ${unanswered} unanswered question${unanswered !== 1 ? "s" : ""}. Submit anyway?`)) return;
            }
            submit.mutate({ id, answers });
          }}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold uppercase text-white hover:bg-indigo-500 disabled:opacity-60 transition-all"
        >
          {isPending ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Submitting…
            </>
          ) : (
            <>Submit test <Lock className="h-3.5 w-3.5" /></>
          )}
        </button>
      </div>

      {/* Answered summary */}
      <p className="text-xs text-center text-muted-foreground">
        {answeredCount()} of {totalQ} questions answered
        {criticalTime && <span className="ml-2 text-red-400 font-bold">— Less than 1 minute left!</span>}
      </p>
    </div>
  );
}
