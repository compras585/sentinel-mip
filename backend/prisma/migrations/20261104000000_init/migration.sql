-- Initial schema migration for Sentinel MIP.
-- RefreshSession is intentionally excluded: it is created by the existing
-- 20261104000000_refresh_sessions migration that runs immediately afterward.

CREATE TYPE "UserRole" AS ENUM (
  'ADMIN',
  'TECHNICIAN',
  'CLIENT',
  'HIGH_MANAGEMENT',
  'QUALITY',
  'OPERATIONS_MANAGEMENT',
  'MARKETING_MANAGEMENT'
);

CREATE TYPE "InspectionStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'REVIEWED'
);

CREATE TYPE "FindingStatus" AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'PENDING_VERIFICATION',
  'CLOSED'
);

CREATE TABLE "Tenant" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" UUID NOT NULL,
  "tenantId" UUID,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Establishment" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Establishment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Station" (
  "id" UUID NOT NULL,
  "establishmentId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "location" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Inspection" (
  "id" UUID NOT NULL,
  "stationId" UUID NOT NULL,
  "technicianId" UUID NOT NULL,
  "clientMutationId" TEXT NOT NULL,
  "pestType" TEXT NOT NULL,
  "activity" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "stationCondition" TEXT,
  "actionsTaken" TEXT,
  "observations" TEXT,
  "status" "InspectionStatus" NOT NULL DEFAULT 'SUBMITTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CorrectiveAction" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "finding" TEXT NOT NULL,
  "rootCause" TEXT,
  "actionPlan" TEXT NOT NULL,
  "ownerUserId" UUID,
  "dueDate" TIMESTAMP(3),
  "status" "FindingStatus" NOT NULL DEFAULT 'OPEN',
  "effectiveness" TEXT,
  "verifiedById" UUID,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CorrectiveAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Certificate" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "establishmentId" UUID NOT NULL,
  "certificateNo" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "issuedById" UUID,
  "issuedAt" TIMESTAMP(3),
  "documentHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Establishment_code_key" ON "Establishment"("code");
CREATE UNIQUE INDEX "Station_code_key" ON "Station"("code");
CREATE UNIQUE INDEX "Inspection_technicianId_clientMutationId_key"
  ON "Inspection"("technicianId", "clientMutationId");
CREATE INDEX "Inspection_stationId_createdAt_idx"
  ON "Inspection"("stationId", "createdAt");
CREATE UNIQUE INDEX "Certificate_certificateNo_key"
  ON "Certificate"("certificateNo");

ALTER TABLE "User"
  ADD CONSTRAINT "User_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Establishment"
  ADD CONSTRAINT "Establishment_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Station"
  ADD CONSTRAINT "Station_establishmentId_fkey"
  FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Inspection"
  ADD CONSTRAINT "Inspection_stationId_fkey"
  FOREIGN KEY ("stationId") REFERENCES "Station"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Inspection"
  ADD CONSTRAINT "Inspection_technicianId_fkey"
  FOREIGN KEY ("technicianId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
