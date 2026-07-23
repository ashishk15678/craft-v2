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
    CONSTRAINT "Challenge_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Challenge" ("access", "createdAt", "creatorId", "dockerImage", "id", "languages", "organizationId", "priceCents", "slug", "starterRepo", "status", "summary", "title", "track", "updatedAt") SELECT "access", "createdAt", "creatorId", "dockerImage", "id", "languages", "organizationId", "priceCents", "slug", "starterRepo", "status", "summary", "title", "track", "updatedAt" FROM "Challenge";
DROP TABLE "Challenge";
ALTER TABLE "new_Challenge" RENAME TO "Challenge";
CREATE UNIQUE INDEX "Challenge_slug_key" ON "Challenge"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
