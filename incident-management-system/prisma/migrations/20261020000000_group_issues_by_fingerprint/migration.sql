ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "fingerprint" TEXT;
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "timesSeen" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Issue_projectId_fingerprint_idx"
  ON "Issue"("projectId", "fingerprint");

CREATE UNIQUE INDEX IF NOT EXISTS "Issue_projectId_fingerprint_active_key"
  ON "Issue"("projectId", "fingerprint")
  WHERE "deletedAt" IS NULL AND "fingerprint" IS NOT NULL;
