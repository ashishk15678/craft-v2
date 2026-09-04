"use client";
import { useState } from "react";
export function DebuggingCompanion() {
  const [logs, setLogs] = useState("");
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  async function getHint(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setHint("");
    const response = await fetch("/api/student/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs }),
    });
    const data = await response.json();
    setHint(
      response.ok
        ? data.hint
        : "Your session has expired. Sign in and try again.",
    );
    setLoading(false);
  }
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">
        Context-aware debugger
      </p>
      <h1 className="mt-1 text-2xl font-black uppercase black-ops-one-regular">
        Ask for a nudge, not a solution.
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        Paste a terminal error or failed test. The companion returns the
        smallest useful next investigation.
      </p>
      <form onSubmit={getHint} className="mt-5 space-y-3">
        <textarea
          required
          value={logs}
          onChange={(event) => setLogs(event.target.value)}
          placeholder={
            "Example: Expected 200, received 500\nTypeError: Cannot read properties of undefined"
          }
          className="min-h-44 w-full rounded-lg border border-border bg-background p-3 font-mono text-xs text-text placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
        />
        <button
          disabled={loading}
          className="rounded-lg border-8 border-indigo-500 bg-indigo-600 px-4 py-2 font-mono text-xs font-bold uppercase text-white disabled:opacity-60"
        >
          {loading ? "Reading output…" : "Get minimal hint →"}
        </button>
      </form>
      {hint && (
        <div className="mt-5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4">
          <p className="font-mono text-[10px] font-bold uppercase text-indigo-400">
            Suggested next move
          </p>
          <p className="mt-2 text-sm leading-6 text-text">{hint}</p>
        </div>
      )}
    </section>
  );
}
