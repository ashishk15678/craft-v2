"use client";

import { trpc } from "@/lib/trpc/client";
import { Award, Flame, Sparkles, Trophy, type LucideIcon } from "lucide-react";
import Link from "next/link";

type Stat = {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color: string;
};

export function RewardProfile() {
  const { data, isLoading, isError } = trpc.practice.profile.useQuery();
  if (isLoading)
    return (
      <div className="font-mono text-sm text-zinc-500">
        Loading your rewards...
      </div>
    );
  if (isError || !data)
    return (
      <div className="font-mono text-sm text-zinc-500">
        Unable to load your reward profile.
      </div>
    );

  const nextLevelXp = data.profile.level * 500;
  const levelProgress = Math.round(((data.profile.xp % 500) / 500) * 100);
  const stats: Stat[] = [
    {
      icon: Trophy,
      value: data.profile.completedCount,
      label: "Scenarios solved",
      color: "text-emerald-400",
    },
    {
      icon: Flame,
      value: `${data.profile.currentStreak} day`,
      label: "Current streak",
      color: "text-orange-400",
    },
    {
      icon: Award,
      value: `${data.profile.longestStreak} day`,
      label: "Best streak",
      color: "text-amber-400",
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <section className="overflow-hidden rounded-2xl border border-indigo-500/30 bg-linear-to-br from-indigo-600/20 via-card to-card p-6 sm:p-8">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
          Your reward profile
        </p>
        <div className="mt-4 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-black uppercase black-ops-one-regular">
              Level {data.profile.level}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Every solved practice scenario becomes proof of your judgment.
            </p>
          </div>
          <Link
            href="/dashboard/practice"
            className="rounded-lg bg-indigo-600 px-4 py-2 font-mono text-xs font-bold uppercase text-white hover:bg-indigo-500"
          >
            Enter arena →
          </Link>
        </div>
        <div className="mt-7">
          <div className="mb-2 flex justify-between font-mono text-[10px] uppercase text-zinc-500">
            <span>{data.profile.xp} XP</span>
            <span>
              {nextLevelXp} XP to level {data.profile.level + 1}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-300"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ icon: Icon, value, label, color }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <Icon size={18} className={color} />
            <p className="mt-4 font-mono text-2xl font-bold">{value}</p>
            <p className="mt-1 font-mono text-[10px] uppercase text-zinc-500">
              {label}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-5">
          <Sparkles size={15} className="text-indigo-400" />
          <h2 className="font-mono text-xs font-bold uppercase">
            Recent practice
          </h2>
        </div>
        {data.recent.length ? (
          <div>
            {data.recent.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/practice/${item.challenge.slug}`}
                className="flex items-center justify-between gap-4 border-b border-border p-5 last:border-b-0 hover:bg-accent/50"
              >
                <div>
                  <p className="font-mono text-[10px] uppercase text-indigo-400">
                    {item.challenge.company} · {item.challenge.category}
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {item.challenge.title}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-mono text-[10px] font-bold uppercase ${item.status === "COMPLETED" ? "text-emerald-400" : "text-amber-400"}`}
                  >
                    {item.status === "COMPLETED" ? "Solved" : "In progress"}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-zinc-500">
                    {item.xpEarned} XP
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="p-6 text-sm text-zinc-500">
            Your solved challenges will appear here. Start with a quick scenario
            in the arena.
          </p>
        )}
      </section>
    </div>
  );
}
