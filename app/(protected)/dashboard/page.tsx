import Link from "next/link";
import { getStudentSession } from "@/lib/student-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { OrgAwareRoleGateway, OrgDashboardSection } from "@/components/org-dashboard-sections";

const stageNames = ["PING", "GET / SET", "Persistence", "Indexes", "Query planner", "Benchmarks"];

const TRACKS = [
  { icon: "✦", name: "AI & ML Engineering", tagline: "Vector DB · RAG Engine · Agent Framework", color: "text-violet-400 bg-violet-500/10 border-violet-500/30" },
  { icon: "◫", name: "Web & Frameworks",    tagline: "Virtual DOM · Next.js Router · WS Server",  color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  { icon: "▣", name: "DevOps & Infra",      tagline: "Mini Docker · CI Runner · Load Balancer",    color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { icon: "⌘", name: "Fintech & Security",  tagline: "OAuth2 · Payment Queue · Blockchain",        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
];

export default async function DashboardPage() {
  const session = await getStudentSession();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const [progress, enrollment, benchmark] = await Promise.all([
    prisma.studentProgress.findUnique({ where: { userId } }),
    prisma.enrollment.findFirst({
      where: { userId },
      include: { challenge: { select: { title: true, track: true } } },
      orderBy: { currentStage: "desc" },
    }),
    prisma.benchmark.findFirst({
      where: { enrollment: { userId } },
      orderBy: { verifiedAt: "desc" },
    }),
  ]);

  const activeChallenge = progress?.activeChallenge ?? enrollment?.challenge.title ?? "Build Your Own KV Store";
  const activeTrack     = enrollment?.challenge.track ?? "DevOps & Infra";
  const currentStage    = progress?.currentStage ?? enrollment?.currentStage ?? 4;
  const totalStages     = progress?.totalStages ?? 6;
  const language        = progress?.language ?? enrollment?.language ?? "TypeScript";
  const hintsUsed       = progress?.hintsUsed ?? 0;
  const rps             = benchmark ? `${(benchmark.requestsPerSecond / 1000).toFixed(0)}k` : "—";
  const p99             = benchmark ? `${benchmark.p99LatencyMs}ms` : "—";
  const trackPct        = Math.round(((currentStage - 1) / totalStages) * 100);
  const stageName       = stageNames[currentStage - 1] ?? "Active";

  return (
    <div className="w-full space-y-4 pb-10">

      {/* ── Top strip: active challenge + stats ── */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-5 pb-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Active quest</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-black uppercase tracking-tight black-ops-one-regular truncate">{activeChallenge}</h1>
              <p className="mt-1 text-xs text-zinc-400">{language} · {activeTrack} · Stage {currentStage}/{totalStages} — <span className="text-indigo-400">{stageName}</span></p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href="/dashboard/learn"
                className="rounded-lg bg-indigo-600 px-4 py-2 font-mono text-xs font-bold uppercase text-white hover:bg-indigo-500 transition-colors"
              >
                Resume →
              </Link>
              <Link
                href="/dashboard/tracks"
                className="rounded-lg border border-border bg-accent px-4 py-2 font-mono text-xs font-bold uppercase text-zinc-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
              >
                Browse
              </Link>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 flex items-center gap-1" aria-label={`Stage ${currentStage} of ${totalStages}`}>
            {Array.from({ length: totalStages }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < currentStage - 1
                    ? "bg-indigo-500"
                    : i === currentStage - 1
                    ? "bg-indigo-500/40"
                    : "bg-accent"
                }`}
              />
            ))}
          </div>
          <div className="mt-1.5 flex gap-4 text-[10px] font-mono uppercase text-zinc-600">
            <span>{trackPct}% complete</span>
            <span>{hintsUsed} hint{hintsUsed !== 1 ? "s" : ""} used</span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 border-t border-border divide-x divide-border">
          {[
            [`Stage ${currentStage}`, "current"],
            [language,               "language"],
            [rps,                    "req / sec"],
            [p99,                    "p99 latency"],
          ].map(([value, label]) => (
            <div key={label} className="px-4 py-3">
              <p className="font-mono text-base font-bold text-text truncate">{value}</p>
              <p className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Role workspaces (admin / teacher / org-owner) ── */}
      <OrgAwareRoleGateway />

      {/* ── Middle row: tools + tracks ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">

        {/* Quick tools */}
        <section className="rounded-xl border border-border bg-card p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400 mb-3">Tools</p>
          <div className="space-y-1">
            {([
              ["/dashboard/assistant", "⌁", "AI Debugging Companion",   "Paste your error, get a targeted hint."],
              ["/dashboard/learn",     "?", "Stage Hints",              "Architecture nudges — no spoilers."],
              ["/dashboard/portfolio", "◌", "Portfolio Proof",          "Verified project cards + GitHub badges."],
              ["/dashboard/community", "↗", "Community",                "Discuss, review, and learn with others."],
            ] as const).map(([href, icon, title, desc]) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 font-mono text-sm text-indigo-400 group-hover:bg-indigo-500/20">
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold uppercase text-text group-hover:text-indigo-400 transition-colors">{title}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{desc}</p>
                </div>
                <span className="ml-auto font-mono text-[10px] text-zinc-600 group-hover:text-indigo-400">→</span>
              </Link>
            ))}
          </div>

          {/* Performance quick view */}
          {benchmark && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400 mb-2">Latest benchmark</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-accent px-3 py-2">
                  <p className="font-mono text-sm font-bold">{rps}</p>
                  <p className="text-[10px] font-mono uppercase text-zinc-500">req / sec</p>
                </div>
                <div className="rounded-lg bg-accent px-3 py-2">
                  <p className="font-mono text-sm font-bold">{p99}</p>
                  <p className="text-[10px] font-mono uppercase text-zinc-500">p99 latency</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Tracks */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">Tracks</p>
            <Link href="/dashboard/tracks" className="font-mono text-[10px] uppercase text-zinc-500 hover:text-indigo-400 transition-colors">
              All tracks →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TRACKS.map((t) => (
              <Link
                key={t.name}
                href="/dashboard/tracks"
                className="group rounded-lg border border-border bg-background p-3 hover:border-indigo-500/50 transition-colors"
              >
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md border font-mono text-sm ${t.color}`}>
                  {t.icon}
                </span>
                <p className="mt-2 font-mono text-[10px] font-bold uppercase text-text group-hover:text-indigo-400 transition-colors leading-tight">
                  {t.name}
                </p>
                <p className="mt-1 text-[10px] text-zinc-500 leading-tight">{t.tagline}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* ── Org memberships (only for ORG_OWNER / ORG_ADMIN – hidden for LEARNER / INSTRUCTOR / plain STUDENT) ── */}
      <OrgDashboardSection />

    </div>
  );
}
