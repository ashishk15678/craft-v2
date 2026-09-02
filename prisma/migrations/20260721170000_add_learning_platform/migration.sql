-- Core marketplace, authoring, verification, and organization records.
CREATE TABLE "Challenge" (
  "id" TEXT NOT NULL PRIMARY KEY, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "summary" TEXT NOT NULL,
  "track" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'DRAFT', "access" TEXT NOT NULL DEFAULT 'OPEN',
  "priceCents" INTEGER NOT NULL DEFAULT 0, "languages" TEXT NOT NULL DEFAULT 'TypeScript,Python,Go,Rust,C++,Java',
  "dockerImage" TEXT, "starterRepo" TEXT, "creatorId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL, CONSTRAINT "Challenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Challenge_slug_key" ON "Challenge"("slug");
CREATE TABLE "ChallengeStage" (
  "id" TEXT NOT NULL PRIMARY KEY, "challengeId" TEXT NOT NULL, "position" INTEGER NOT NULL, "title" TEXT NOT NULL,
  "brief" TEXT NOT NULL, "hint" TEXT NOT NULL, "testCommand" TEXT NOT NULL,
  CONSTRAINT "ChallengeStage_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ChallengeStage_challengeId_position_key" ON "ChallengeStage"("challengeId", "position");
CREATE TABLE "Enrollment" (
  "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "challengeId" TEXT NOT NULL, "language" TEXT NOT NULL DEFAULT 'TypeScript',
  "currentStage" INTEGER NOT NULL DEFAULT 1, "completedAt" DATETIME,
  CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Enrollment_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Enrollment_userId_challengeId_key" ON "Enrollment"("userId", "challengeId");
CREATE TABLE "Submission" (
  "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "stageId" TEXT NOT NULL, "commitSha" TEXT NOT NULL, "testOutput" TEXT NOT NULL,
  "passed" BOOLEAN NOT NULL DEFAULT false, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Submission_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ChallengeStage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "Benchmark" (
  "id" TEXT NOT NULL PRIMARY KEY, "enrollmentId" TEXT NOT NULL, "requestsPerSecond" REAL NOT NULL, "p99LatencyMs" REAL NOT NULL,
  "memoryMb" REAL NOT NULL, "verifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Benchmark_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "PeerReview" (
  "id" TEXT NOT NULL PRIMARY KEY, "enrollmentId" TEXT NOT NULL, "reviewerId" TEXT, "status" TEXT NOT NULL DEFAULT 'REQUESTED', "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PeerReview_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "Organization" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE TABLE "OrganizationMember" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "userId" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'LEARNER',
  CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY, "actorId" TEXT, "action" TEXT NOT NULL, "target" TEXT NOT NULL, "metadata" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
