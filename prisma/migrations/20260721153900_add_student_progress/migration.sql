-- CreateTable
CREATE TABLE "student_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "activeChallenge" TEXT NOT NULL DEFAULT 'Build Your Own KV Store',
    "language" TEXT NOT NULL DEFAULT 'TypeScript',
    "currentStage" INTEGER NOT NULL DEFAULT 4,
    "totalStages" INTEGER NOT NULL DEFAULT 6,
    "hintsUsed" INTEGER NOT NULL DEFAULT 1,
    "peerReviewRequested" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Courses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Courses_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lessons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    CONSTRAINT "Lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user" (
    "id" TEXT NOT NULL,
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
INSERT INTO "new_user" ("createdAt", "displayUsername", "email", "emailVerified", "id", "image", "name", "updatedAt", "username") SELECT "createdAt", "displayUsername", "email", "emailVerified", "id", "image", "name", "updatedAt", "username" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_id_key" ON "user"("id");
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "student_progress_userId_key" ON "student_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Courses_id_key" ON "Courses"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Lessons_id_key" ON "Lessons"("id");
