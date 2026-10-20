CREATE TYPE "RoutingMatchType" AS ENUM ('TAG', 'SEVERITY', 'PATH_PREFIX', 'MESSAGE_CONTAINS');

CREATE TABLE "RoutingRule" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "targetTeamId" TEXT NOT NULL,
  "matchType" "RoutingMatchType" NOT NULL,
  "matchValue" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RoutingRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RoutingRule_projectId_enabled_createdAt_idx" ON "RoutingRule"("projectId", "enabled", "createdAt");
CREATE INDEX "RoutingRule_targetTeamId_idx" ON "RoutingRule"("targetTeamId");
ALTER TABLE "RoutingRule" ADD CONSTRAINT "RoutingRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoutingRule" ADD CONSTRAINT "RoutingRule_targetTeamId_fkey" FOREIGN KEY ("targetTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
