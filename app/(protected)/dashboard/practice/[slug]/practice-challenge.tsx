"use client";

import { trpc } from "@/lib/trpc/client";
import {
  ArrowLeft,
  Award,
  Check,
  Lightbulb,
  LockKeyhole,
  Send,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { KeyMaze } from "./key-maze";

export function PracticeChallenge({ slug }: { slug: string }) {
  const { data, isLoading, isError, refetch } =
    trpc.practice.getChallenge.useQuery({ slug });
  const start = trpc.practice.start.useMutation({ onSuccess: () => refetch() });
  const submit = trpc.practice.submit.useMutation({
    onSuccess: () => refetch(),
  });
  const reveal = trpc.practice.revealSolution.useMutation({
    onSuccess: () => refetch(),
  });
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{
    correct: boolean;
    gainedXp: number;
  } | null>(null);
  const [showHint, setShowHint] = useState(false);

  if (isLoading)
    return (
      <div className="font-mono text-sm text-zinc-500">
        Loading challenge...
      </div>
    );
  if (isError || !data)
    return (
      <div className="font-mono text-sm text-zinc-500">
        This challenge is unavailable.
      </div>
    );

  const solved = data.progress?.status === "COMPLETED";
  const started = data.progress?.status === "IN_PROGRESS" || solved;
  const isChoice = data.interaction.type === "choice";
  // TODO : interaction type == maze
  const isMaze = data.interaction.type === "short-text";
  const challengeId = data.id;

  async function handleSubmit() {
    if (!answer) return;
    const response = await submit.mutateAsync({ challengeId, answer });
    setResult({
      correct: response.correct,
      gainedXp: response.reward?.xp ?? 0,
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <Link
        href="/dashboard/practice"
        className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-indigo-400 hover:text-indigo-300"
      >
        <ArrowLeft size={14} /> Practice arena
      </Link>
      <header className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase">
          <span className="font-bold text-indigo-400">{data.company}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-500">
            {data.category} · {data.difficulty}
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-black uppercase black-ops-one-regular sm:text-4xl">
          {data.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">
          {data.prompt}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-amber-400">
            <Award size={13} /> +{data.rewardXp} XP
          </span>
          <span className="font-mono text-[10px] uppercase text-zinc-500">
            {data.progress?.attempts ?? 0} attempts
          </span>
        </div>
      </header>

      {!started ? (
        <section className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-6">
          <p className="font-mono text-xs font-bold uppercase text-indigo-400">
            Ready when you are
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Start the challenge to record your attempt and unlock the response
            controls.
          </p>
          <button
            onClick={() => start.mutate({ challengeId: data.id })}
            disabled={start.isPending}
            className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 font-mono text-xs font-bold uppercase text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {start.isPending ? "Starting..." : "Start challenge →"}
          </button>
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">
                Your response
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Choose deliberately. You can retry if it is not quite right.
              </p>
            </div>
            {!solved && (
              <button
                onClick={() => setShowHint((value) => !value)}
                className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-indigo-400"
              >
                <Lightbulb size={15} /> {showHint ? "Hide hint" : "Use hint"}
              </button>
            )}
          </div>
          {showHint && !solved && (
            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-6 text-amber-100/80">
              {data.hint}
            </div>
          )}
          {isMaze ? (
            <KeyMaze
              onComplete={() => {
                setAnswer("escaped");
                void handleSubmit();
              }}
            />
          ) : (
            <>
              {isChoice ? (
                <div className="mt-5 grid gap-3">
                  {data.interaction.options?.map((option) => (
                    <button
                      key={option.id}
                      disabled={solved}
                      onClick={() => setAnswer(option.id)}
                      className={`flex items-start gap-3 rounded-lg border p-4 text-left text-sm transition-colors ${answer === option.id ? "border-indigo-500 bg-indigo-500/10" : "border-border bg-background hover:border-indigo-500/50"} ${solved ? "opacity-70" : ""}`}
                    >
                      <span className="font-mono text-xs font-bold text-indigo-400">
                        {option.id}
                      </span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answer}
                  disabled={solved}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder={
                    data.interaction.placeholder ?? "Write your answer"
                  }
                  className="mt-5 min-h-32 w-full rounded-lg border border-border bg-background p-4 font-mono text-sm text-text placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                />
              )}
              {!solved && (
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => void handleSubmit()}
                    disabled={!answer || submit.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-mono text-xs font-bold uppercase text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    <Send size={14} />{" "}
                    {submit.isPending ? "Checking..." : "Submit answer"}
                  </button>
                  {data.progress && (
                    <button
                      onClick={() => reveal.mutate({ challengeId: data.id })}
                      disabled={reveal.isPending}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-mono text-xs font-bold uppercase text-zinc-400 hover:text-text"
                    >
                      <LockKeyhole size={14} /> Reveal solution
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {result && (
        <section
          className={`rounded-xl border p-5 ${result.correct ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}
        >
          <p
            className={`font-mono text-xs font-bold uppercase ${result.correct ? "text-emerald-400" : "text-amber-400"}`}
          >
            {result.correct
              ? "Correct call."
              : "Not quite — sharpen the signal."}
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            {result.correct
              ? `You earned ${result.gainedXp} XP. The full solution is now unlocked below.`
              : "Try again, use the hint, or reveal the solution to study the reasoning."}
          </p>
        </section>
      )}
      {data.solution ? (
        <section className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-6">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
            <Trophy size={15} /> Solution debrief
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            {data.solution}
          </p>
          {solved && (
            <Link
              href="/dashboard/profile"
              className="mt-5 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-emerald-400 hover:text-emerald-300"
            >
              <Check size={14} /> View reward profile
            </Link>
          )}
        </section>
      ) : null}
    </div>
  );
}
