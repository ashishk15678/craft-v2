import Database from "better-sqlite3";

const databaseUrl = process.env.DATABASE_URL ?? "file:./file.db";
const databasePath = databaseUrl.startsWith("file:")
  ? databaseUrl.slice(5)
  : databaseUrl;
const db = new Database(databasePath);
const now = new Date().toISOString();

const challenges = [
  {
    id: "practice-accenture-priority-queue",
    slug: "accenture-priority-queue",
    company: "Accenture-style",
    category: "Logic",
    difficulty: "Easy",
    title: "Priority Queue Recovery",
    summary:
      "Choose the safest first move when a client escalation and a production incident land at once.",
    prompt:
      "You are supporting a client migration. A production alert shows 2% payment failures, while an executive asks for a status update in ten minutes. What is the best first action?",
    hint: "Protect customers before optimising communication.",
    solution:
      "Start an incident response: acknowledge the alert, assign an owner, and begin mitigation. Send the executive a concise status note after the incident is contained. This prioritises customer impact while keeping stakeholders informed.",
    interaction: {
      type: "choice",
      options: [
        {
          id: "A",
          label: "Write the executive update before looking at the alert.",
        },
        {
          id: "B",
          label: "Start incident response and assign an owner for mitigation.",
        },
        { id: "C", label: "Wait to see whether failures resolve themselves." },
        { id: "D", label: "Ask the client to retry every failed payment." },
      ],
      answer: "B",
    },
    rewardXp: 90,
  },
  {
    id: "practice-stripe-ledger-invariant",
    slug: "stripe-ledger-invariant",
    company: "Payments Co.-style",
    category: "Systems",
    difficulty: "Medium",
    title: "The Ledger Invariant",
    summary:
      "Find the property that keeps money movement trustworthy under retries.",
    prompt:
      "A payment API can receive the same charge request multiple times due to network retries. Which design choice prevents charging the customer twice?",
    hint: "A retry needs a stable identity.",
    solution:
      "Require an idempotency key and persist the first result against it. Any request with the same key returns the original result instead of creating a second charge. This gives clients safe retries without duplicate side effects.",
    interaction: {
      type: "choice",
      options: [
        { id: "A", label: "Add a longer timeout to the payment API." },
        { id: "B", label: "Use an idempotency key and persist its result." },
        { id: "C", label: "Retry the request from the server three times." },
        {
          id: "D",
          label: "Only accept payment requests during business hours.",
        },
      ],
      answer: "B",
    },
    rewardXp: 130,
  },
  {
    id: "practice-amazon-rate-limit",
    slug: "amazon-rate-limit",
    company: "Marketplace Co.-style",
    category: "Coding",
    difficulty: "Medium",
    title: "Burst-Safe Rate Limit",
    summary:
      "Select the algorithm that allows brief bursts while enforcing a steady rate.",
    prompt:
      "An API should allow a customer to make a short burst of requests, but cap their sustained rate over time. Which algorithm is the best fit?",
    hint: "Think of requests spending a balance that refills over time.",
    solution:
      "A token bucket is the right fit. Tokens refill at a fixed rate up to a capacity; each request consumes one. It allows a bounded burst when tokens have accumulated while enforcing a sustainable average rate.",
    interaction: {
      type: "choice",
      options: [
        { id: "A", label: "Token bucket" },
        { id: "B", label: "Randomly reject one in ten requests" },
        { id: "C", label: "A single global mutex" },
        { id: "D", label: "An unbounded queue" },
      ],
      answer: "A",
    },
    rewardXp: 130,
  },
  {
    id: "practice-google-search-debug",
    slug: "google-search-debug",
    company: "Search Co.-style",
    category: "Debugging",
    difficulty: "Easy",
    title: "The Vanishing Result",
    summary: "Trace a search regression from the smallest observable boundary.",
    prompt:
      "A search result is present in the index but missing from the UI. The API response has the result, but the rendered list does not. What should you inspect next?",
    hint: "The index and API are already proven; follow the data one boundary further.",
    solution:
      "Inspect the UI transformation and rendering filter between the API response and the list. The index and API have already been validated, so the narrowest likely fault is client-side mapping, filtering, or keying.",
    interaction: {
      type: "choice",
      options: [
        { id: "A", label: "Rebuild the entire search index." },
        { id: "B", label: "Inspect the UI mapping and client-side filters." },
        { id: "C", label: "Increase the database connection pool." },
        { id: "D", label: "Delete the cache without checking it." },
      ],
      answer: "B",
    },
    rewardXp: 90,
  },
  {
    id: "practice-mckinsey-metric",
    slug: "mckinsey-metric",
    company: "Consulting Co.-style",
    category: "Communication",
    difficulty: "Easy",
    title: "One Metric, One Story",
    summary:
      "Pick the metric that directly tests a customer-retention hypothesis.",
    prompt:
      "Your team believes slower onboarding is causing customers to leave. Which metric best tests this hypothesis?",
    hint: "Choose the metric closest to the claimed cause and outcome.",
    solution:
      "Measure onboarding completion time alongside cohort retention. This directly links the suspected cause (time to complete onboarding) with the outcome (customers staying), unlike broad activity metrics.",
    interaction: {
      type: "choice",
      options: [
        { id: "A", label: "Total number of marketing impressions" },
        { id: "B", label: "Onboarding completion time and cohort retention" },
        { id: "C", label: "Number of tabs open in the admin dashboard" },
        { id: "D", label: "Team meeting attendance" },
      ],
      answer: "B",
    },
    rewardXp: 90,
  },
  {
    id: "practice-atlassian-incident-update",
    slug: "atlassian-incident-update",
    company: "Collaboration Co.-style",
    category: "Communication",
    difficulty: "Medium",
    title: "Calm Incident Update",
    summary:
      "Write the most useful first message during a customer-visible incident.",
    prompt:
      "Choose the update that is clear, honest, and useful while the root cause is still being investigated.",
    hint: "Say what users experience, what is being done, and when you will update again.",
    solution:
      "A good incident update names the user impact, states that mitigation is under way, avoids unsupported certainty, and commits to the next update time. It builds trust without speculating about root cause.",
    interaction: {
      type: "choice",
      options: [
        { id: "A", label: "Everything is fine. Please ignore any errors." },
        {
          id: "B",
          label:
            "We are investigating elevated sync failures affecting some workspaces. Mitigation is under way; next update in 30 minutes.",
        },
        {
          id: "C",
          label: "Engineering made a mistake, but we do not know what yet.",
        },
        {
          id: "D",
          label: "No comment until the incident is completely resolved.",
        },
      ],
      answer: "B",
    },
    rewardXp: 130,
  },
  {
    id: "practice-netflix-cache-key",
    slug: "netflix-cache-key",
    company: "Streaming Co.-style",
    category: "Architecture",
    difficulty: "Hard",
    title: "Personalised Cache Key",
    summary: "Prevent an experiment result from leaking between user variants.",
    prompt:
      "A homepage response is cached, but its recommendations depend on both the user and an A/B experiment assignment. Which cache-key addition is essential?",
    hint: "A response can only be shared by users for whom it is equivalent.",
    solution:
      "Include the user identity (or a safe segment) and experiment variant in the cache key. Otherwise, a response generated for one user or bucket can be served to another, producing incorrect personalisation and contaminating the experiment.",
    interaction: {
      type: "choice",
      options: [
        { id: "A", label: "Cache only by the URL path." },
        {
          id: "B",
          label:
            "Add the user/segment and experiment variant to the cache key.",
        },
        { id: "C", label: "Turn off all caching forever." },
        { id: "D", label: "Use the current server hostname as the only key." },
      ],
      answer: "B",
    },
    rewardXp: 180,
  },
  {
    id: "practice-uber-matching",
    slug: "uber-matching",
    company: "Mobility Co.-style",
    category: "Algorithms",
    difficulty: "Hard",
    title: "Nearest Available Driver",
    summary: "Choose the data structure that supports fast local matching.",
    prompt:
      "A dispatch service frequently needs to find the nearest available driver to a rider while driver locations update continuously. Which structure is most appropriate as a starting point?",
    hint: "The query is geographic and local, not a simple one-dimensional sort.",
    solution:
      "Use a geospatial index such as a grid, geohash, or R-tree to search nearby cells efficiently, then rank the candidates. A flat list forces a full scan and will not scale with driver count.",
    interaction: {
      type: "choice",
      options: [
        { id: "A", label: "A flat array scanned from start to finish" },
        { id: "B", label: "A geospatial index such as a grid or geohash" },
        { id: "C", label: "A stack" },
        { id: "D", label: "A single global counter" },
      ],
      answer: "B",
    },
    rewardXp: 180,
  },
  {
    id: "practice-github-rollback",
    slug: "github-rollback",
    company: "Developer Tools Co.-style",
    category: "Release",
    difficulty: "Medium",
    title: "The Safe Rollback",
    summary: "Pick the safest response to a deploy with a growing error rate.",
    prompt:
      "A deployment is followed by a steadily increasing 5xx error rate. The team has a known-good previous release and no schema migration was included. What should happen first?",
    hint: "Stabilise the system before explaining every detail.",
    solution:
      "Roll back to the known-good release and monitor recovery. Since the release is the most recent change and rollback is safe, restoring service is the first priority; the root-cause investigation follows with evidence intact.",
    interaction: {
      type: "choice",
      options: [
        {
          id: "A",
          label: "Roll back to the known-good release and monitor recovery.",
        },
        {
          id: "B",
          label:
            "Keep deploying fixes directly to production until errors stop.",
        },
        { id: "C", label: "Wait for a full postmortem before acting." },
        { id: "D", label: "Clear every production table." },
      ],
      answer: "A",
    },
    rewardXp: 130,
  },
  {
    id: "practice-figma-design-token",
    slug: "figma-design-token",
    company: "Design Tools Co.-style",
    category: "Product",
    difficulty: "Easy",
    title: "Token, Not Pixel",
    summary: "Choose the system-level fix for a repeated visual inconsistency.",
    prompt:
      "The same blue appears in 47 files as manually typed hex values. A brand update is coming. What is the best durable fix?",
    hint: "The problem is repeated values, not one individual screen.",
    solution:
      "Create a named design token and migrate the repeated hex values to that token. Future brand updates then happen in one source of truth, while the semantic name improves consistency across design and code.",
    interaction: {
      type: "choice",
      options: [
        { id: "A", label: "Ask every designer to remember the new hex value." },
        {
          id: "B",
          label: "Create a named design token and migrate repeated values.",
        },
        { id: "C", label: "Change only the most visible screen." },
        { id: "D", label: "Make the blue slightly random on every page." },
      ],
      answer: "B",
    },
    rewardXp: 90,
  },
  {
    id: "practice-airbnb-sql-safety",
    slug: "airbnb-sql-safety",
    company: "Travel Co.-style",
    category: "Coding",
    difficulty: "Medium",
    title: "Safe Guest Search",
    summary:
      "Name the database technique that prevents user input from becoming SQL.",
    prompt:
      "Complete the phrase: To safely search guests by a user-supplied city, use a ______ query instead of concatenating the input into SQL.",
    hint: "The database driver should receive values separately from executable SQL.",
    solution:
      "Use a parameterized query (also called a prepared statement). Parameters keep user values separate from SQL syntax, preventing injection and making quoting rules the driver’s responsibility.",
    interaction: {
      type: "short-text",
      placeholder: "Type the missing phrase",
      answer: [
        "parameterized",
        "parameterized query",
        "prepared statement",
        "prepared statements",
      ],
    },
    rewardXp: 130,
  },
  {
    id: "practice-tesla-root-cause",
    slug: "tesla-root-cause",
    company: "Manufacturing Co.-style",
    category: "Logic",
    difficulty: "Hard",
    title: "Line Stop Signal",
    summary:
      "Select the best evidence before declaring a production-line root cause.",
    prompt:
      "A quality defect rises after a line configuration change. Which evidence most strongly supports the change as the cause?",
    hint: "Look for a comparison that isolates the suspected variable.",
    solution:
      "Compare defect rates before and after the configuration change while controlling for product batch and shift, ideally with a rollback or matched line. This isolates the variable rather than confusing correlation with a change in demand or staffing.",
    interaction: {
      type: "choice",
      options: [
        { id: "A", label: "A single anecdote from one operator" },
        {
          id: "B",
          label: "A controlled before/after comparison with matched conditions",
        },
        { id: "C", label: "The fact that the defect feels unusual" },
        { id: "D", label: "A guess from the most senior person in the room" },
      ],
      answer: "B",
    },
    rewardXp: 180,
  },
  {
    id: "practice-key-maze",
    slug: "key-maze",
    company: "Craft puzzle lab",
    category: "Puzzle",
    difficulty: "Medium",
    title: "Key Maze",
    summary: "Memorise a hidden route, collect three keys, and reach the exit.",
    prompt:
      "The walls are invisible. Move one cell at a time, collect every key, then reach EXIT. A wall hit returns you to the start and resets your keys.",
    hint: "The first route goes right, down, right, down. Build the map from each safe move.",
    solution:
      "This puzzle rewards careful state tracking. Record each safe movement and the position of every key; after a reset, replay the known route rather than guessing. That is the same discipline used in stateful debugging.",
    interaction: { type: "maze", answer: "escaped" },
    rewardXp: 200,
  },
];

