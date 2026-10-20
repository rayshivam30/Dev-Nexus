CREATE TYPE "JobType" AS ENUM ('AI_ANALYZE', 'EMAIL', 'SLA_SWEEP');
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETE', 'FAILED');

CREATE TABLE "Job" (
  "id" TEXT NOT NULL,
  "type" "JobType" NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
  "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lockedAt" TIMESTAMP(3),
  "lockedBy" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Job_status_runAfter_idx" ON "Job"("status", "runAfter");
CREATE INDEX "Job_type_status_runAfter_idx" ON "Job"("type", "status", "runAfter");

INSERT INTO "Job" ("id", "type", "payload", "status", "runAfter", "attempts", "createdAt", "updatedAt")
SELECT 'job_' || md5(i."id" || ':ai'), 'AI_ANALYZE', jsonb_build_object('issueId', i."id"), 'PENDING', CURRENT_TIMESTAMP, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Issue" i
WHERE i."deletedAt" IS NULL AND i."logs"->>'aiJobStatus' = 'PENDING';
