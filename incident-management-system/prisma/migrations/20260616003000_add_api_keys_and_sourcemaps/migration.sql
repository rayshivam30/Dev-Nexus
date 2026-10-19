-- CreateTable
CREATE TABLE IF NOT EXISTS "ProjectApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SourceMap" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "release" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectApiKey_keyHash_key" ON "ProjectApiKey"("keyHash");
CREATE INDEX IF NOT EXISTS "ProjectApiKey_projectId_idx" ON "ProjectApiKey"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectApiKey_keyHash_idx" ON "ProjectApiKey"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SourceMap_projectId_release_filename_key" ON "SourceMap"("projectId", "release", "filename");
CREATE INDEX IF NOT EXISTS "SourceMap_projectId_release_idx" ON "SourceMap"("projectId", "release");

-- AddForeignKey
ALTER TABLE "ProjectApiKey" DROP CONSTRAINT IF EXISTS "ProjectApiKey_projectId_fkey";
ALTER TABLE "ProjectApiKey" ADD CONSTRAINT "ProjectApiKey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SourceMap" DROP CONSTRAINT IF EXISTS "SourceMap_projectId_fkey";
ALTER TABLE "SourceMap" ADD CONSTRAINT "SourceMap_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
