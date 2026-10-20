CREATE TABLE "ProjectMembership" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeamMembership" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectMembership_userId_projectId_key" ON "ProjectMembership"("userId", "projectId");
CREATE INDEX "ProjectMembership_projectId_role_idx" ON "ProjectMembership"("projectId", "role");
CREATE UNIQUE INDEX "TeamMembership_userId_teamId_key" ON "TeamMembership"("userId", "teamId");
CREATE INDEX "TeamMembership_teamId_role_idx" ON "TeamMembership"("teamId", "role");

ALTER TABLE "ProjectMembership" ADD CONSTRAINT "ProjectMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectMembership" ADD CONSTRAINT "ProjectMembership_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ProjectMembership" ("id", "userId", "projectId", "role", "createdAt", "updatedAt")
SELECT 'pm_' || md5(u."id" || ':' || COALESCE(u."projectId", t."projectId")), u."id", COALESCE(u."projectId", t."projectId"), u."role", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" u
LEFT JOIN "Team" t ON t."id" = u."teamId"
WHERE COALESCE(u."projectId", t."projectId") IS NOT NULL
ON CONFLICT ("userId", "projectId") DO NOTHING;

INSERT INTO "TeamMembership" ("id", "userId", "teamId", "role", "createdAt", "updatedAt")
SELECT 'tm_' || md5(u."id" || ':' || t."id"), u."id", t."id", u."role", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" u
JOIN "Team" t ON t."id" = u."teamId"
ON CONFLICT ("userId", "teamId") DO NOTHING;
