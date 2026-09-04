"use client";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AssessmentAttemptPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, refetch } = trpc.assessment.attempt.useQuery({ id });
  const submit = trpc.assessment.submit.useMutation({
    onSuccess: () => refetch(),
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [seconds, setSeconds] = useState<number | null>(null);
  useEffect(() => {
    if (!data || data.submittedAt) return;
    const deadline = Date.now() + data.remainingSec * 1000;
    const timer = window.setInterval(
      () => setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [data?.id, data?.remainingSec, data?.submittedAt]);
  if (isLoading || !data)
    return (
      <div className="font-mono text-sm text-zinc-500">Opening test...</div>
    );
  const done = !!data.submittedAt;
  const remaining = seconds ?? data.remainingSec;
  const expired = !done && remaining <= 0;
  const time = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-10">
      <header className="sticky top-10 z-20 flex items-center justify-between rounded-xl border border-border bg-card/95 p-4 backdrop-blur">
        <div>
          <p className="font-mono text-[10px] uppercase text-indigo-400">
            Timed assessment
          </p>
          <h1 className="font-bold">{data.assessment.title}</h1>
        </div>
        <span
          className={`font-mono text-lg font-bold ${seconds !== null && seconds < 60 ? "text-red-400" : "text-indigo-400"}`}
        >
          {done ? `${data.score}%` : time}
        </span>
      </header>
      {data.questions.map((question, index) => (
        <section
          key={question.id}
          className="rounded-xl border border-border bg-card p-5"
        >
          <p className="font-mono text-[10px] uppercase text-indigo-400">
            {String(index + 1).padStart(2, "0")} · {question.company} ·{" "}
            {question.category}
          </p>
          <h2 className="mt-3 text-lg font-bold">{question.prompt}</h2>
          {question.interaction.type === "choice" ? (
            <div className="mt-5 grid gap-2">
              {question.interaction.options?.map((option) => (
                <button
                  disabled={done || expired}
                  key={option.id}
                  onClick={() =>
                    setAnswers((old) => ({ ...old, [question.id]: option.id }))
                  }
                  className={`rounded-lg border p-3 text-left text-sm ${answers[question.id] === option.id ? "border-indigo-500 bg-indigo-500/10" : "border-border bg-background"}`}
                >
                  <b className="mr-3 text-indigo-400">{option.id}</b>
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <input
              disabled={done || expired}
              value={answers[question.id] ?? ""}
              onChange={(event) =>
                setAnswers((old) => ({
                  ...old,
                  [question.id]: event.target.value,
                }))
              }
              className="mt-5 w-full rounded-lg border border-border bg-background p-3 font-mono text-sm"
              placeholder={question.interaction.placeholder ?? "Your answer"}
            />
          )}{" "}
          {done && (
            <p className="mt-5 rounded-lg bg-emerald-500/5 p-3 text-sm leading-6 text-zinc-300">
              <b className="text-emerald-400">Review:</b> {question.solution}
            </p>
          )}
        </section>
      ))}
      {!done ? (
        <button
          onClick={() => submit.mutate({ id, answers })}
          disabled={submit.isPending || expired}
          className="w-full rounded-lg bg-indigo-600 py-3 font-mono text-xs font-bold uppercase text-white"
        >
          {submit.isPending ? "Submitting..." : "Submit assessment"}
        </button>
      ) : (
        <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <p className="font-mono text-xs font-bold uppercase text-emerald-400">
            Assessment complete · +
            {Math.round((data.assessment.rewardXp * (data.score ?? 0)) / 100)}{" "}
            XP
          </p>
          <Link
            href="/dashboard/profile"
            className="mt-3 inline-block font-mono text-xs font-bold uppercase text-indigo-400"
          >
            View rewards →
          </Link>
        </section>
      )}
    </div>
  );
}
