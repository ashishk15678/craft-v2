"use client";

import { useEffect, useState } from "react";

type Progress = {
  activeChallenge: string;
  language: string;
  currentStage: number;
  totalStages: number;
  hintsUsed: number;
  peerReviewRequested: boolean;
};
const stages = [
  "PING",
  "GET / SET",
  "Persistence",
  "Indexes",
  "Query planner",
  "Benchmarks",
];

export function StudentProgress({ compact = false }: { compact?: boolean }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/student/progress")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setProgress)
      .finally(() => setLoading(false));
  }, []);
  async function update(
    action: "previous" | "advance" | "hint" | "peer-review",
  ) {
    const response = await fetch("/api/student/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (response.ok) setProgress(await response.json());
  }
  if (loading || !progress)
    return (
      <div className="animate-pulse rounded-xl border border-border bg-card p-5 text-xs font-mono text-zinc-500">
        Loading your workspace…
      </div>
    );
  const complete = progress.currentStage - 1;
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">
            Current build
          </p>
          <h1 className="mt-1 text-2xl font-black uppercase black-ops-one-regular">
            {progress.activeChallenge}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {progress.language} · Stage {progress.currentStage} of{" "}
            {progress.totalStages}
          </p>
        </div>
        <span className="w-fit rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-bold uppercase text-emerald-400">
          Local git workflow
        </span>
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-6">
        {stages.map((stage, index) => (
          <div key={stage} className="space-y-2">
            <div
              className={`h-2 rounded-sm ${index < complete ? "bg-indigo-500" : index === complete ? "bg-indigo-500/50" : "bg-accent"}`}
            />
            <p
              className={`text-[10px] font-mono uppercase ${index === complete ? "text-indigo-400" : "text-zinc-500"}`}
            >
              {index + 1}. {stage}
            </p>
          </div>
        ))}
      </div>
      {!compact && (
        <>
          <div className="mt-6 rounded-lg bg-background p-4">
            <p className="font-mono text-xs font-bold uppercase text-text">
              Stage brief: persistence
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Persist your key/value data between restarts. Keep the storage
              boundary small, write the failing test first, and verify only the
              focused persistence suite.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => update("previous")}
              disabled={progress.currentStage === 1}
              className="rounded-lg border border-border bg-accent px-4 py-2 font-mono text-xs font-bold uppercase disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              onClick={() => update("advance")}
              disabled={progress.currentStage === progress.totalStages}
              className="rounded-lg border-8 border-indigo-500 bg-indigo-600 px-4 py-2 font-mono text-xs font-bold uppercase text-white disabled:opacity-40"
            >
              Mark stage complete →
            </button>
            <button
              onClick={() => update("hint")}
              className="rounded-lg border border-border bg-background px-4 py-2 font-mono text-xs font-bold uppercase text-indigo-400"
            >
              Use a hint ({progress.hintsUsed})
            </button>
          </div>
        </>
      )}
    </section>
  );
}
