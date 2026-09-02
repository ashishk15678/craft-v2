"use client";

import { useState } from "react";
import { Map, BookOpen, StickyNote, HelpCircle, BarChart2 } from "lucide-react";
import type { TopicContent } from "@/app/api/ai/generate-topic/route";
import { ConceptMapViewer } from "./concept-map";
import { TopicSections } from "./topic-sections";
import { TopicNotes } from "./topic-notes";
import { TopicQuiz } from "./topic-quiz";
import { TopicVisualizations } from "./topic-visualizations";

const TABS = [
  { id: "sections",  label: "Learn",        icon: BookOpen },
  { id: "map",       label: "Concept map",  icon: Map },
  { id: "notes",     label: "Notes",        icon: StickyNote },
  { id: "visuals",   label: "Visualizations", icon: BarChart2 },
  { id: "quiz",      label: "Quiz",         icon: HelpCircle },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function TopicTabs({ content }: { content: TopicContent }) {
  const [active, setActive] = useState<TabId>("sections");

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-px">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active === id
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
            {id === "quiz" && content.quiz.length > 0 && (
              <span className="ml-1 rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-400">
                {content.quiz.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {active === "sections"  && <TopicSections sections={content.sections} />}
      {active === "map"       && <ConceptMapViewer nodes={content.conceptMap.nodes} edges={content.conceptMap.edges} />}
      {active === "notes"     && <TopicNotes notes={content.notes} />}
      {active === "visuals"   && <TopicVisualizations visualizations={content.visualizations} />}
      {active === "quiz"      && <TopicQuiz questions={content.quiz} />}
    </div>
  );
}
