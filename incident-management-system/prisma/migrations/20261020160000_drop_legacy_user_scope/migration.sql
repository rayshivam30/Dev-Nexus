-- Preserve any legacy scope that was written after the initial membership
-- migration, then remove the duplicate source of authorization truth.
INSERT INTO "ProjectMembership" ("id", "userId", "projectId", "role", "createdAt", "updatedAt")
SELECT 'pm_' || md5(u."id" || ':' || COALESCE(u."projectId", t."projectId")),
       u."id", COALESCE(u."projectId", t."projectId"), u."role", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" u
LEFT JOIN "Team" t ON t."id" = u."teamId"
WHERE COALESCE(u."projectId", t."projectId") IS NOT NULL
ON CONFLICT ("userId", "projectId") DO NOTHING;

INSERT INTO "TeamMembership" ("id", "userId", "teamId", "role", "createdAt", "updatedAt")
SELECT 'tm_' || md5(u."id" || ':' || t."id"), u."id", t."id", u."role", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" u
JOIN "Team" t ON t."id" = u."teamId"
ON CONFLICT ("userId", "teamId") DO NOTHING;

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_projectId_fkey";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_teamId_fkey";
DROP INDEX IF EXISTS "User_teamId_idx";
ALTER TABLE "User" DROP COLUMN "projectId";
ALTER TABLE "User" DROP COLUMN "teamId";
