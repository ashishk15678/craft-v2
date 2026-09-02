"use client";

import type { TopicContent } from "@/app/api/ai/generate-topic/route";

type Viz = TopicContent["visualizations"][number];

function StepsViz({ data }: { data: unknown }) {
  const steps = (data as { steps?: string[] })?.steps ?? [];
  return (
    <div className="space-y-3">
      {steps.map((step: string, i: number) => (
        <div key={i} className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-400 ring-1 ring-indigo-500/20">
            {i + 1}
          </span>
          <div className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm">{step}</div>
          {i < steps.length - 1 && (
            <div className="absolute left-3.5 mt-7 h-3 w-px bg-border" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}

function ComparisonTable({ data }: { data: unknown }) {
  const d = data as {
    headers?: string[];
    rows?: string[][];
  };
  if (!d?.headers || !d?.rows) return <p className="text-xs text-muted-foreground">No data.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-accent">
            {d.headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left text-xs font-bold uppercase text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {d.rows.map((row, ri) => (
            <tr key={ri} className="border-b border-border last:border-0 hover:bg-accent/50">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProsConsViz({ data }: { data: unknown }) {
  const d = data as { pros?: string[]; cons?: string[] };
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="mb-3 text-xs font-bold uppercase text-emerald-400">Pros</p>
        <ul className="space-y-2">
          {(d?.pros ?? []).map((p: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1 text-emerald-400">+</span>
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
        <p className="mb-3 text-xs font-bold uppercase text-red-400">Cons</p>
        <ul className="space-y-2">
          {(d?.cons ?? []).map((c: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1 text-red-400">−</span>
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TimelineViz({ data }: { data: unknown }) {
  const events = (data as { events?: { label: string; description: string }[] })?.events ?? [];
  return (
    <div className="relative pl-8 space-y-4">
      <div className="absolute left-3 top-2 bottom-2 w-px bg-border" aria-hidden />
      {events.map((ev, i) => (
        <div key={i} className="relative">
          <div className="absolute -left-[1.25rem] top-1 h-3 w-3 rounded-full border-2 border-indigo-500 bg-background" aria-hidden />
          <p className="font-semibold text-sm">{ev.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>
        </div>
      ))}
    </div>
  );
}

function VizCard({ viz }: { viz: Viz }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <p className="font-bold text-sm">{viz.title}</p>
      {viz.type === "steps"            && <StepsViz data={viz.data} />}
      {viz.type === "comparison_table" && <ComparisonTable data={viz.data} />}
      {viz.type === "pros_cons"        && <ProsConsViz data={viz.data} />}
      {viz.type === "timeline"         && <TimelineViz data={viz.data} />}
    </div>
  );
}

export function TopicVisualizations({
  visualizations,
}: {
  visualizations: TopicContent["visualizations"];
}) {
  if (!visualizations.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No visualizations generated for this topic.
      </p>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {visualizations.map((v) => (
        <VizCard key={v.id} viz={v} />
      ))}
    </div>
  );
}
