"use client";

import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TracksClient() {
  const { data: tracks, isLoading } = trpc.track.getPublicTracks.useQuery();
  const startTrack = trpc.track.startTrack.useMutation();
  const router = useRouter();
  const [starting, setStarting] = useState<string | null>(null);

  if (isLoading)
    return (
      <div className="text-zinc-500 font-mono text-sm">Loading tracks...</div>
    );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tracks?.map((track) => (
        <div
          key={track.id}
          className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-full hover:border-indigo-500/50 transition-colors"
        >
          <div className="p-5 flex-1">
            <span className="font-mono text-[10px] font-bold uppercase text-indigo-400">
              {track.category}
            </span>
            <h2 className="text-xl font-bold mt-1 text-text uppercase black-ops-one-regular">
              {track.title}
            </h2>
            <p className="mt-3 text-sm text-zinc-400 line-clamp-3">
              {track.description}
            </p>
            <div className="mt-4 flex gap-2 flex-wrap">
              <span className="font-mono text-[10px] bg-accent px-2 py-1 rounded text-zinc-400 uppercase">
                {track.modules.length} Modules
              </span>
              <span className="font-mono text-[10px] bg-accent px-2 py-1 rounded text-zinc-400 uppercase">
                {track.modules.reduce((acc, m) => acc + m.items.length, 0)}{" "}
                Items
              </span>
            </div>
          </div>
          <div className="p-5 border-t border-border bg-background flex items-center justify-between">
            <button
              onClick={async () => {
                setStarting(track.id);
                await startTrack.mutateAsync({ trackId: track.id });
                setStarting(null);
                router.push("/dashboard/learn");
              }}
              disabled={starting === track.id}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-mono text-xs font-bold uppercase text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {starting === track.id ? "Starting..." : "Start Track →"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
