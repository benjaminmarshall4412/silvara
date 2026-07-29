-- CreateTable
CREATE TABLE "OrderFulfillment" (
    "sessionId" VARCHAR(255) NOT NULL,
    "region" VARCHAR(8) NOT NULL,
    "packedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderFulfillment_pkey" PRIMARY KEY ("sessionId")
);

-- CreateIndex
CREATE INDEX "OrderFulfillment_packedAt_idx" ON "OrderFulfillment"("packedAt");

-- CreateIndex
CREATE INDEX "OrderFulfillment_region_idx" ON "OrderFulfillment"("region");
