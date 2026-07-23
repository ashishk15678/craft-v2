-- Add ORG_MANAGER to the ROLE enum (SQLite: just add col to user table if needed, enum is enforced at app level)
-- Add description and ownerId to Organization
ALTER TABLE "organization" ADD COLUMN "description" TEXT;
ALTER TABLE "organization" ADD COLUMN "ownerId" TEXT;

-- Add joinedAt to OrganizationMember
ALTER TABLE "OrganizationMember" ADD COLUMN "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
