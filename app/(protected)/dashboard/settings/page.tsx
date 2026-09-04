import { getStudentSession } from "@/lib/student-session";

export default async function SettingsPage() {
  const session = await getStudentSession();
  return (
    <section className="max-w-2xl rounded-xl border border-border bg-card p-5 sm:p-6">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">
        Student settings
      </p>
      <h1 className="mt-1 text-2xl font-black uppercase black-ops-one-regular">
        Your workspace.
      </h1>
      <div className="mt-5 space-y-3">
        <div className="rounded-lg bg-accent p-4">
          <p className="text-[10px] font-mono uppercase text-zinc-500">
            Signed in as
          </p>
          <p className="mt-1 font-mono text-sm font-bold">
            {session?.user.email}
          </p>
        </div>
        <div className="rounded-lg bg-accent p-4">
          <p className="text-[10px] font-mono uppercase text-zinc-500">
            Learning preferences
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Your selected language and active challenge are stored with your
            learning progress.
          </p>
        </div>
        <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4">
          <p className="font-mono text-xs font-bold uppercase text-indigo-400">
            Need to end your session?
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Use the Log out control in the sidebar. It securely clears your
            Better Auth session.
          </p>
        </div>
      </div>
    </section>
  );
}
