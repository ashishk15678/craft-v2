-- CreateTable
CREATE TABLE "topic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "topic_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "topic_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "topic_organizationId_idx" ON "topic"("organizationId");

-- CreateIndex
CREATE INDEX "topic_creatorId_idx" ON "topic"("creatorId");
