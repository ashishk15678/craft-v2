"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function TopicNotes({ notes }: { notes: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Very minimal markdown renderer for notes
  const lines = notes.split("\n");
  const rendered: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{1,2}\s/.test(line)) {
      const level = line.startsWith("##") ? 2 : 1;
      const text = line.replace(/^#{1,2}\s/, "");
      rendered.push(
        level === 1 ? (
          <h2
            key={i}
            className="mt-5 mb-2 text-base font-black text-foreground"
          >
            {text}
          </h2>
        ) : (
          <h3 key={i} className="mt-4 mb-1.5 text-sm font-bold text-foreground">
            {text}
          </h3>
        ),
      );
    } else if (/^[-*]\s/.test(line)) {
      rendered.push(
        <div
          key={i}
          className="flex items-start gap-2 text-sm text-muted-foreground"
        >
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400"
            aria-hidden
          />
          <span
            dangerouslySetInnerHTML={{
              __html: line
                .replace(/^[-*]\s/, "")
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(
                  /`([^`]+)`/g,
                  "<code class='rounded bg-accent px-1 py-0.5 font-mono text-xs text-foreground'>$1</code>",
                ),
            }}
          />
        </div>,
      );
    } else if (line.trim() === "") {
      rendered.push(<div key={i} className="h-2" aria-hidden />);
    } else {
      rendered.push(
        <p
          key={i}
          className="text-sm text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: line
              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
              .replace(
                /`([^`]+)`/g,
                "<code class='rounded bg-accent px-1 py-0.5 font-mono text-xs text-foreground'>$1</code>",
              ),
          }}
        />,
      );
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <p className="text-sm font-bold">Quick reference notes</p>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Copy notes as markdown"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden />{" "}
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden /> Copy markdown
            </>
          )}
        </button>
      </div>
      <div className="px-5 py-4 space-y-1">{rendered}</div>
    </div>
  );
}
