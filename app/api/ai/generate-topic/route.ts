/**
 * POST /api/ai/generate-topic
 *
 * Generates a complete, structured learning topic from a subject string.
 * Persists the result as a Topic row and returns it.
 *
 * Free limit: MAX_FREE_TOPICS (default 3) AI topics per user across all orgs.
 * Paid users (Polar plan — future): limit removed.
 */

import { NextResponse, type NextRequest } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";
import { getStudentSession } from "@/lib/student-session";
import { prisma } from "@/lib/db";

const MAX_FREE = Number(process.env.MAX_FREE_TOPICS ?? 3);

// ─── Output schema (what we expect Groq to return as JSON) ───────────────────

export const TopicContentSchema = z.object({
  title: z.string(),
  overview: z.string(), // 2-3 sentence plain-language summary
  sections: z.array(
    z.object({
      id: z.string(),
      heading: z.string(),
      body: z.string(), // markdown-formatted explanation
      keyPoints: z.array(z.string()),
      codeExample: z
        .object({ language: z.string(), code: z.string(), caption: z.string() })
        .optional(),
    }),
  ),
  conceptMap: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(["core", "supporting", "example", "pitfall"]),
        description: z.string(),
      }),
    ),
    edges: z.array(
      z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
        label: z.string(),
      }),
    ),
  }),
  notes: z.string(), // markdown — key takeaways, quick-reference, gotchas
  visualizations: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["timeline", "comparison_table", "steps", "pros_cons"]),
      title: z.string(),
      data: z.unknown(), // type-specific payload
    }),
  ),
  quiz: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      explanation: z.string(),
    }),
  ),
  furtherReading: z.array(z.object({ title: z.string(), description: z.string() })),
});

export type TopicContent = z.infer<typeof TopicContentSchema>;

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(subject: string): string {
  return `You are an expert technical educator. Generate a comprehensive, pedagogically sound learning module on the following subject:

**Subject:** ${subject}

Return ONLY a valid JSON object — no markdown fences, no explanation, nothing else — matching this exact schema:

{
  "title": "Precise, engaging title for the topic",
  "overview": "2-3 sentences. Plain language. What this is and why it matters.",
  "sections": [
    {
      "id": "s1",
      "heading": "Section heading",
      "body": "Detailed markdown explanation. Use bullet lists, bold key terms, and inline code where appropriate. Minimum 3 paragraphs.",
      "keyPoints": ["3-5 short bullet-point takeaways"],
      "codeExample": {
        "language": "typescript",
        "code": "// Minimal, self-contained, runnable example",
        "caption": "What this example demonstrates"
      }
    }
  ],
  "conceptMap": {
    "nodes": [
      {
        "id": "n1",
        "label": "Short node label (2-4 words)",
        "type": "core | supporting | example | pitfall",
        "description": "One sentence describing this concept."
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2",
        "label": "relationship verb (e.g. 'enables', 'requires', 'leads to')"
      }
    ]
  },
  "notes": "# Quick Reference\\n\\nMarkdown cheat-sheet. Include gotchas, common mistakes, best practices. Structured with ## subheadings.",
  "visualizations": [
    {
      "id": "v1",
      "type": "comparison_table | timeline | steps | pros_cons",
      "title": "Visualization title",
      "data": {}
    }
  ],
  "quiz": [
    {
      "id": "q1",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct and others are not."
    }
  ],
  "furtherReading": [
    {
      "title": "Resource title",
      "description": "One sentence on what you'll learn from it."
    }
  ]
}

Requirements:
- Include 4-6 sections covering fundamentals → advanced usage → common pitfalls
- The concept map must have 8-14 nodes and meaningful edges showing relationships
- Include at least 5 quiz questions
- Include at least 2 visualizations
- All code examples must be correct and use modern syntax
- Notes must include a "Common Mistakes" section
- Do NOT include any text outside the JSON object`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Auth
  const session = await getStudentSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Parse body
  let body: { subject: string; organizationId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const subject = (body.subject ?? "").trim().slice(0, 200);
  const organizationId = (body.organizationId ?? "").trim();

  if (!subject) {
    return NextResponse.json({ error: "subject is required" }, { status: 400 });
  }
  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  // Verify org membership
  const member = await prisma.organizationMember.findFirst({
    where: { organizationId, userId },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
  }

  // Enforce free limit
  const aiCount = await prisma.topic.count({
    where: { creatorId: userId, aiGenerated: true },
  });
  if (aiCount >= MAX_FREE) {
    return NextResponse.json(
      {
        error: `Free plan limit reached (${MAX_FREE} AI topics). Upgrade to generate more.`,
        code: "FREE_LIMIT_REACHED",
        used: aiCount,
        max: MAX_FREE,
      },
      { status: 402 },
    );
  }

  // Groq generation
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  const groq = new Groq({ apiKey });

  let rawContent: string;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: buildPrompt(subject) }],
      temperature: 0.4,
      max_tokens: 8192,
      response_format: { type: "json_object" },
    });
    rawContent = completion.choices[0]?.message?.content ?? "";
  } catch (err) {
    console.error("[groq] generation failed:", err);
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 502 },
    );
  }

  // Parse + validate
  let parsed: TopicContent;
  try {
    const json = JSON.parse(rawContent);
    parsed = TopicContentSchema.parse(json);
  } catch (err) {
    console.error("[groq] invalid output schema:", err);
    return NextResponse.json(
      { error: "AI returned an unexpected format. Please try again." },
      { status: 502 },
    );
  }

  // Persist
  const topic = await prisma.topic.create({
    data: {
      organizationId,
      creatorId: userId,
      title: parsed.title,
      subject,
      aiGenerated: true,
      content: JSON.stringify(parsed),
    },
    include: { organization: { select: { name: true, slug: true } } },
  });

  return NextResponse.json({ topic }, { status: 201 });
}
