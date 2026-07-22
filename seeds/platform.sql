-- Craft demo platform data. Apply after migrations with:
-- npx prisma db execute --file seeds/platform.sql
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO "user" ("id", "name", "email", "emailVerified", "username", "displayUsername", "role", "createdAt", "updatedAt") VALUES
  ('seed-superadmin', 'Avery Morgan', 'avery@craft.local', 1, 'avery', 'avery', 'SUPERADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-admin', 'Jordan Lee', 'jordan@craft.local', 1, 'jordan', 'jordan', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-teacher', 'Mira Chen', 'mira@craft.local', 1, 'mira', 'mira', 'TEACHER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-student', 'Dev Patel', 'dev@craft.local', 1, 'dev', 'dev', 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "Organization" ("id", "name", "slug", "createdAt") VALUES
  ('seed-org', 'Craft Labs', 'craft-labs', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "OrganizationMember" ("id", "organizationId", "userId", "role") VALUES
  ('seed-membership-admin', 'seed-org', 'seed-admin', 'ADMIN'),
  ('seed-membership-teacher', 'seed-org', 'seed-teacher', 'INSTRUCTOR'),
  ('seed-membership-student', 'seed-org', 'seed-student', 'LEARNER');

INSERT OR IGNORE INTO "Challenge" ("id", "slug", "title", "summary", "track", "status", "access", "priceCents", "languages", "dockerImage", "starterRepo", "creatorId", "createdAt", "updatedAt") VALUES
  ('seed-kv-store', 'build-your-own-kv-store', 'Build Your Own KV Store', 'Build a persistent networked key/value store one observable milestone at a time.', 'DevOps & Infra', 'PUBLISHED', 'OPEN', 0, 'TypeScript,Python,Go,Rust,C++,Java', 'ghcr.io/craft/kv-store-tests:latest', 'github.com/craft-labs/kv-store-starter', 'seed-teacher', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-vector-db', 'build-your-own-vector-database', 'Build Your Own Vector Database', 'Implement embeddings, similarity search, and durable vector segments.', 'AI & ML Engineering', 'PUBLISHED', 'PAID', 4900, 'TypeScript,Python,Go,Rust', 'ghcr.io/craft/vector-db-tests:latest', 'github.com/craft-labs/vector-db-starter', 'seed-teacher', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-oauth', 'build-your-own-oauth-server', 'Build an OAuth2 Server', 'Implement secure authorization flows, signing keys, and refresh rotation.', 'Fintech & Security', 'REVIEW', 'PRIVATE', 0, 'TypeScript,Python,Go,Java', 'ghcr.io/craft/oauth-tests:latest', 'github.com/craft-labs/oauth-starter', 'seed-teacher', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "ChallengeStage" ("id", "challengeId", "position", "title", "brief", "hint", "testCommand") VALUES
  ('seed-kv-1', 'seed-kv-store', 1, 'PING', 'Expose a health command over a TCP connection.', 'Keep parsing and command handling separate.', 'craft test --stage 1'),
  ('seed-kv-2', 'seed-kv-store', 2, 'GET / SET', 'Store and retrieve string keys in memory.', 'Start with one map behind a tiny storage interface.', 'craft test --stage 2'),
  ('seed-kv-3', 'seed-kv-store', 3, 'Persistence', 'Retain values safely across process restarts.', 'Append before acknowledging a write.', 'craft test --stage 3'),
  ('seed-kv-4', 'seed-kv-store', 4, 'Indexes', 'Add indexes without changing the command boundary.', 'Make index rebuilding a deterministic startup concern.', 'craft test --stage 4'),
  ('seed-kv-5', 'seed-kv-store', 5, 'Query planner', 'Plan scans against available indexes.', 'Describe a query before executing it.', 'craft test --stage 5'),
  ('seed-kv-6', 'seed-kv-store', 6, 'Benchmarks', 'Run the standard load harness and submit proof.', 'Measure p99 and memory as well as throughput.', 'craft test --stage 6');

INSERT OR IGNORE INTO "Enrollment" ("id", "userId", "challengeId", "language", "currentStage") VALUES
  ('seed-enrollment', 'seed-student', 'seed-kv-store', 'TypeScript', 4);
INSERT OR IGNORE INTO "Benchmark" ("id", "enrollmentId", "requestsPerSecond", "p99LatencyMs", "memoryMb", "verifiedAt") VALUES
  ('seed-benchmark', 'seed-enrollment', 42000, 18.4, 92, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "PeerReview" ("id", "enrollmentId", "status", "notes", "createdAt") VALUES
  ('seed-review', 'seed-enrollment', 'REQUESTED', 'Persistence boundary ready for architecture review.', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "AuditLog" ("id", "actorId", "action", "target", "metadata", "createdAt") VALUES
  ('seed-audit-1', 'seed-superadmin', 'challenge.published', 'build-your-own-kv-store', '{"source":"seed"}', CURRENT_TIMESTAMP),
  ('seed-audit-2', 'seed-admin', 'organization.track_created', 'platform-api-foundations', '{"source":"seed"}', CURRENT_TIMESTAMP);
