-- Cleanup previous bootstrap table
DROP TABLE IF EXISTS "public"."SeedMarker" CASCADE;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPERADMIN', 'ADMIN', 'AUCTIONEER', 'CONSIGNOR', 'BIDDER');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "public"."AuctionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'LIVE', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."LotStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ACTIVE', 'ADJUDICATED', 'UNSOLD');

-- CreateEnum
CREATE TYPE "public"."BidderStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'BANNED');

-- CreateEnum
CREATE TYPE "public"."BidSource" AS ENUM ('ONLINE', 'PRESENCIAL');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'OVERDUE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "fullName" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "phone" TEXT,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Auction" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."AuctionStatus" NOT NULL DEFAULT 'DRAFT',
    "commissionPct" DECIMAL(5,2) NOT NULL,
    "terms" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lot" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "minIncrement" DECIMAL(12,2) NOT NULL,
    "currentPrice" DECIMAL(12,2) NOT NULL,
    "status" "public"."LotStatus" NOT NULL DEFAULT 'DRAFT',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "winnerBidderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bidder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "paddleNumber" INTEGER NOT NULL,
    "status" "public"."BidderStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bidder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bid" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "source" "public"."BidSource" NOT NULL,
    "ipAddr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Adjudication" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "winningBidId" TEXT NOT NULL,
    "adjudicatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adjudicatedById" TEXT NOT NULL,
    "finalPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "Adjudication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "adjudicationId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "commission" DECIMAL(12,2) NOT NULL,
    "tax" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "providerRef" TEXT,
    "providerData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Auction_status_idx" ON "public"."Auction"("status");

-- CreateIndex
CREATE INDEX "Auction_startAt_idx" ON "public"."Auction"("startAt");

-- CreateIndex
CREATE INDEX "Lot_auctionId_idx" ON "public"."Lot"("auctionId");

-- CreateIndex
CREATE INDEX "Lot_winnerBidderId_idx" ON "public"."Lot"("winnerBidderId");

-- CreateIndex
CREATE INDEX "Bidder_auctionId_status_idx" ON "public"."Bidder"("auctionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Bidder_auctionId_paddleNumber_key" ON "public"."Bidder"("auctionId", "paddleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Bidder_userId_auctionId_key" ON "public"."Bidder"("userId", "auctionId");

-- CreateIndex
CREATE INDEX "Bid_lotId_createdAt_idx" ON "public"."Bid"("lotId", "createdAt");

-- CreateIndex
CREATE INDEX "Bid_bidderId_createdAt_idx" ON "public"."Bid"("bidderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Adjudication_lotId_key" ON "public"."Adjudication"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "Adjudication_winningBidId_key" ON "public"."Adjudication"("winningBidId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_adjudicationId_key" ON "public"."Payment"("adjudicationId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "public"."AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Auction" ADD CONSTRAINT "Auction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lot" ADD CONSTRAINT "Lot_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "public"."Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lot" ADD CONSTRAINT "Lot_winnerBidderId_fkey" FOREIGN KEY ("winnerBidderId") REFERENCES "public"."Bidder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bidder" ADD CONSTRAINT "Bidder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bidder" ADD CONSTRAINT "Bidder_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "public"."Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bidder" ADD CONSTRAINT "Bidder_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bid" ADD CONSTRAINT "Bid_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "public"."Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bid" ADD CONSTRAINT "Bid_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "public"."Bidder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Adjudication" ADD CONSTRAINT "Adjudication_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "public"."Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Adjudication" ADD CONSTRAINT "Adjudication_winningBidId_fkey" FOREIGN KEY ("winningBidId") REFERENCES "public"."Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Adjudication" ADD CONSTRAINT "Adjudication_adjudicatedById_fkey" FOREIGN KEY ("adjudicatedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_adjudicationId_fkey" FOREIGN KEY ("adjudicationId") REFERENCES "public"."Adjudication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

