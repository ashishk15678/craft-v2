/*
  Warnings:

  - You are about to drop the `Organization` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Organization_slug_key";

-- AlterTable
ALTER TABLE "session" ADD COLUMN "activeOrganizationId" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Organization";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logo" TEXT,
    "metadata" TEXT
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" DATETIME NOT NULL,
    CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviterId" TEXT NOT NULL,
    CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "access" TEXT NOT NULL DEFAULT 'OPEN',
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "languages" TEXT NOT NULL DEFAULT 'TypeScript,Python,Go,Rust,C++,Java',
    "dockerImage" TEXT,
    "starterRepo" TEXT,
    "creatorId" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Challenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Challenge_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Challenge" ("access", "createdAt", "creatorId", "dockerImage", "id", "languages", "organizationId", "priceCents", "slug", "starterRepo", "status", "summary", "title", "track", "updatedAt") SELECT "access", "createdAt", "creatorId", "dockerImage", "id", "languages", "organizationId", "priceCents", "slug", "starterRepo", "status", "summary", "title", "track", "updatedAt" FROM "Challenge";
DROP TABLE "Challenge";
ALTER TABLE "new_Challenge" RENAME TO "Challenge";
CREATE UNIQUE INDEX "Challenge_slug_key" ON "Challenge"("slug");
CREATE TABLE "new_OrganizationMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'LEARNER',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrganizationMember" ("id", "joinedAt", "organizationId", "role", "userId") SELECT "id", "joinedAt", "organizationId", "role", "userId" FROM "OrganizationMember";
DROP TABLE "OrganizationMember";
ALTER TABLE "new_OrganizationMember" RENAME TO "OrganizationMember";
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");
CREATE TABLE "new_TeamTrack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "challengeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamTrack_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamTrack_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TeamTrack" ("challengeId", "createdAt", "createdById", "description", "id", "organizationId", "title", "updatedAt") SELECT "challengeId", "createdAt", "createdById", "description", "id", "organizationId", "title", "updatedAt" FROM "TeamTrack";
DROP TABLE "TeamTrack";
ALTER TABLE "new_TeamTrack" RENAME TO "TeamTrack";
CREATE INDEX "TeamTrack_organizationId_idx" ON "TeamTrack"("organizationId");
CREATE INDEX "TeamTrack_challengeId_idx" ON "TeamTrack"("challengeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "member"("organizationId");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "invitation"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitation"("email");
