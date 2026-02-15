-- CreateEnum
CREATE TYPE "public"."ProfileChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('IDENTITY', 'ADDRESS');

-- CreateEnum
CREATE TYPE "public"."LiquidationStatus" AS ENUM ('PENDING', 'PAID');

-- CreateTable
CREATE TABLE "public"."ProfileChangeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedEmail" TEXT,
    "requestedFullName" TEXT,
    "requestedPhone" TEXT,
    "status" "public"."ProfileChangeStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Consignor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "bankAccount" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consignor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LotConsignor" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "consignorId" TEXT NOT NULL,
    "agreedPrice" DECIMAL(12,2) NOT NULL,
    "liquidationStatus" "public"."LiquidationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "LotConsignor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BidderDocument" (
    "id" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "type" "public"."DocumentType" NOT NULL,
    "cloudinaryId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BidderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlackList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "bannedById" TEXT NOT NULL,
    "bannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auctionId" TEXT,

    CONSTRAINT "BlackList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileChangeRequest_status_createdAt_idx" ON "public"."ProfileChangeRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ProfileChangeRequest_userId_status_idx" ON "public"."ProfileChangeRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "Consignor_userId_idx" ON "public"."Consignor"("userId");

-- CreateIndex
CREATE INDEX "LotConsignor_consignorId_idx" ON "public"."LotConsignor"("consignorId");

-- CreateIndex
CREATE UNIQUE INDEX "LotConsignor_lotId_consignorId_key" ON "public"."LotConsignor"("lotId", "consignorId");

-- CreateIndex
CREATE INDEX "BidderDocument_bidderId_type_idx" ON "public"."BidderDocument"("bidderId", "type");

-- CreateIndex
CREATE INDEX "BlackList_userId_auctionId_idx" ON "public"."BlackList"("userId", "auctionId");

-- CreateIndex
CREATE INDEX "BlackList_bannedAt_idx" ON "public"."BlackList"("bannedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_sentAt_idx" ON "public"."Notification"("userId", "sentAt");

-- AddForeignKey
ALTER TABLE "public"."ProfileChangeRequest" ADD CONSTRAINT "ProfileChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfileChangeRequest" ADD CONSTRAINT "ProfileChangeRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Consignor" ADD CONSTRAINT "Consignor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LotConsignor" ADD CONSTRAINT "LotConsignor_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "public"."Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LotConsignor" ADD CONSTRAINT "LotConsignor_consignorId_fkey" FOREIGN KEY ("consignorId") REFERENCES "public"."Consignor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BidderDocument" ADD CONSTRAINT "BidderDocument_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "public"."Bidder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlackList" ADD CONSTRAINT "BlackList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlackList" ADD CONSTRAINT "BlackList_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlackList" ADD CONSTRAINT "BlackList_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "public"."Auction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