try {
  db.prepare('SELECT 1 FROM "PracticeChallenge" LIMIT 1').get();
} catch {
  console.error(
    "Practice tables are missing. Run `npm run db:migrate` before seeding.",
  );
  process.exit(1);
}

const upsertChallenge = db.prepare(`
  INSERT INTO "PracticeChallenge" ("id", "slug", "company", "category", "difficulty", "title", "summary", "prompt", "hint", "solution", "interaction", "rewardXp", "published", "createdAt", "updatedAt")
  VALUES (@id, @slug, @company, @category, @difficulty, @title, @summary, @prompt, @hint, @solution, @interaction, @rewardXp, 1, @now, @now)
  ON CONFLICT("slug") DO UPDATE SET
    "company" = excluded."company", "category" = excluded."category", "difficulty" = excluded."difficulty", "title" = excluded."title", "summary" = excluded."summary", "prompt" = excluded."prompt", "hint" = excluded."hint", "solution" = excluded."solution", "interaction" = excluded."interaction", "rewardXp" = excluded."rewardXp", "published" = true, "updatedAt" = excluded."updatedAt"
`);

const seed = db.transaction(() => {
  for (const challenge of challenges)
    upsertChallenge.run({
      ...challenge,
      interaction: JSON.stringify(challenge.interaction),
      now,
    });
});

