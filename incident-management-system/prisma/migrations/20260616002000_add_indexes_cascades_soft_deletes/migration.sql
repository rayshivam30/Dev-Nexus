-- AlterTable
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- DropForeignKey & Recreate with CASCADE
ALTER TABLE "Team" DROP CONSTRAINT IF EXISTS "Team_projectId_fkey";
ALTER TABLE "Team" ADD CONSTRAINT "Team_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Issue" DROP CONSTRAINT IF EXISTS "Issue_projectId_fkey";
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_orgId_idx" ON "User"("orgId");
CREATE INDEX IF NOT EXISTS "User_teamId_idx" ON "User"("teamId");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Project_orgId_idx" ON "Project"("orgId");
CREATE INDEX IF NOT EXISTS "Team_projectId_idx" ON "Team"("projectId");
CREATE INDEX IF NOT EXISTS "Issue_assignedToId_idx" ON "Issue"("assignedToId");
CREATE INDEX IF NOT EXISTS "Issue_teamId_idx" ON "Issue"("teamId");
CREATE INDEX IF NOT EXISTS "IssueActivity_issueId_createdAt_idx" ON "IssueActivity"("issueId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "IssueComment_issueId_createdAt_idx" ON "IssueComment"("issueId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Invite_email_projectId_key" ON "Invite"("email", "projectId");
