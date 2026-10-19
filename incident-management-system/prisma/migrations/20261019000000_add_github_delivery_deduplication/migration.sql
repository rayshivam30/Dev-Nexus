ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "githubDeliveryId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Issue_githubDeliveryId_key"
  ON "Issue"("githubDeliveryId");
