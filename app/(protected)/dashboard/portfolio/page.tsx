export default function PortfolioPage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <section className="rounded-xl border border-indigo-500/50 bg-gradient-to-br from-indigo-500/15 to-card p-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
          Verified portfolio card
        </p>
        <h1 className="mt-4 text-3xl font-black uppercase black-ops-one-regular">
          KV store engineer
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Built a persistent key/value server from first principles.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-background/60 p-3">
            <p className="font-mono text-lg font-bold">42k</p>
            <p className="text-[10px] font-mono uppercase text-zinc-500">
              requests / sec
            </p>
          </div>
          <div className="rounded-lg bg-background/60 p-3">
            <p className="font-mono text-lg font-bold">18.4ms</p>
            <p className="text-[10px] font-mono uppercase text-zinc-500">
              p99 latency
            </p>
          </div>
        </div>
        <button className="mt-6 rounded-lg border border-indigo-500 px-4 py-2 font-mono text-xs font-bold uppercase text-indigo-400">
          Copy share link
        </button>
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">
          Proof checklist
        </p>
        <div className="mt-4 space-y-3">
          {[
            ["✓", "Stage tests passed", "6 of 6 milestones verified"],
            [
              "✓",
              "Performance benchmarked",
              "Recorded against the standard harness",
            ],
            ["○", "Peer review", "Optional review unlocks final certification"],
          ].map(([icon, title, copy]) => (
            <div key={title} className="flex gap-3 rounded-lg bg-accent p-3">
              <span className="font-mono text-emerald-400">{icon}</span>
              <div>
                <p className="font-mono text-xs font-bold uppercase">{title}</p>
                <p className="mt-1 text-xs text-zinc-500">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
