"use client";
import { useState } from "react";

export default function CommunityPage() {
  const [requested, setRequested] = useState(false);
  async function requestReview() {
    const response = await fetch("/api/student/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "peer-review" }),
    });
    if (response.ok) setRequested(true);
  }
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">
          Leaderboards
        </p>
        <h1 className="mt-1 text-2xl font-black uppercase black-ops-one-regular">
          Friendly competition.
        </h1>
        <div className="mt-5 space-y-2">
          {[
            ["01", "Mira Chen", "Rust", "51.2k req/s"],
            ["02", "Dev Patel", "Go", "48.8k req/s"],
            ["184", "You", "TypeScript", "42.0k req/s"],
          ].map(([rank, name, language, score]) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-lg bg-accent p-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-indigo-400">
                  #{rank}
                </span>
                <div>
                  <p className="font-mono text-xs font-bold uppercase">
                    {name}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500">
                    {language}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs">{score}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">
          Peer review
        </p>
        <h2 className="mt-1 text-2xl font-black uppercase black-ops-one-regular">
          Get an architecture review.
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Request a review milestone before final certification. You will review
          another learner’s architecture as part of the exchange.
        </p>
        <button
          onClick={requestReview}
          disabled={requested}
          className="mt-5 rounded-lg border-8 border-indigo-500 bg-indigo-600 px-4 py-2 font-mono text-xs font-bold uppercase text-white disabled:opacity-60"
        >
          {requested ? "Review requested ✓" : "Request peer review →"}
        </button>
      </section>
    </div>
  );
}
