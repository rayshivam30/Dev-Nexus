CREATE TABLE "OnCallRotation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "shiftDurationHours" INTEGER NOT NULL DEFAULT 24,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnCallRotation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OnCallRotationMember" (
    "id" TEXT NOT NULL,
    "rotationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "OnCallRotationMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OnCallRotation_projectId_key" ON "OnCallRotation"("projectId");
CREATE UNIQUE INDEX "OnCallRotationMember_rotationId_userId_key" ON "OnCallRotationMember"("rotationId", "userId");
CREATE UNIQUE INDEX "OnCallRotationMember_rotationId_position_key" ON "OnCallRotationMember"("rotationId", "position");
CREATE INDEX "OnCallRotationMember_userId_idx" ON "OnCallRotationMember"("userId");

ALTER TABLE "OnCallRotation" ADD CONSTRAINT "OnCallRotation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OnCallRotationMember" ADD CONSTRAINT "OnCallRotationMember_rotationId_fkey" FOREIGN KEY ("rotationId") REFERENCES "OnCallRotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OnCallRotationMember" ADD CONSTRAINT "OnCallRotationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
