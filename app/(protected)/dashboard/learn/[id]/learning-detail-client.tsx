"use client";

import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { Check } from "lucide-react";

export function LearningDetailClient({ trackId }: { trackId: string }) {
  const { data, isLoading, isError, refetch } =
    trpc.track.getLearningById.useQuery({ trackId });
  const updateProgress = trpc.track.updateProgress.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading)
    return (
      <div className="font-mono text-sm text-zinc-500">Loading course...</div>
    );
  if (isError || !data)
    return (
      <div className="font-mono text-sm text-zinc-500">
        This course is unavailable.
      </div>
    );

  const progressMap = new Map(
    data.trackProgress.map((progress) => [progress.itemId, progress.completed]),
  );

  return (
    <div className="space-y-6 pb-10">
      <Link
        href="/dashboard/learn"
        className="inline-block font-mono text-xs font-bold uppercase text-indigo-400 hover:text-indigo-300"
      >
        ← My courses
      </Link>
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-mono text-[10px] font-bold uppercase text-indigo-400">
          {data.track.category ?? "Course"}
        </p>
        <h1 className="mt-1 text-2xl font-black uppercase black-ops-one-regular">
          {data.track.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          {data.track.description}
        </p>
      </section>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {data.track.modules.map((module) => (
          <section
            key={module.id}
            className="border-b border-border last:border-b-0"
          >
            <h2 className="bg-background p-5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">
              {module.title}
            </h2>
            <div className="space-y-3 p-5">
              {module.items.map((item) => {
                const completed = progressMap.get(item.id) ?? false;
                return (
                  <div
                    key={item.id}
                    className={`flex gap-4 rounded-lg border p-4 ${completed ? "border-indigo-500/30 bg-indigo-500/5" : "border-border/50 bg-card"}`}
                  >
                    <button
                      onClick={() =>
                        updateProgress.mutate({
                          itemId: item.id,
                          completed: !completed,
                        })
                      }
                      aria-label={`Mark ${item.title} as ${completed ? "incomplete" : "complete"}`}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${completed ? "bg-indigo-500 text-white" : "border border-border bg-accent"}`}
                    >
                      {completed && <Check size={14} strokeWidth={3} />}
                    </button>
                    <div>
                      <p
                        className={`font-mono text-xs font-bold uppercase ${completed ? "text-zinc-500 line-through" : "text-text"}`}
                      >
                        {item.title}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                        {item.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