seed();

try {
  db.prepare('SELECT 1 FROM "Assessment" LIMIT 1').get();
  const assessments = [
    {
      id: "assessment-oa-foundations",
      slug: "oa-foundations",
      title: "OA Foundations",
      description:
        "A 20-minute mixed screening: systems judgment, debugging, coding safety, and communication.",
      durationMin: 20,
      questionIds: JSON.stringify([
        "practice-accenture-priority-queue",
        "practice-stripe-ledger-invariant",
        "practice-google-search-debug",
        "practice-airbnb-sql-safety",
        "practice-atlassian-incident-update",
      ]),
      rewardXp: 250,
    },
    {
      id: "assessment-systems-reasoning",
      slug: "systems-reasoning",
      title: "Systems & Reasoning",
      description:
        "A 25-minute technical reasoning assessment based on common OA patterns: algorithms, release judgment, and architecture trade-offs.",
      durationMin: 25,
      questionIds: JSON.stringify([
        "practice-amazon-rate-limit",
        "practice-netflix-cache-key",
        "practice-uber-matching",
        "practice-github-rollback",
        "practice-tesla-root-cause",
      ]),
      rewardXp: 320,
    },
  ];
  const upsertAssessment = db.prepare(
    `INSERT INTO "Assessment" ("id", "slug", "title", "description", "durationMin", "questionIds", "rewardXp", "published", "createdAt", "updatedAt") VALUES (@id, @slug, @title, @description, @durationMin, @questionIds, @rewardXp, 1, @now, @now) ON CONFLICT("slug") DO UPDATE SET "title"=excluded."title", "description"=excluded."description", "durationMin"=excluded."durationMin", "questionIds"=excluded."questionIds", "rewardXp"=excluded."rewardXp", "published"=true, "updatedAt"=excluded."updatedAt"`,
  );
  for (const assessment of assessments)
    upsertAssessment.run({ ...assessment, now });
  console.log(`✓ Seeded ${assessments.length} timed assessments.`);
} catch {
  console.log(
    "! Timed-assessment tables are not yet migrated; rerun the seed after `npm run db:migrate`.",
  );
}
db.close();
console.log(
  `✓ Seeded ${challenges.length} interactive company-style practice challenges.`,
);
