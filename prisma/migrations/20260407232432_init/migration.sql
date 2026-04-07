-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "FundingSource" AS ENUM ('SELF', 'ESCROW');

-- CreateTable
CREATE TABLE "Eulogy" (
    "id" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "imageCid" TEXT,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "dateOfPassing" TIMESTAMP(3),
    "relationship" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "contentPreview" TEXT,
    "creatorAddress" TEXT NOT NULL,
    "fundedBy" "FundingSource" NOT NULL DEFAULT 'SELF',
    "moderation" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "moderationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Eulogy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowContribution" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "displayName" TEXT,
    "ai3Amount" TEXT NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscrowContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowDrawdown" (
    "id" TEXT NOT NULL,
    "eulogyId" TEXT NOT NULL,
    "creditAmount" INTEGER NOT NULL,
    "ai3Equivalent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscrowDrawdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eulogyDraftId" TEXT,
    "exchangeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Eulogy_cid_key" ON "Eulogy"("cid");

-- CreateIndex
CREATE INDEX "Eulogy_visibility_moderation_idx" ON "Eulogy"("visibility", "moderation");

-- CreateIndex
CREATE INDEX "Eulogy_creatorAddress_idx" ON "Eulogy"("creatorAddress");

-- CreateIndex
CREATE INDEX "Eulogy_name_idx" ON "Eulogy"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowContribution_txHash_key" ON "EscrowContribution"("txHash");

-- CreateIndex
CREATE INDEX "EscrowContribution_walletAddress_idx" ON "EscrowContribution"("walletAddress");

-- CreateIndex
CREATE INDEX "EscrowDrawdown_eulogyId_idx" ON "EscrowDrawdown"("eulogyId");

-- CreateIndex
CREATE INDEX "AssistantSession_userId_createdAt_idx" ON "AssistantSession"("userId", "createdAt");
