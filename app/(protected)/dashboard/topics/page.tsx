import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, BookOpen, ChevronRight, Zap } from "lucide-react";
import { getStudentSession } from "@/lib/student-session";
import { prisma } from "@/lib/db";
import { GenerateTopicForm } from "./generate-topic-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const MAX_FREE = Number(process.env.MAX_FREE_TOPICS ?? 3);

export const metadata = { title: "AI Topics" };

export default async function TopicsPage() {
  const session = await getStudentSession();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const orgs = await auth.api.listOrganizations({ headers: await headers() });
  const aiCount = await prisma.topic.count({
    where: { creatorId: userId, aiGenerated: true },
  });
  const remaining = Math.max(0, MAX_FREE - aiCount);
  const orgOptions = orgs.map((m) => m.id);
  const topics = await prisma.topic.findMany({ where: { creatorId: userId } });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-400" aria-hidden />
          AI Topics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell the AI a subject. It generates a complete learning module with
          notes, a concept map, visualizations, and a quiz — all in seconds.
        </p>
      </div>

      {/* Usage meter */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Zap className="h-4 w-4 text-amber-400" />
            Free plan
          </div>
          <span className="text-sm text-muted-foreground">
            {aiCount} / {MAX_FREE} used
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${Math.min(100, (aiCount / MAX_FREE) * 100)}%` }}
            role="progressbar"
            aria-valuenow={aiCount}
            aria-valuemin={0}
            aria-valuemax={MAX_FREE}
          />
        </div>
        {remaining === 0 ? (
          <p className="mt-2 text-xs text-amber-500 font-medium">
            You&apos;ve used all {MAX_FREE} free topics. Upgrade for unlimited
            AI generation.
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            {remaining} free generation{remaining !== 1 ? "s" : ""} remaining.
          </p>
        )}
      </div>

      {/* Generate form */}
      {orgOptions.length > 0 ? (
        <GenerateTopicForm
          orgOptions={orgOptions}
          remaining={remaining}
          max={MAX_FREE}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <BookOpen
            className="mx-auto mb-3 h-7 w-7 text-muted-foreground/40"
            aria-hidden
          />
          <p className="text-sm font-medium">Join an organization first</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Topics are created inside organizations. Join or create one to get
            started.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Go to dashboard
          </Link>
        </div>
      )}

      {/* Existing topics */}
      {topics.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-bold">Your topics</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/topics/${t.id}`}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-indigo-500/50 transition-colors"
              >
                {/* AI badge */}
                {t.aiGenerated && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-400 ring-1 ring-indigo-500/20">
                    <Sparkles className="h-2.5 w-2.5" aria-hidden />
                    AI
                  </span>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1 pr-10">
                    {t.title}
                  </p>
                  <p className="font-bold text-sm group-hover:text-indigo-400 transition-colors pr-10 line-clamp-2">
                    {t.title}
                  </p>
                  {t.subject !== t.title && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                      {t.subject}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {new Date(t.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <ChevronRight
                    className="h-3.5 w-3.5 group-hover:text-indigo-400 transition-colors"
                    aria-hidden
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
