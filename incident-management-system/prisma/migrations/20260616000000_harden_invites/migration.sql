-- AlterTable
ALTER TABLE "Invite"
ADD COLUMN "orgId" TEXT,
ADD COLUMN "teamId" TEXT,
ADD COLUMN "acceptedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Invite_email_projectId_idx" ON "Invite"("email", "projectId");
