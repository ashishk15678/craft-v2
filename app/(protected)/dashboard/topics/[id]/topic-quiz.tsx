"use client";

import { useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import type { TopicContent } from "@/app/api/ai/generate-topic/route";

type Question = TopicContent["quiz"][number];

export function TopicQuiz({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [submitted, setSubmitted] = useState(false);

  function select(qId: string, idx: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: idx }));
  }

  function submit() {
    if (Object.keys(answers).length < questions.length) return;
    setSubmitted(true);
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
  }

  const score = submitted
    ? questions.filter((q) => answers[q.id] === q.correctIndex).length
    : 0;

  const pct = submitted ? Math.round((score / questions.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Score banner */}
      {submitted && (
        <div
          className={`rounded-xl border p-4 flex items-center justify-between ${
            pct === 100
              ? "border-emerald-500/40 bg-emerald-500/10"
              : pct >= 60
                ? "border-amber-500/40 bg-amber-500/10"
                : "border-red-500/40 bg-red-500/10"
          }`}
        >
          <div>
            <p className="font-bold text-sm">
              {score}/{questions.length} correct — {pct}%{pct === 100 && " 🎉"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pct === 100
                ? "Perfect score!"
                : pct >= 60
                  ? "Good effort. Review the explanations below."
                  : "Keep studying and try again."}
            </p>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Retake
          </button>
        </div>
      )}

      {/* Questions */}
      {questions.map((q, qi) => {
        const chosen = answers[q.id] ?? null;
        const isCorrect = submitted && chosen === q.correctIndex;
        const isWrong =
          submitted && chosen !== null && chosen !== q.correctIndex;

        return (
          <div
            key={q.id}
            className={`rounded-xl border bg-card p-5 space-y-3 ${
              submitted
                ? isCorrect
                  ? "border-emerald-500/40"
                  : isWrong
                    ? "border-red-500/40"
                    : "border-border opacity-70"
                : "border-border"
            }`}
          >
            <p className="font-semibold text-sm">
              <span className="text-muted-foreground mr-2">{qi + 1}.</span>
              {q.question}
            </p>

            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const isSelected = chosen === oi;
                const isAnswer = submitted && oi === q.correctIndex;
                const isBad = submitted && isSelected && oi !== q.correctIndex;

                return (
                  <button
                    key={oi}
                    onClick={() => select(q.id, oi)}
                    disabled={submitted}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-sm text-left transition-colors ${
                      isBad
                        ? "border-red-500/60 bg-red-500/10 text-red-400"
                        : isAnswer
                          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                          : isSelected
                            ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-400"
                            : "border-border hover:border-indigo-500/40 hover:bg-accent/50"
                    } disabled:cursor-default`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                        isBad
                          ? "border-red-500 text-red-400"
                          : isAnswer
                            ? "border-emerald-500 text-emerald-400"
                            : isSelected
                              ? "border-indigo-500 text-indigo-400"
                              : "border-border text-muted-foreground"
                      }`}
                    >
                      {isBad ? (
                        <X className="h-3 w-3" aria-hidden />
                      ) : isAnswer ? (
                        <Check className="h-3 w-3" aria-hidden />
                      ) : (
                        String.fromCharCode(65 + oi)
                      )}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {submitted && (
              <div className="rounded-lg bg-accent px-4 py-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Explanation:{" "}
                </span>
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {/* Submit */}
      {!submitted && (
        <button
          onClick={submit}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all"
        >
          Submit answers ({Object.keys(answers).length}/{questions.length}{" "}
          answered)
        </button>
      )}
    </div>
  );
}
