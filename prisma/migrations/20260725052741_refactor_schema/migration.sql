/*
  Warnings:

  - You are about to drop the column `activeChallenge` on the `student_progress` table. All the data in the column will be lost.
  - You are about to drop the column `currentStage` on the `student_progress` table. All the data in the column will be lost.
  - You are about to drop the column `totalStages` on the `student_progress` table. All the data in the column will be lost.

*/
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
    "languages" TEXT NOT NULL DEFAULT 'typescript,python,go,rust,cpp,java',
    "dockerImage" TEXT,
    "starterRepo" TEXT,
    "repoDir" TEXT,
    "creatorId" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Challenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Challenge_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Challenge" ("access", "createdAt", "creatorId", "dockerImage", "id", "languages", "organizationId", "priceCents", "slug", "starterRepo", "status", "summary", "title", "track", "updatedAt") SELECT "access", "createdAt", "creatorId", "dockerImage", "id", "languages", "organizationId", "priceCents", "slug", "starterRepo", "status", "summary", "title", "track", "updatedAt" FROM "Challenge";
DROP TABLE "Challenge";
ALTER TABLE "new_Challenge" RENAME TO "Challenge";
CREATE UNIQUE INDEX "Challenge_slug_key" ON "Challenge"("slug");
CREATE TABLE "new_Courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Courses_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Courses" ("createdAt", "creatorId", "description", "id", "name", "updatedAt") SELECT "createdAt", "creatorId", "description", "id", "name", "updatedAt" FROM "Courses";
DROP TABLE "Courses";
ALTER TABLE "new_Courses" RENAME TO "Courses";
CREATE TABLE "new_Enrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'typescript',
    "currentStage" INTEGER NOT NULL DEFAULT 1,
    "completedAt" DATETIME,
    CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Enrollment_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Enrollment" ("challengeId", "completedAt", "currentStage", "id", "language", "userId") SELECT "challengeId", "completedAt", "currentStage", "id", "language", "userId" FROM "Enrollment";
DROP TABLE "Enrollment";
ALTER TABLE "new_Enrollment" RENAME TO "Enrollment";
CREATE UNIQUE INDEX "Enrollment_userId_challengeId_key" ON "Enrollment"("userId", "challengeId");
CREATE TABLE "new_Lessons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    CONSTRAINT "Lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Lessons" ("content", "courseId", "id", "name") SELECT "content", "courseId", "id", "name" FROM "Lessons";
DROP TABLE "Lessons";
ALTER TABLE "new_Lessons" RENAME TO "Lessons";
CREATE TABLE "new_Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visibility" TEXT NOT NULL DEFAULT 'OPEN',
    "joinToken" TEXT,
    "repoPath" TEXT
);
INSERT INTO "new_Organization" ("createdAt", "description", "id", "name", "ownerId", "slug") SELECT "createdAt", "description", "id", "name", "ownerId", "slug" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX "Organization_joinToken_key" ON "Organization"("joinToken");
CREATE TABLE "new_student_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "activeChallengeId" TEXT,
    "activeStage" INTEGER NOT NULL DEFAULT 1,
    "language" TEXT NOT NULL DEFAULT 'typescript',
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "peerReviewRequested" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_student_progress" ("createdAt", "hintsUsed", "id", "language", "peerReviewRequested", "updatedAt", "userId") SELECT "createdAt", "hintsUsed", "id", "language", "peerReviewRequested", "updatedAt", "userId" FROM "student_progress";
DROP TABLE "student_progress";
ALTER TABLE "new_student_progress" RENAME TO "student_progress";
CREATE UNIQUE INDEX "student_progress_userId_key" ON "student_progress"("userId");
CREATE TABLE "new_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "username" TEXT NOT NULL,
    "displayUsername" TEXT NOT NULL
);
INSERT INTO "new_user" ("createdAt", "displayUsername", "email", "emailVerified", "id", "image", "name", "role", "updatedAt", "username") SELECT "createdAt", "displayUsername", "email", "emailVerified", "id", "image", "name", "role", "updatedAt", "username" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
