import { TracksClient } from "./tracks-client";

export default function TracksPage() {
  return (
    <div className="w-full space-y-4 pb-10">
      {/* Header */}
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
          Project catalogue
        </p>
        <h1 className="mt-1 text-2xl font-black uppercase black-ops-one-regular">
          Explore Tracks.
        </h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
          Discover comprehensive learning paths containing puzzles, aptitude,
          MCQs, and coding questions asked by top mass hiring companies like
          Accenture and TCS. Build real skills to ace your exams.
        </p>
      </section>

      <TracksClient />
    </div>
  );
}
