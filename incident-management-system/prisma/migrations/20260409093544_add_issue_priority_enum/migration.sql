/*
  Warnings:

  - The `priority` column on the `Issue` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "IssuePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "Issue" DROP COLUMN "priority",
ADD COLUMN     "priority" "IssuePriority" DEFAULT 'MEDIUM';
