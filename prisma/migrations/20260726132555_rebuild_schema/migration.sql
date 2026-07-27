/*
  Warnings:

  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Benchmark` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Challenge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChallengeStage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Courses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Enrollment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lessons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Organization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrganizationMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PeerReview` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Submission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamTrack` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_progress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `displayUsername` on the `user` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Challenge_slug_key";

-- DropIndex
DROP INDEX "ChallengeStage_challengeId_position_key";

-- DropIndex
DROP INDEX "Enrollment_userId_challengeId_key";

-- DropIndex
DROP INDEX "Organization_joinToken_key";

-- DropIndex
DROP INDEX "Organization_slug_key";

-- DropIndex
DROP INDEX "OrganizationMember_organizationId_userId_key";

-- DropIndex
DROP INDEX "TeamTrack_challengeId_idx";

-- DropIndex
DROP INDEX "TeamTrack_organizationId_idx";

-- DropIndex
DROP INDEX "student_progress_userId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AuditLog";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Benchmark";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Challenge";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ChallengeStage";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Courses";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Enrollment";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Lessons";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Organization";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OrganizationMember";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PeerReview";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Submission";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TeamTrack";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "student_progress";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "joinToken" TEXT,
    "githubRepo" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "org_member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "org_member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "org_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "visibleToRoles" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "repoDir" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL DEFAULT '{}',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "repoPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lesson_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "enrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lesson_complete" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lesson_complete_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lesson_complete_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quiz_attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "answers" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quiz_attempt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "page" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT,
    "organizationId" TEXT,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '{}',
    "access" TEXT NOT NULL DEFAULT 'PRIVATE',
    "shareToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "page_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "page_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "page" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kanban_board" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    CONSTRAINT "kanban_board_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kanban_column" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "kanban_column_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "kanban_board" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kanban_card" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "columnId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "position" INTEGER NOT NULL,
    "assigneeId" TEXT,
    "dueDate" DATETIME,
    CONSTRAINT "kanban_card_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "kanban_column" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "kanban_card_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "badge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "user_badge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_badge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_badge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "username" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_user" ("createdAt", "email", "emailVerified", "id", "image", "name", "role", "updatedAt", "username") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "role", "updatedAt", "username" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organization_joinToken_key" ON "organization"("joinToken");

-- CreateIndex
CREATE UNIQUE INDEX "org_member_organizationId_userId_key" ON "org_member"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "course_organizationId_slug_key" ON "course"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_courseId_position_key" ON "lesson"("courseId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_userId_courseId_key" ON "enrollment"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_complete_enrollmentId_lessonId_key" ON "lesson_complete"("enrollmentId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "page_shareToken_key" ON "page"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "badge_name_key" ON "badge"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_badge_userId_badgeId_key" ON "user_badge"("userId", "badgeId");
