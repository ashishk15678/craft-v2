CREATE TABLE "PracticeChallenge" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "hint" TEXT NOT NULL,
  "solution" TEXT NOT NULL,
  "interaction" TEXT NOT NULL,
  "rewardXp" INTEGER NOT NULL DEFAULT 100,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "PracticeChallenge_slug_key" ON "PracticeChallenge"("slug");
CREATE INDEX "PracticeChallenge_category_difficulty_idx" ON "PracticeChallenge"("category", "difficulty");
CREATE INDEX "PracticeChallenge_published_idx" ON "PracticeChallenge"("published");

CREATE TABLE "PracticeProgress" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "answer" TEXT,
  "solutionRevealed" BOOLEAN NOT NULL DEFAULT false,
  "xpEarned" INTEGER NOT NULL DEFAULT 0,
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "PracticeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PracticeProgress_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "PracticeChallenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PracticeProgress_userId_challengeId_key" ON "PracticeProgress"("userId", "challengeId");
CREATE INDEX "PracticeProgress_userId_status_idx" ON "PracticeProgress"("userId", "status");

CREATE TABLE "RewardProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "level" INTEGER NOT NULL DEFAULT 1,
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "longestStreak" INTEGER NOT NULL DEFAULT 0,
  "completedCount" INTEGER NOT NULL DEFAULT 0,
  "lastActiveAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "RewardProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RewardProfile_userId_key" ON "RewardProfile"("userId");
