import Link from "next/link";

const tracks = [
  {
    icon: "✦",
    name: "AI & ML Engineering",
    color: "text-violet-400 bg-violet-500/10 border-violet-500/30",
    projects: [
      { title: "Build Your Own Vector Database", stages: 8, difficulty: "Advanced", desc: "Implement HNSW graph indexing, cosine similarity search, and persist embeddings to disk." },
      { title: "Local RAG Engine",               stages: 6, difficulty: "Intermediate", desc: "Chunk documents, embed with a local model, retrieve context, and generate grounded answers." },
      { title: "AI Agent Framework",             stages: 7, difficulty: "Advanced", desc: "Tool calling, memory, multi-step planning — build the scaffolding LLMs run inside." },
    ],
    skills: ["Embeddings", "HNSW indexing", "Chunking strategies", "Prompt orchestration", "Function calling"],
  },
  {
    icon: "◫",
    name: "Web & Frameworks",
    color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
    projects: [
      { title: "Build Your Own Virtual DOM",     stages: 6, difficulty: "Intermediate", desc: "Implement diffing, reconciliation, and keyed updates. Understand React's core from scratch." },
      { title: "Mini Next.js Router",            stages: 5, difficulty: "Intermediate", desc: "File-system routing, layouts, server vs. client components, streaming — from zero." },
      { title: "WebSocket Server",               stages: 6, difficulty: "Beginner", desc: "RFC 6455 handshake, frame parsing, heartbeat, pub/sub rooms — all without a library." },
    ],
    skills: ["Fiber architecture", "SSR / RSC", "Framing protocols", "Event loops", "Reconciliation"],
  },
  {
    icon: "▣",
    name: "DevOps & Infra",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    projects: [
      { title: "Build Your Own Docker",          stages: 8, difficulty: "Advanced", desc: "cgroups v2, Linux namespaces, overlay filesystems, and a minimal container runtime." },
      { title: "CI/CD Runner",                   stages: 6, difficulty: "Intermediate", desc: "Job queueing, isolated execution, artifact storage, and webhook-triggered pipelines." },
      { title: "Layer 7 Load Balancer",          stages: 7, difficulty: "Advanced", desc: "Reverse proxy, health checks, weighted round-robin, and connection draining." },
    ],
    skills: ["cgroups / namespaces", "Overlay FS", "Job orchestration", "Raw sockets", "Health checks"],
  },
  {
    icon: "⌘",
    name: "Fintech & Security",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    projects: [
      { title: "OAuth2 / OIDC Server",           stages: 7, difficulty: "Advanced", desc: "Authorization code flow, PKCE, JWT signing, token introspection, and refresh rotation." },
      { title: "Payment Queue",                  stages: 6, difficulty: "Intermediate", desc: "Idempotency keys, ledger entries, retry backoff, and exactly-once processing." },
      { title: "Blockchain Ledger",              stages: 8, difficulty: "Advanced", desc: "Proof-of-work, Merkle trees, chain validation, and a peer-to-peer gossip layer." },
    ],
    skills: ["JWTs", "Symmetric / asymmetric crypto", "Idempotency", "Ledger state", "Merkle trees"],
  },
] as const;

const DIFFICULTY_STYLE: Record<string, string> = {
  Beginner:     "bg-emerald-500/10 text-emerald-400",
  Intermediate: "bg-amber-500/10 text-amber-400",
  Advanced:     "bg-red-500/10 text-red-400",
};

export default function TracksPage() {
  return (
    <div className="w-full space-y-4 pb-10">
      {/* Header */}
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Project catalogue</p>
        <h1 className="mt-1 text-2xl font-black uppercase black-ops-one-regular">Build real systems.</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
          Every project is staged, Docker-tested, and supports TypeScript, Python, Go, Rust, C++, and Java starters. Clone locally, work in your IDE, push to advance.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-mono uppercase">
          {["TypeScript", "Python", "Go", "Rust", "C++", "Java"].map(lang => (
            <span key={lang} className="rounded-full border border-border bg-accent px-2.5 py-1 text-zinc-400">{lang}</span>
          ))}
        </div>
      </section>

      {/* Tracks */}
      {tracks.map((track) => (
        <section key={track.name} className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Track header */}
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border font-mono text-sm ${track.color}`}>
              {track.icon}
            </span>
            <div>
              <h2 className="font-mono text-sm font-bold uppercase">{track.name}</h2>
              <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                {track.skills.map(s => (
                  <span key={s} className="font-mono text-[9px] uppercase text-zinc-500">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Projects */}
          <div className="divide-y divide-border">
            {track.projects.map((project) => (
              <div key={project.title} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-accent/40 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-mono text-xs font-bold uppercase text-text">{project.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase ${DIFFICULTY_STYLE[project.difficulty]}`}>
                      {project.difficulty}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">{project.stages} stages</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{project.desc}</p>
                </div>
                <Link
                  href="/dashboard/learn"
                  className="shrink-0 rounded-lg border border-border bg-accent px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-zinc-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  Start →
                </Link>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
