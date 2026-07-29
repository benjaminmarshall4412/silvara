-- AlterTable
ALTER TABLE "OrderFulfillment" ADD COLUMN "hiddenAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "OrderFulfillment_hiddenAt_idx" ON "OrderFulfillment"("hiddenAt");
