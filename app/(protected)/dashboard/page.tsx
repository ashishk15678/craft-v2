import Link from "next/link";
import { RoleGateway } from "@/components/role-workspaces";
import { getStudentSession } from "@/lib/student-session";

const stages = ["PING", "GET / SET", "Persistence", "Indexes", "Query planner", "Benchmarks"];

const tracks = [
  {
    icon: "✦",
    name: "AI & ML Engineering",
    projects: "Vector Database · Local RAG Engine · AI Agent Framework",
    skills: "Embeddings, chunking, orchestration, function calling",
    tone: "border-violet-500/40 bg-violet-500/10 text-violet-400",
  },
  {
    icon: "◫",
    name: "Web & Frameworks",
    projects: "Virtual DOM · Mini Next.js Router · WebSocket Server",
    skills: "Rendering, SSR, protocols, event loops",
    tone: "border-sky-500/40 bg-sky-500/10 text-sky-400",
  },
  {
    icon: "▣",
    name: "DevOps & Infra",
    projects: "Mini Docker · CI/CD Runner · Layer 7 Load Balancer",
    skills: "cgroups, namespaces, orchestration, sockets",
    tone: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  },
  {
    icon: "⌘",
    name: "Fintech & Security",
    projects: "OAuth2 Server · Payment Queue · Blockchain Ledger",
    skills: "JWTs, encryption, idempotency, state",
    tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  },
];

const utilities = [
  ["⌁", "AI debugging companion", "Drop in terminal output for a minimal next hint.", "/dashboard/assistant"],
  ["?", "Hints & architecture diffs", "Stage-aware nudges that do not reveal the answer.", "/dashboard/learn"],
  ["◌", "Verified solutions", "Study idiomatic implementations after your attempt.", "/dashboard/portfolio"],
  ["↗", "Git / CLI workflow", "Clone locally, work in your IDE, then git push.", "/dashboard/learn"],
];

export default async function DashboardPage() {
  const session = await getStudentSession();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "STUDENT";
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-10 font-sans text-text">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">Learner dashboard / 01</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight black-ops-one-regular">Welcome back, builder.</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">Ship real systems from your local setup, one observable milestone at a time.</p>
          </div>
          <Link href="/dashboard/tracks" className="rounded-lg border-8 border-indigo-500 bg-indigo-600 px-5 py-2 text-center font-mono text-xs font-bold uppercase tracking-wider text-white transition-transform active:scale-[0.98]">Browse projects →</Link>
        </div>
        <div className="grid grid-cols-2 border-t border-border sm:grid-cols-4">
          {[['04', 'active stages'], ['67%', 'track complete'], ['12', 'day streak'], ['#184', 'global rank']].map(([value, label]) => (
            <div key={label} className="border-r border-border p-4 last:border-r-0">
              <p className="font-mono text-xl font-bold text-text">{value}</p>
              <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <RoleGateway role={role} />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">Continue quest</p>
              <h2 className="mt-1 text-xl font-black uppercase black-ops-one-regular">Build your own KV store</h2>
              <p className="mt-1 text-sm text-zinc-400">TypeScript · Stage 4 of 6 · Persistence</p>
            </div>
            <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-bold uppercase text-emerald-400">On track</span>
          </div>
          <div className="mt-5 flex items-center gap-1" aria-label="4 of 6 stages completed">
            {stages.map((stage, index) => <div key={stage} className={`h-2 flex-1 rounded-sm ${index < 3 ? "bg-indigo-500" : index === 3 ? "bg-indigo-500/50" : "bg-accent"}`} />)}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono uppercase text-zinc-500">
            <span>Last push: 12m ago</span><span>18 tests passing</span><span>1 hint used</span>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link href="/dashboard/learn" className="rounded-lg border-8 border-indigo-500 bg-indigo-600 px-4 py-2 text-center font-mono text-xs font-bold uppercase text-white">Resume stage 4 →</Link>
            <button className="rounded-lg border border-border bg-accent px-4 py-2 font-mono text-xs font-bold uppercase text-text">craft clone kv-store</button>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">Performance proof</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-accent p-3"><p className="font-mono text-lg font-bold">42k</p><p className="text-[10px] font-mono uppercase text-zinc-500">requests / sec</p></div>
            <div className="rounded-lg bg-accent p-3"><p className="font-mono text-lg font-bold">18.4ms</p><p className="text-[10px] font-mono uppercase text-zinc-500">p99 latency</p></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-zinc-400">Benchmark your implementation and turn completed projects into verified portfolio cards and GitHub badges.</p>
          <Link href="/dashboard/portfolio" className="mt-4 inline-block font-mono text-xs font-bold uppercase text-indigo-400 hover:text-indigo-300">View portfolio proof →</Link>
        </section>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {utilities.map(([icon, title, description, href]) => (
          <Link key={title} href={href} className="group rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-indigo-500/60">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/10 font-mono text-sm text-indigo-400">{icon}</span>
            <h2 className="mt-3 font-mono text-xs font-bold uppercase text-text group-hover:text-indigo-400">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
          </Link>
        ))}
      </section>

      <section id="tracks" className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">Explore tracks</p><h2 className="mt-1 text-2xl font-black uppercase black-ops-one-regular">Choose your next system</h2></div>
          <p className="text-xs text-zinc-500">Multi-language starters: TS · Python · Go · Rust · C++ · Java</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {tracks.map((track) => (
            <article key={track.name} className="rounded-lg border border-border bg-background p-4">
              <div className="flex gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border font-mono ${track.tone}`}>{track.icon}</span><div><h3 className="font-mono text-xs font-bold uppercase text-text">{track.name}</h3><p className="mt-1 text-xs leading-5 text-zinc-400">{track.projects}</p></div></div>
              <p className="mt-4 border-t border-border pt-3 text-[10px] font-mono uppercase tracking-wide text-zinc-500">Learn: {track.skills}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">Community & competition</p>
          <h2 className="mt-1 text-xl font-black uppercase black-ops-one-regular">Learn in public, your way</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-accent p-3"><div><p className="font-mono text-xs font-bold uppercase">Global & private leaderboards</p><p className="mt-1 text-xs text-zinc-500">Compare completion, performance, and language stats.</p></div><span className="font-mono text-indigo-400">#184</span></div>
            <div className="flex items-center justify-between rounded-lg bg-accent p-3"><div><p className="font-mono text-xs font-bold uppercase">Peer review checkpoint</p><p className="mt-1 text-xs text-zinc-500">Review architecture to unlock final certification.</p></div><span className="font-mono text-emerald-400">Optional</span></div>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">Build for others</p>
          <h2 className="mt-1 text-xl font-black uppercase black-ops-one-regular">Open ecosystem</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-background p-3"><p className="font-mono text-xs font-bold uppercase">Open challenge SDK</p><p className="mt-1 text-xs leading-5 text-zinc-500">Package Docker tests and starter repositories for any track.</p><button className="mt-3 font-mono text-[10px] font-bold uppercase text-indigo-400">Author a challenge →</button></div>
            <div className="rounded-lg border border-border bg-background p-3"><p className="font-mono text-xs font-bold uppercase">Teams & marketplace</p><p className="mt-1 text-xs leading-5 text-zinc-500">Publish paid challenges or create a private “Build Our Stack” onboarding track.</p><button className="mt-3 font-mono text-[10px] font-bold uppercase text-indigo-400">Explore creator tools →</button></div>
          </div>
        </section>
      </div>
    </div>
  );
}
