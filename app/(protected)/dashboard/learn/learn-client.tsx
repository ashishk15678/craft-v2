"use client";

import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export function LearnClient() {
  const { data, isLoading, isError } = trpc.track.getMyLearnings.useQuery();

  if (isLoading)
    return (
      <div className="font-mono text-sm text-zinc-500">
        Loading your courses...
      </div>
    );

  if (isError) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 font-mono text-sm text-red-300">
        Unable to load your courses. Please refresh and try again.
      </div>
    );
  }

  if (!data?.enrollments.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <BookOpen className="mx-auto mb-3 text-indigo-400" size={28} />
        <p className="mb-4 font-mono text-sm text-zinc-500">
          You haven&apos;t enrolled in any courses yet.
        </p>
        <Link
          href="/dashboard/tracks"
          className="inline-block rounded-lg bg-indigo-600 px-4 py-2 font-mono text-xs font-bold uppercase text-white transition-colors hover:bg-indigo-500"
        >
          Browse courses
        </Link>
      </div>
    );
  }

  const progressByItem = new Map(
    data.trackProgress.map((progress) => [progress.itemId, progress.completed]),
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.enrollments.map(({ track }) => {
        const itemIds = track.modules.flatMap((module) =>
          module.items.map((item) => item.id),
        );
        const itemCount = itemIds.length;
        const completedCount = itemIds.filter((itemId) =>
          progressByItem.get(itemId),
        ).length;
        const progress =
          itemCount === 0 ? 0 : Math.round((completedCount / itemCount) * 100);

        return (
          <article
            key={track.id}
            className="flex min-h-64 flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-indigo-500/50"
          >
            <div className="flex-1 p-5">
              <p className="font-mono text-[10px] font-bold uppercase text-indigo-400">
                {track.category ?? "Course"}
              </p>
              <h2 className="mt-1 text-xl font-bold uppercase text-text black-ops-one-regular">
                {track.title}
              </h2>
              <p className="mt-3 line-clamp-3 text-sm text-zinc-400">
                {track.description}
              </p>
              <div className="mt-5 flex items-center justify-between gap-3 font-mono text-[10px] uppercase text-zinc-500">
                <span>{track.modules.length} modules</span>
                <span>{itemCount} lessons</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent">
                <div
                  className="h-full bg-indigo-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase text-indigo-400">
                {progress}% complete
              </p>
            </div>
            <div className="border-t border-border bg-background p-5">
              <Link
                href={`/dashboard/learn/${track.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-mono text-xs font-bold uppercase text-white transition-colors hover:bg-indigo-500"
              >
                Explore course <ArrowRight size={14} />
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
