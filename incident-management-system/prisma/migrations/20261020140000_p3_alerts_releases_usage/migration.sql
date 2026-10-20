ALTER TABLE "Issue" ADD COLUMN "release" TEXT;
CREATE INDEX "Issue_projectId_release_createdAt_idx" ON "Issue"("projectId", "release", "createdAt" DESC);

CREATE TABLE "AlertPolicy" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "threshold" INTEGER NOT NULL,
    "windowMinutes" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AlertPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AlertTrigger" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlertTrigger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectDailyUsage" (
    "projectId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectDailyUsage_pkey" PRIMARY KEY ("projectId", "day")
);

CREATE INDEX "AlertPolicy_projectId_enabled_severity_idx" ON "AlertPolicy"("projectId", "enabled", "severity");
CREATE UNIQUE INDEX "AlertTrigger_policyId_issueId_windowStart_key" ON "AlertTrigger"("policyId", "issueId", "windowStart");
CREATE INDEX "AlertTrigger_issueId_createdAt_idx" ON "AlertTrigger"("issueId", "createdAt" DESC);
CREATE INDEX "ProjectDailyUsage_day_idx" ON "ProjectDailyUsage"("day");

ALTER TABLE "AlertPolicy" ADD CONSTRAINT "AlertPolicy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlertTrigger" ADD CONSTRAINT "AlertTrigger_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "AlertPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlertTrigger" ADD CONSTRAINT "AlertTrigger_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectDailyUsage" ADD CONSTRAINT "ProjectDailyUsage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
