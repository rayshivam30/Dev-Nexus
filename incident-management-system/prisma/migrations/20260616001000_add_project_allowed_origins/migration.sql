-- AlterTable
ALTER TABLE "Project"
ADD COLUMN "allowedOrigins" TEXT[] DEFAULT ARRAY[]::TEXT[];
