"use client";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { ClipboardCheck, Clock3, Trophy } from "lucide-react";

export default function AssessmentsPage() {
  const { data, isLoading } = trpc.assessment.list.useQuery();
  const start = trpc.assessment.start.useMutation();
  if (isLoading)
    return (
      <div className="font-mono text-sm text-zinc-500">
        Loading assessments...
      </div>
    );
  return (
    <div className="space-y-5 pb-10">
      <section className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-indigo-400">
          Timed test centre
        </p>
        <h1 className="mt-2 text-3xl font-black uppercase black-ops-one-regular">
          Take the assessment.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-400">
          Original questions built around publicly discussed online-assessment
          formats. Timers run from the moment you begin; review appears after
          submission.
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((assessment) => (
          <article
            key={assessment.id}
            className="flex flex-col rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between">
              <ClipboardCheck className="text-indigo-400" size={21} />
              <span className="font-mono text-[10px] uppercase text-amber-400">
                +{assessment.rewardXp} XP
              </span>
            </div>
            <h2 className="mt-6 text-2xl font-bold uppercase black-ops-one-regular">
              {assessment.title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-zinc-400">
              {assessment.description}
            </p>
            <div className="mt-6 flex items-center justify-between font-mono text-[10px] uppercase text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock3 size={13} />
                {assessment.durationMin} min · {assessment.questionCount}{" "}
                questions
              </span>
              {assessment.latest && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Trophy size={13} />
                  {assessment.latest.score}%
                </span>
              )}
            </div>
            <button
              onClick={async () => {
                const attempt = await start.mutateAsync({
                  slug: assessment.slug,
                });
                window.location.assign(`/dashboard/assessments/${attempt.id}`);
              }}
              className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 font-mono text-xs font-bold uppercase text-white hover:bg-indigo-500"
            >
              {start.isPending ? "Preparing..." : "Begin test →"}
            </button>
          </article>
        ))}
      </div>
      <Link
        href="/dashboard/practice"
        className="font-mono text-xs font-bold uppercase text-indigo-400"
      >
        ← Back to practice
      </Link>
    </div>
  );
}
