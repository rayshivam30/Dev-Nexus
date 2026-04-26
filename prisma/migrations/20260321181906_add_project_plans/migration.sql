/*
  Warnings:

  - A unique constraint covering the columns `[sdkApiKey]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PlanType" ADD VALUE 'ADVANCED';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "githubInstallationId" TEXT,
ADD COLUMN     "githubRepoUrl" TEXT,
ADD COLUMN     "plan" "PlanType" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "sdkApiKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_sdkApiKey_key" ON "Project"("sdkApiKey");
