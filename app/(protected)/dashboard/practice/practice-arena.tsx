"use client";

import { trpc } from "@/lib/trpc/client";
import {
  ArrowRight,
  Award,
  ChevronRight,
  CircleCheck,
  Filter,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export function PracticeArena() {
  const { data, isLoading, isError } = trpc.practice.list.useQuery();
  const [category, setCategory] = useState("All");
  const categories = useMemo(
    () => [
      "All",
      ...new Set(data?.map((challenge) => challenge.category) ?? []),
    ],
    [data],
  );
  const challenges =
    category === "All"
      ? data
      : data?.filter((challenge) => challenge.category === category);

  if (isLoading)
    return (
      <div className="font-mono text-sm text-zinc-500">
        Loading the arena...
      </div>
    );
  if (isError)
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 font-mono text-sm text-red-300">
        Unable to load practice challenges. Please refresh and try again.
      </div>
    );

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-2xl border border-indigo-500/25 bg-[#131127] p-6 text-white sm:p-8">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">
            Company-style practice arena
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase black-ops-one-regular sm:text-4xl">
            Make better calls under pressure.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/70">
            Work through realistic logic, coding, systems, debugging,
            communication, and architecture scenarios. Earn XP only when you
            solve it.
          </p>
        </div>
        <div className="relative mt-7 flex flex-wrap gap-4 font-mono text-[10px] uppercase text-indigo-100/65">
          <span className="flex items-center gap-2">
            <Sparkles size={13} /> {data?.length ?? 0} live scenarios
          </span>
          <span className="flex items-center gap-2">
            <Award size={13} /> Solutions unlock after you try
          </span>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <Filter size={14} className="text-zinc-500" />
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`rounded-full px-3 py-1.5 font-mono text-[10px] font-bold uppercase transition-colors ${category === item ? "bg-indigo-600 text-white" : "bg-accent text-zinc-500 hover:text-text"}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {challenges?.map((challenge, index) => {
          const completed = challenge.progress?.status === "COMPLETED";
          return (
            <Link
              key={challenge.id}
              href={`/dashboard/practice/${challenge.slug}`}
              className="group flex flex-col gap-4 border-b border-border p-5 transition-colors last:border-b-0 hover:bg-accent/50 sm:flex-row sm:items-center sm:gap-6"
            >
              <span className="font-mono text-xs text-zinc-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase text-indigo-400">
                    {challenge.company}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-zinc-600" />
                  <span className="font-mono text-[10px] uppercase text-zinc-500">
                    {challenge.category} · {challenge.difficulty}
                  </span>
                </div>
                <h2 className="mt-1 text-xl font-bold uppercase black-ops-one-regular sm:text-2xl">
                  {challenge.title}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-zinc-400">
                  {challenge.summary}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="font-mono text-[10px] uppercase text-amber-400">
                  +{challenge.rewardXp} XP
                </span>
                {completed ? (
                  <span className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-emerald-400">
                    <CircleCheck size={14} /> Solved
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-zinc-500 group-hover:text-indigo-400">
                    Open <ChevronRight size={15} />
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      {!challenges?.length && (
        <p className="rounded-xl border border-border bg-card p-6 text-center font-mono text-sm text-zinc-500">
          No challenges in this category yet.
        </p>
      )}
      <Link
        href="/dashboard/profile"
        className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-indigo-400 hover:text-indigo-300"
      >
        View your rewards <ArrowRight size={14} />
      </Link>
    </div>
  );
}
