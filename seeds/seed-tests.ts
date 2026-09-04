/**
 * seeds/seed-tests.ts
 *
 * Seeds:
 *   - 20 PracticeChallenge questions (puzzles + OA-style MCQ + short-text)
 *   - 3 Assessment bundles (OA Round 1, System Design, DSA Gauntlet)
 *
 * Run: npx tsx seeds/seed-tests.ts
 *
 * Safe to re-run — uses upsert everywhere.
 * Passwords are not set here; run seed.ts first to have users.
 */

import "dotenv/config";
import { prisma } from "../lib/db";

// ─── Question definitions ─────────────────────────────────────────────────────
// interaction.answer is ONLY stored server-side — never sent to the client.

const questions = [
  // ──────────────────── SYSTEM DESIGN ───────────────────────────────────────
  {
    id: "q-sd-01",
    slug: "idempotency-key-payment-api",
    company: "Stripe",
    category: "System Design",
    difficulty: "Medium",
    title: "Idempotency in payment APIs",
    summary: "What prevents duplicate charges when a request is retried?",
    prompt:
      "A client sends a POST /payments request. The network times out before the response arrives. The client retries. Which mechanism guarantees the charge happens exactly once?",
    hint: "Think about what the client can attach to each unique payment intent so the server can deduplicate.",
    solution:
      "An idempotency key — a client-generated UUID sent in a header (e.g. Idempotency-Key). The server stores the key and result; duplicate requests return the cached response without re-executing. Stripe, PayPal, and most payment APIs implement this at the gateway layer.",
    rewardXp: 120,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "Retry-After header" },
        { id: "B", label: "Idempotency key sent by the client" },
        { id: "C", label: "Increasing the HTTP timeout" },
        { id: "D", label: "Using PUT instead of POST" },
      ],
      answer: "B",
    }),
  },
  {
    id: "q-sd-02",
    slug: "cap-theorem-cp-ap",
    company: "Amazon",
    category: "System Design",
    difficulty: "Hard",
    title: "CAP theorem — partition choice",
    summary: "During a network partition, which trade-off does Cassandra make?",
    prompt:
      "A network partition splits your Cassandra cluster into two halves. Which properties does Cassandra sacrifice and which does it preserve, according to the CAP theorem?",
    hint: "Cassandra is tunable but defaults to availability over consistency. What does that mean for reads during a partition?",
    solution:
      "Cassandra is an AP system — it prioritises Availability and Partition tolerance over Consistency. During a partition, both sides continue to accept writes. After healing, last-write-wins reconciliation or read-repair resolves conflicts. This means stale reads are possible.",
    rewardXp: 150,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "Sacrifices Availability, preserves Consistency (CP)" },
        { id: "B", label: "Sacrifices Consistency, preserves Availability (AP)" },
        { id: "C", label: "Preserves both by using quorum reads" },
        { id: "D", label: "CAP does not apply to NoSQL databases" },
      ],
      answer: "B",
    }),
  },
  {
    id: "q-sd-03",
    slug: "rate-limiter-algorithm",
    company: "Cloudflare",
    category: "System Design",
    difficulty: "Medium",
    title: "Rate limiter — algorithm choice",
    summary: "Which algorithm smooths bursts better than a fixed window?",
    prompt:
      "You're building an API rate limiter. A fixed-window counter allows a burst of 2× the rate limit at window boundaries. Which algorithm eliminates this burst problem without significantly increasing memory usage?",
    hint: "The sliding window is one approach, but there's a simpler token-based algorithm that distributes requests more evenly.",
    solution:
      "Token bucket: tokens are added at a fixed rate (e.g. 10/s) up to a max bucket size. Each request consumes one token. Bursts up to the bucket size are allowed, but the long-run rate is capped. It avoids the boundary burst of a fixed window while being O(1) per request in memory.",
    rewardXp: 130,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "Token bucket" },
        { id: "B", label: "Fixed window counter" },
        { id: "C", label: "Exponential backoff" },
        { id: "D", label: "Bloom filter" },
      ],
      answer: "A",
    }),
  },
  {
    id: "q-sd-04",
    slug: "consistent-hashing-purpose",
    company: "Discord",
    category: "System Design",
    difficulty: "Medium",
    title: "Consistent hashing — purpose",
    summary: "Why do distributed caches use consistent hashing?",
    prompt:
      "You have a 10-node Redis cluster. You add a new node. With a naive modulo hash (key % N), how many existing keys need to be remapped?",
    hint: "Think about what changes when N goes from 10 to 11.",
    solution:
      "With modulo hashing, almost all keys need remapping — roughly (N-1)/N ≈ 90% of keys move when N changes from 10 to 11. Consistent hashing reduces this to ~1/N keys (≈9%) by mapping both nodes and keys to a ring; only keys between the new node and its predecessor need to move.",
    rewardXp: 130,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "~10% of keys" },
        { id: "B", label: "~50% of keys" },
        { id: "C", label: "~90% of keys" },
        { id: "D", label: "No keys — modulo is stable" },
      ],
      answer: "C",
    }),
  },
  // ──────────────────── DSA / ALGORITHMS ────────────────────────────────────
  {
    id: "q-dsa-01",
    slug: "two-sum-complexity",
    company: "Google",
    category: "Algorithms",
    difficulty: "Easy",
    title: "Two-sum — optimal complexity",
    summary: "What is the time complexity of the hash-map two-sum solution?",
    prompt:
      "Given an unsorted array of integers and a target, find two indices whose values sum to the target. What is the time and space complexity of the optimal (single-pass hash map) solution?",
    hint: "A single pass means you visit each element once. What data structure lets you check membership in O(1)?",
    solution:
      "O(n) time, O(n) space. You iterate the array once, storing each value → index in a hash map. For each element x, check if (target − x) already exists in the map. One pass, one lookup per element.",
    rewardXp: 80,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "O(n²) time, O(1) space" },
        { id: "B", label: "O(n log n) time, O(1) space" },
        { id: "C", label: "O(n) time, O(n) space" },
        { id: "D", label: "O(n) time, O(1) space" },
      ],
      answer: "C",
    }),
  },
  {
    id: "q-dsa-02",
    slug: "binary-search-invariant",
    company: "Microsoft",
    category: "Algorithms",
    difficulty: "Medium",
    title: "Binary search — off-by-one",
    summary: "Which condition avoids an infinite loop in binary search?",
    prompt:
      "In a standard binary search over a sorted array using `lo` and `hi` pointers, which loop condition avoids an infinite loop when `lo` and `hi` are adjacent?",
    hint: "Consider what happens when lo = 4, hi = 5, and mid = (4+5)/2 = 4. If the answer is not at 4, does lo or hi move?",
    solution:
      "Use `while (lo < hi)`, not `while (lo <= hi)`, when updating `lo = mid + 1` and `hi = mid`. If you write `while (lo <= hi)` with `hi = mid`, you risk an infinite loop when lo == hi == mid. The correct invariant depends on the update rule — the key is that the search space strictly shrinks each iteration.",
    rewardXp: 120,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "while (lo <= hi) with hi = mid" },
        { id: "B", label: "while (lo < hi) with hi = mid" },
        { id: "C", label: "while (lo < hi) with lo = mid" },
        { id: "D", label: "for loop with fixed iterations" },
      ],
      answer: "B",
    }),
  },
  {
    id: "q-dsa-03",
    slug: "bfs-vs-dfs-shortest-path",
    company: "Meta",
    category: "Algorithms",
    difficulty: "Easy",
    title: "BFS vs DFS — shortest path in unweighted graph",
    summary: "Which traversal guarantees the shortest path in an unweighted graph?",
    prompt:
      "You need to find the shortest path (fewest edges) between two nodes in an unweighted, undirected graph. Which algorithm guarantees the optimal answer?",
    hint: "One of these explores level-by-level, the other goes deep first. Which expansion order naturally discovers the nearest node first?",
    solution:
      "Breadth-first search (BFS). BFS explores all neighbours at distance 1 before distance 2, so the first time it reaches the target it has found the shortest path. DFS may find a longer path first and has no such guarantee in unweighted graphs.",
    rewardXp: 80,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "Depth-first search (DFS)" },
        { id: "B", label: "Breadth-first search (BFS)" },
        { id: "C", label: "Both guarantee it equally" },
        { id: "D", label: "Neither — you need Dijkstra even for unweighted graphs" },
      ],
      answer: "B",
    }),
  },
  {
    id: "q-dsa-04",
    slug: "dynamic-programming-overlapping",
    company: "Apple",
    category: "Algorithms",
    difficulty: "Hard",
    title: "DP — overlapping subproblems",
    summary: "What reduces Fibonacci recursion from O(2ⁿ) to O(n)?",
    prompt:
      "A naive recursive Fibonacci is O(2ⁿ). Memoisation reduces it to O(n). What fundamental property of Fibonacci makes memoisation effective?",
    hint: "The two conditions for dynamic programming are optimal substructure and ___.",
    solution:
      "Overlapping subproblems. fib(n) = fib(n-1) + fib(n-2), and fib(n-2) is also computed inside fib(n-1). Without caching, the same sub-results are recomputed exponentially many times. Memoisation stores each sub-result the first time it's computed, reducing total work to O(n).",
    rewardXp: 150,
    interaction: JSON.stringify({
      type: "short-text",
      placeholder: "Two words",
      answer: ["overlapping subproblems", "overlapping sub-problems"],
    }),
  },
  // ──────────────────── DATABASES ───────────────────────────────────────────
  {
    id: "q-db-01",
    slug: "index-selectivity",
    company: "Notion",
    category: "Databases",
    difficulty: "Medium",
    title: "Index selectivity",
    summary: "Why is a boolean column a poor candidate for a B-tree index?",
    prompt:
      "Your DBA suggests removing the B-tree index on a `is_deleted BOOLEAN` column. She says it has poor selectivity. Why does low selectivity make an index ineffective?",
    hint: "Consider the cardinality of a boolean column — how many distinct values exist?",
    solution:
      "A boolean column has only 2 distinct values. Low selectivity means the index covers ~50% of rows per value. The query planner often finds a sequential scan faster than following index pointers that point to half the table. High-selectivity columns (e.g., user IDs, UUIDs) have many distinct values, making the index narrow and fast.",
    rewardXp: 110,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "The index is too large to fit in memory" },
        { id: "B", label: "Each index entry points to too many rows, making a full scan faster" },
        { id: "C", label: "B-tree indexes don't support boolean types" },
        { id: "D", label: "The planner ignores indexes on nullable columns" },
      ],
      answer: "B",
    }),
  },
  {
    id: "q-db-02",
    slug: "acid-isolation-level",
    company: "PlanetScale",
    category: "Databases",
    difficulty: "Hard",
    title: "ACID — isolation levels",
    summary: "Which isolation level prevents phantom reads?",
    prompt:
      "Transaction A runs: SELECT COUNT(*) FROM orders WHERE status = 'pending'. Meanwhile, Transaction B inserts a new pending order and commits. Transaction A re-runs the same SELECT and gets a different count. What anomaly is this and which isolation level prevents it?",
    hint: "This anomaly involves new rows appearing between two reads in the same transaction — not a changed value, but a new row.",
    solution:
      "This is a phantom read. The isolation level that prevents it is SERIALIZABLE (the highest level). REPEATABLE READ prevents non-repeatable reads (changed values) but not phantom reads in most databases. SERIALIZABLE uses range locks or MVCC to prevent new rows from appearing mid-transaction.",
    rewardXp: 150,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "Dirty read — prevented by READ COMMITTED" },
        { id: "B", label: "Non-repeatable read — prevented by REPEATABLE READ" },
        { id: "C", label: "Phantom read — prevented by SERIALIZABLE" },
        { id: "D", label: "Lost update — prevented by FOR UPDATE lock" },
      ],
      answer: "C",
    }),
  },
  // ──────────────────── NETWORKING / OS ─────────────────────────────────────
  {
    id: "q-net-01",
    slug: "tcp-three-way-handshake",
    company: "Cloudflare",
    category: "Networking",
    difficulty: "Easy",
    title: "TCP three-way handshake",
    summary: "What are the three steps of the TCP handshake?",
    prompt:
      "A client wants to establish a TCP connection to a server. List the three messages exchanged in order.",
    hint: "SYN stands for synchronise. The server's reply acknowledges the client's sequence number and sends its own.",
    solution:
      "1. SYN — client sends a segment with SYN flag set and its initial sequence number. 2. SYN-ACK — server acknowledges the client's SYN and sends its own SYN with the server's sequence number. 3. ACK — client acknowledges the server's SYN. The connection is now established.",
    rewardXp: 80,
    interaction: JSON.stringify({
      type: "short-text",
      placeholder: "e.g. SYN, SYN-ACK, ACK",
      answer: ["SYN, SYN-ACK, ACK", "syn, syn-ack, ack", "SYN SYN-ACK ACK"],
    }),
  },
  {
    id: "q-net-02",
    slug: "http2-multiplexing",
    company: "Vercel",
    category: "Networking",
    difficulty: "Medium",
    title: "HTTP/2 multiplexing",
    summary: "What problem does HTTP/2 multiplexing solve over HTTP/1.1?",
    prompt:
      "HTTP/1.1 suffers from head-of-line blocking at the application layer. How does HTTP/2 solve this and what is the remaining limitation?",
    hint: "HTTP/2 uses a single TCP connection with numbered frames. What is the unit of parallelism?",
    solution:
      "HTTP/2 multiplexes multiple streams (request/response pairs) over a single TCP connection using binary framing with stream IDs. This eliminates application-layer head-of-line blocking. However, TCP's reliability layer still causes HOL blocking — a single lost packet stalls all streams. HTTP/3 moves to QUIC (UDP-based) to solve this at the transport layer.",
    rewardXp: 130,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "Multiple TCP connections per host" },
        { id: "B", label: "Binary framing with stream IDs over a single TCP connection" },
        { id: "C", label: "Pipelining with strict ordering" },
        { id: "D", label: "Switching from TCP to UDP entirely" },
      ],
      answer: "B",
    }),
  },
  // ──────────────────── SECURITY ────────────────────────────────────────────
  {
    id: "q-sec-01",
    slug: "csrf-protection-mechanism",
    company: "GitHub",
    category: "Security",
    difficulty: "Medium",
    title: "CSRF protection",
    summary: "What makes a CSRF token effective?",
    prompt:
      "A CSRF attack tricks a logged-in user's browser into making an unintended state-changing request to your app. Which property of a CSRF token makes it effective against this attack?",
    hint: "The attacker can forge the request structure, but what can they NOT read from the victim's browser?",
    solution:
      "A CSRF token is a secret, random value embedded in the form (or a header) that the server validates. The attacker can't read it because it's stored in the page HTML or a custom header — neither is accessible cross-origin due to the Same-Origin Policy. Cookies are automatically sent by the browser, which is why they alone are insufficient.",
    rewardXp: 120,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "It is stored in a cookie and automatically sent" },
        { id: "B", label: "It is a secret value the attacker cannot read cross-origin" },
        { id: "C", label: "It expires after 60 seconds" },
        { id: "D", label: "It is hashed with the user's IP address" },
      ],
      answer: "B",
    }),
  },
  {
    id: "q-sec-02",
    slug: "sql-injection-prevention",
    company: "HackerOne",
    category: "Security",
    difficulty: "Easy",
    title: "SQL injection prevention",
    summary: "What is the correct defence against SQL injection?",
    prompt:
      "A developer writes: `query = 'SELECT * FROM users WHERE id = ' + userId`. An attacker passes `1 OR 1=1` as the userId. What is the correct fix?",
    hint: "The fix separates the SQL structure from the data values. The driver handles escaping.",
    solution:
      "Use parameterised queries (prepared statements): `SELECT * FROM users WHERE id = $1` with the userId passed as a parameter. The database driver separates the query structure from user data, so the injected SQL is treated as a literal string, not executable code.",
    rewardXp: 80,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "Sanitise the input by removing special characters" },
        { id: "B", label: "Use parameterised queries / prepared statements" },
        { id: "C", label: "Encode the userId as Base64" },
        { id: "D", label: "Validate that userId is numeric on the client side" },
      ],
      answer: "B",
    }),
  },
  // ──────────────────── CONCURRENCY ─────────────────────────────────────────
  {
    id: "q-con-01",
    slug: "deadlock-conditions",
    company: "Oracle",
    category: "Concurrency",
    difficulty: "Hard",
    title: "Deadlock — four necessary conditions",
    summary: "Name one condition whose elimination prevents deadlock.",
    prompt:
      "Deadlock requires four conditions to hold simultaneously (Coffman conditions). Which single condition is the easiest to eliminate in most lock-based systems to prevent deadlock?",
    hint: "One condition says a process must request resources while holding others. Eliminating it means a process must request ALL resources at once, upfront.",
    solution:
      "Hold-and-wait: if a process must request all resources at the start (or release all before requesting new ones), a cycle can never form. Other approaches include imposing a lock-ordering (eliminates circular wait) or using timeouts with backoff. In practice, lock ordering is most common in production systems.",
    rewardXp: 150,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "Mutual exclusion" },
        { id: "B", label: "Hold-and-wait" },
        { id: "C", label: "No preemption" },
        { id: "D", label: "All four are equally hard to eliminate" },
      ],
      answer: "B",
    }),
  },
  // ──────────────────── FRONTEND / BROWSER ──────────────────────────────────
  {
    id: "q-fe-01",
    slug: "react-reconciliation",
    company: "Meta",
    category: "Frontend",
    difficulty: "Medium",
    title: "React reconciliation — key prop",
    summary: "Why does removing the key prop cause unexpected state reuse?",
    prompt:
      "You have a list of `<TodoItem>` components. Removing items from the middle causes the wrong item to be focused. What is the root cause and fix?",
    hint: "React's diffing algorithm needs a stable identity for each list item to match old and new trees correctly.",
    solution:
      "Without a stable `key` prop, React uses array index as the identity. Removing item at index 1 causes item at old index 2 to now be at index 1 — React thinks the item was updated in-place and reuses its state. Fix: use a stable, unique ID from the data (e.g. `key={todo.id}`) so React can correctly match DOM nodes across re-renders.",
    rewardXp: 110,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "Add a unique key prop using item IDs, not array index" },
        { id: "B", label: "Use React.memo on TodoItem" },
        { id: "C", label: "Wrap the list in React.StrictMode" },
        { id: "D", label: "Use useLayoutEffect instead of useEffect" },
      ],
      answer: "A",
    }),
  },
  {
    id: "q-fe-02",
    slug: "event-loop-microtask",
    company: "Cloudflare",
    category: "Frontend",
    difficulty: "Hard",
    title: "Event loop — microtask vs macrotask order",
    summary: "What prints first: setTimeout(fn, 0) or Promise.then(fn)?",
    prompt:
      "Consider:\n```js\nsetTimeout(() => console.log('A'), 0);\nPromise.resolve().then(() => console.log('B'));\nconsole.log('C');\n```\nWhat is the output order?",
    hint: "Synchronous code runs first. Then microtasks (Promise callbacks) drain before the next macrotask (setTimeout) fires.",
    solution:
      "Output: C, B, A. Synchronous code runs first → C. Promise.then callbacks are microtasks and run before the next macrotask → B. setTimeout is a macrotask scheduled to run after the current event loop tick → A.",
    rewardXp: 140,
    interaction: JSON.stringify({
      type: "short-text",
      placeholder: "e.g. C, A, B",
      answer: ["C, B, A", "C B A", "c, b, a", "c b a"],
    }),
  },
  // ──────────────────── CLOUD / DEVOPS ──────────────────────────────────────
  {
    id: "q-do-01",
    slug: "blue-green-deployment",
    company: "Netflix",
    category: "DevOps",
    difficulty: "Easy",
    title: "Blue-green deployment",
    summary: "What is the key advantage of blue-green deployments?",
    prompt:
      "Your team uses blue-green deployments. Production traffic runs on 'blue'. You deploy the new version to 'green' and run tests. What happens next, and what is the key advantage?",
    hint: "Consider what happens if a critical bug is found minutes after flipping traffic to green.",
    solution:
      "You switch the load balancer to route traffic from blue to green. If a critical issue is found, you instantly roll back by flipping traffic back to blue — with zero downtime and no re-deployment needed. The old environment is still warm and running. This is the key advantage: instant rollback without rebuilding or redeploying.",
    rewardXp: 90,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "Zero-downtime deployment and instant rollback by flipping the load balancer" },
        { id: "B", label: "A/B testing different features to different user segments" },
        { id: "C", label: "Reduced infrastructure cost by sharing resources between environments" },
        { id: "D", label: "Canary releases that gradually shift traffic" },
      ],
      answer: "A",
    }),
  },
  {
    id: "q-do-02",
    slug: "kubernetes-liveness-readiness",
    company: "Google",
    category: "DevOps",
    difficulty: "Medium",
    title: "Kubernetes probes — liveness vs readiness",
    summary: "Which probe stops traffic without restarting the container?",
    prompt:
      "Your service is healthy but needs 30 seconds to warm up a cache before it can handle traffic. It should not receive requests during this window but should NOT be restarted. Which Kubernetes probe type should you configure?",
    hint: "One probe restarts the container on failure. The other removes it from the service endpoints.",
    solution:
      "Readiness probe. When it fails, Kubernetes removes the pod from the Service's Endpoints list — no new traffic is routed to it — but the container is NOT restarted. A liveness probe failure triggers a container restart. For startup/warm-up scenarios, readiness is the right choice. A startup probe is also appropriate to prevent the liveness probe from interfering during initial boot.",
    rewardXp: 120,
    interaction: JSON.stringify({
      type: "choice",
      options: [
        { id: "A", label: "Liveness probe — restarts the container when it fails" },
        { id: "B", label: "Readiness probe — removes it from endpoints without restarting" },
        { id: "C", label: "Startup probe — delays all other probes until ready" },
        { id: "D", label: "Lifecycle hook — runs a script before traffic is accepted" },
      ],
      answer: "B",
    }),
  },
] as const;

