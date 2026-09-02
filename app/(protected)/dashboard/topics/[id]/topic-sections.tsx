"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Code2 } from "lucide-react";
import type { TopicContent } from "@/app/api/ai/generate-topic/route";

type Section = TopicContent["sections"][number];

function MarkdownBody({ text }: { text: string }) {
  // Minimal markdown: bold, inline code, line breaks, bullet lists
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
      {lines.map((line, i) => {
        const isBullet = /^\s*[-*•]\s/.test(line);
        const cleaned = line.replace(/^\s*[-*•]\s/, "");
        const rendered = cleaned
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/`([^`]+)`/g, "<code class=\"rounded bg-accent px-1 py-0.5 font-mono text-xs text-foreground\">$1</code>");
        return isBullet ? (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
            <span dangerouslySetInnerHTML={{ __html: rendered }} />
          </div>
        ) : (
          <p key={i} dangerouslySetInnerHTML={{ __html: rendered }} />
        );
      })}
    </div>
  );
}

function SectionCard({ section }: { section: Section }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-accent/50 transition-colors"
        aria-expanded={open}
      >
        {open
          ? <ChevronDown className="h-4 w-4 shrink-0 text-indigo-400" aria-hidden />
          : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        }
        <span className="font-bold">{section.heading}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border">
          {/* Body */}
          <div className="pt-4">
            <MarkdownBody text={section.body} />
          </div>

          {/* Key points */}
          {section.keyPoints.length > 0 && (
            <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/20 p-4">
              <p className="text-xs font-bold uppercase text-indigo-400 mb-2">Key points</p>
              <ul className="space-y-1.5">
                {section.keyPoints.map((kp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
                    <span>{kp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Code example */}
          {section.codeExample && (
            <div className="rounded-lg overflow-hidden border border-border">
              <div className="flex items-center gap-2 border-b border-border bg-accent px-4 py-2">
                <Code2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                <span className="text-xs font-mono text-muted-foreground">
                  {section.codeExample.language}
                </span>
                {section.codeExample.caption && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {section.codeExample.caption}
                  </span>
                )}
              </div>
              <pre className="overflow-x-auto bg-card px-4 py-4 text-xs font-mono text-foreground leading-relaxed">
                <code>{section.codeExample.code}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TopicSections({ sections }: { sections: TopicContent["sections"] }) {
  return (
    <div className="space-y-3">
      {sections.map((s) => (
        <SectionCard key={s.id} section={s} />
      ))}
    </div>
  );
}
