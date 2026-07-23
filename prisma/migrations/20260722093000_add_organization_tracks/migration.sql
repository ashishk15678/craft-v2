-- Organization-owned onboarding tracks and optional organization-scoped challenges.
-- NOTE: organizationId column was already added in 20260722052453, so we only create TeamTrack here.
PRAGMA foreign_keys=OFF;
CREATE TABLE IF NOT EXISTS "TeamTrack" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "challengeId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "TeamTrack_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TeamTrack_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "TeamTrack_organizationId_idx" ON "TeamTrack"("organizationId");
CREATE INDEX IF NOT EXISTS "TeamTrack_challengeId_idx" ON "TeamTrack"("challengeId");
PRAGMA foreign_keys=ON;
