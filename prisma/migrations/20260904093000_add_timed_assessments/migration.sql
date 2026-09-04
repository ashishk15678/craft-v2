CREATE TABLE "Assessment" (
  "id" TEXT NOT NULL PRIMARY KEY, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL,
  "durationMin" INTEGER NOT NULL, "questionIds" TEXT NOT NULL, "rewardXp" INTEGER NOT NULL DEFAULT 150,
  "published" BOOLEAN NOT NULL DEFAULT true, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "Assessment_slug_key" ON "Assessment"("slug");
CREATE INDEX "Assessment_published_idx" ON "Assessment"("published");
CREATE TABLE "AssessmentAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "assessmentId" TEXT NOT NULL, "answers" TEXT NOT NULL DEFAULT '{}',
  "score" INTEGER, "submittedAt" DATETIME, "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "AssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AssessmentAttempt_userId_assessmentId_idx" ON "AssessmentAttempt"("userId", "assessmentId");
