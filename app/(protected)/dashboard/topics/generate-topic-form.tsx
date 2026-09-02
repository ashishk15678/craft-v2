"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";

interface Props {
  orgOptions: string[];
  remaining: number;
  max: number;
}

const SUGGESTIONS = [
  "React Server Components",
  "Distributed systems consensus",
  "Transformer neural networks",
  "PostgreSQL query planning",
  "OAuth 2.0 and PKCE",
  "Rust ownership model",
  "CSS Grid layout",
  "Binary search trees",
];

export function GenerateTopicForm({ orgOptions, remaining, max }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [orgId, setOrgId] = useState<string>(orgOptions[0] ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<
    "idle" | "sending" | "generating" | "saving"
  >("idle");

  const disabled = remaining === 0 || loading || !subject.trim() || !orgId;

  const phaseLabel: Record<typeof phase, string> = {
    idle: `Generate topic (${remaining}/${max} free remaining)`,
    sending: "Sending to AI…",
    generating: "Generating your learning module…",
    saving: "Saving…",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setError("");
    setLoading(true);
    setPhase("sending");

    try {
      setPhase("generating");

      const res = await fetch("/api/ai/generate-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), organizationId: orgId }),
      });

      setPhase("saving");
      const data = await res.json() as {
        topic?: { id: string };
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        if (data.code === "FREE_LIMIT_REACHED") {
          setError(`You've used all ${max} free AI topics. Upgrade for unlimited access.`);
        } else {
          setError(data.error ?? "Generation failed. Please try again.");
        }
        return;
      }

      if (data.topic?.id) {
        router.push(`/dashboard/topics/${data.topic.id}`);
        router.refresh();
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
      setPhase("idle");
    }
  }

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-indigo-400" aria-hidden />
        <h2 className="font-bold text-sm">Generate a new topic</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="topic-subject" className="text-sm font-medium">
            What do you want to learn about?
          </label>
          <input
            id="topic-subject"
            type="text"
            required
            maxLength={200}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. React Server Components, B-trees, OAuth 2.0…"
            disabled={loading || remaining === 0}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-indigo-500 disabled:opacity-60 transition-colors"
          />
          {/* Suggestions */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSubject(s)}
                disabled={loading || remaining === 0}
                className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-muted-foreground hover:border-indigo-500/50 hover:text-indigo-400 disabled:opacity-40 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {orgOptions.length > 1 && (
          <div className="space-y-1.5">
            <label htmlFor="topic-org" className="text-sm font-medium">
              Save to organization
            </label>
            <select
              id="topic-org"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
            >
              {orgOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {phaseLabel[phase]}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden />
              {phaseLabel.idle}
            </>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-muted-foreground animate-pulse">
            This usually takes 10–20 seconds. Don&apos;t close the page.
          </p>
        )}
      </form>
    </div>
  );
}
