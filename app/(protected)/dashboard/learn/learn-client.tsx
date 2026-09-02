"use client";

import { trpc } from "@/lib/trpc/client";
import { Check } from "lucide-react";

export function LearnClient() {
  const { data, isLoading, refetch } = trpc.track.getMyLearnings.useQuery();
  const updateProgress = trpc.track.updateProgress.useMutation({
    onSuccess: () => refetch()
  });

  if (isLoading) return <div className="text-zinc-500 font-mono text-sm">Loading learnings...</div>;
  if (!data?.enrollments.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-zinc-500 font-mono text-sm mb-4">You haven&apos;t started any tracks yet.</p>
        <a href="/dashboard/tracks" className="inline-block rounded-lg bg-indigo-600 px-4 py-2 font-mono text-xs font-bold uppercase text-white hover:bg-indigo-500 transition-colors">
          Browse Tracks
        </a>
      </div>
    );
  }

  const { enrollments, trackProgress } = data;
  const progressMap = new Map(trackProgress.map(p => [p.itemId, p.completed]));

  return (
    <div className="space-y-6">
      {enrollments.map(({ track }) => {
        let totalItems = 0;
        let completedItems = 0;
        
        track.modules.forEach(m => {
          m.items.forEach(i => {
            totalItems++;
            if (progressMap.get(i.id)) completedItems++;
          });
        });
        
        const pct = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

        return (
          <div key={track.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border bg-background flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase text-indigo-400">{track.category}</span>
                <h2 className="text-xl font-bold mt-1 text-text black-ops-one-regular uppercase">{track.title}</h2>
              </div>
              <div className="flex items-center gap-3 w-full md:w-48 shrink-0">
                <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="font-mono text-xs font-bold text-indigo-400 w-8 text-right">{pct}%</span>
              </div>
            </div>
            
            <div className="divide-y divide-border">
              {track.modules.map(module => (
                <div key={module.id} className="p-5 bg-background">
                  <h3 className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4">{module.title}</h3>
                  <div className="space-y-3">
                    {module.items.map(item => {
                      const completed = progressMap.get(item.id) || false;
                      let parsedData = null;
                      try {
                        if (item.data) parsedData = JSON.parse(item.data);
                      } catch {}

                      return (
                        <div key={item.id} className={`flex gap-4 p-4 rounded-lg border transition-colors ${completed ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-border/50 bg-card hover:border-border'}`}>
                          <button
                            onClick={() => updateProgress.mutate({ itemId: item.id, completed: !completed })}
                            className={`mt-0.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${completed ? 'bg-indigo-500 text-white' : 'bg-accent border border-border hover:border-indigo-500'}`}
                          >
                            {completed && <Check size={14} strokeWidth={3} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-mono text-[9px] uppercase text-zinc-500 bg-accent px-1.5 py-0.5 rounded">{item.type}</span>
                              <h4 className={`font-mono text-xs font-bold uppercase ${completed ? 'text-zinc-500 line-through' : 'text-text'}`}>{item.title}</h4>
                            </div>
                            <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{item.content}</p>
                            
                            {parsedData?.options && (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {parsedData.options.map((opt: string, i: number) => {
                                  const isCorrect = parsedData.correct === i + 1;
                                  return (
                                    <div key={i} className={`text-xs p-2.5 rounded font-mono border ${completed && isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-accent/50 border-border/50 text-zinc-400'}`}>
                                      <span className="opacity-50 mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
