import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Sparkles } from "lucide-react";
import { getStudentSession } from "@/lib/student-session";
import { prisma } from "@/lib/db";
import { type TopicContent } from "@/app/api/ai/generate-topic/route";
import { ConceptMapViewer } from "./concept-map";
import { TopicSections } from "./topic-sections";
import { TopicNotes } from "./topic-notes";
import { TopicQuiz } from "./topic-quiz";
import { TopicVisualizations } from "./topic-visualizations";
import { DeleteTopicButton } from "./delete-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const topic = await prisma.topic.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: topic?.title ?? "Topic" };
}

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getStudentSession();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const topic = await prisma.topic.findUnique({
    where: { id },
    include: { organization: { select: { name: true, slug: true } } },
  });

  if (!topic || topic.creatorId !== session.user.id) notFound();

  let content: TopicContent | null = null;
  try {
    content = JSON.parse(topic.content) as TopicContent;
  } catch {
    // malformed content — show error below
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Back + meta */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/topics"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ChevronLeft className="h-3 w-3" aria-hidden />
            All topics
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight">{topic.title}</h1>
            {topic.aiGenerated && (
              <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 ring-1 ring-indigo-500/20">
                <Sparkles className="h-3 w-3" aria-hidden />
                AI generated
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {topic.organization.name} · Generated{" "}
            {new Date(topic.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <DeleteTopicButton topicId={topic.id} />
      </div>

      {!content ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive font-medium">
            Topic content is malformed and can&apos;t be displayed.
          </p>
        </div>
      ) : (
        <>
          {/* Overview */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {content.overview}
            </p>
          </div>

          {/* Tabbed content */}
          <TopicTabs content={content} />
        </>
      )}
    </div>
  );
}

// ─── Tab wrapper (server component, tabs are client) ─────────────────────────

import { TopicTabs } from "./topic-tabs";
