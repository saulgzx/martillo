-- CreateTable
CREATE TABLE "public"."LotMedia" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "cloudinaryId" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LotMedia_lotId_orderIndex_idx" ON "public"."LotMedia"("lotId", "orderIndex");

-- AddForeignKey
ALTER TABLE "public"."LotMedia" ADD CONSTRAINT "LotMedia_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "public"."Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
