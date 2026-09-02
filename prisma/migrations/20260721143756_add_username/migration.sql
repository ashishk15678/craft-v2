/*
  Warnings:

  - Made the column `displayUsername` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `username` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
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