// ─── Assessment definitions ───────────────────────────────────────────────────

const assessments = [
  {
    id: "oa-backend-round1",
    slug: "backend-oa-round-1",
    title: "Backend Engineering OA — Round 1",
    description:
      "Covers system design fundamentals, databases, and networking. Mirrors the format of real online assessments from top tech companies. Time-boxed — no hints, no going back.",
    durationMin: 25,
    // 8 questions: system design + DB + networking
    questionIds: ["q-sd-01", "q-sd-02", "q-sd-03", "q-sd-04", "q-db-01", "q-db-02", "q-net-01", "q-net-02"],
    rewardXp: 400,
    published: true,
  },
  {
    id: "oa-dsa-gauntlet",
    slug: "dsa-gauntlet",
    title: "DSA Gauntlet",
    description:
      "Pure algorithms and data structures. No hints. Full lockdown environment. 6 questions, 20 minutes. Designed to be brutal.",
    durationMin: 20,
    questionIds: ["q-dsa-01", "q-dsa-02", "q-dsa-03", "q-dsa-04", "q-fe-02", "q-con-01"],
    rewardXp: 350,
    published: true,
  },
  {
    id: "oa-security-devops",
    slug: "security-devops-assessment",
    title: "Security & DevOps Assessment",
    description:
      "Security fundamentals, concurrency, and cloud operations. Timed. Violations are logged.",
    durationMin: 15,
    questionIds: ["q-sec-01", "q-sec-02", "q-do-01", "q-do-02", "q-con-01"],
    rewardXp: 250,
    published: true,
  },
] as const;

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding questions and assessments…\n");

  // ── Questions ──────────────────────────────────────────────────────────────
  let qCreated = 0;
  let qUpdated = 0;
  for (const q of questions) {
    const { id, ...data } = q;
    const existing = await prisma.practiceChallenge.findUnique({
      where: { id },
      select: { id: true },
    });
    if (existing) {
      await prisma.practiceChallenge.update({ where: { id }, data: { ...data, published: true } });
      qUpdated++;
    } else {
      await prisma.practiceChallenge.create({ data: { id, ...data, published: true } });
      qCreated++;
    }
    process.stdout.write(`  ✓ ${q.title}\n`);
  }
  console.log(`\n  Questions: ${qCreated} created, ${qUpdated} updated\n`);

  // ── Assessments ────────────────────────────────────────────────────────────
  let aCreated = 0;
  let aUpdated = 0;
  for (const a of assessments) {
    const { id, questionIds, ...rest } = a;
    const payload = { ...rest, questionIds: JSON.stringify([...questionIds]) };
    const existing = await prisma.assessment.findUnique({
      where: { id },
      select: { id: true },
    });
    if (existing) {
      await prisma.assessment.update({ where: { id }, data: payload });
      aUpdated++;
    } else {
      await prisma.assessment.create({ data: { id, ...payload } });
      aCreated++;
    }
    process.stdout.write(`  ✓ ${a.title}  (${[...questionIds].length} questions, ${a.durationMin} min)\n`);
  }
  console.log(`\n  Assessments: ${aCreated} created, ${aUpdated} updated\n`);

  console.log("✅  Done.\n");
  console.log("  Practice: http://localhost:3000/dashboard/practice");
  console.log("  Assessments: http://localhost:3000/dashboard/assessments\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
