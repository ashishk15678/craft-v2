import { LearnClient } from "./learn-client";

export default function LearningPage() {
  return (
    <div className="w-full space-y-4 pb-10">
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
          Your Journey
        </p>
        <h1 className="mt-1 text-2xl font-black uppercase black-ops-one-regular">
          My Learnings.
        </h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
          Tracks and courses you are currently enrolled in. Continue your
          progress and ace your upcoming exams.
        </p>
        {/*show all courses*/}
      </section>
      <LearnClient />
    </div>
  );
}
