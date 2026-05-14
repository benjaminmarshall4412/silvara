-- CreateTable
CREATE TABLE "EmailSignup" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "region" VARCHAR(8) NOT NULL,
    "pathname" VARCHAR(1024) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailSignup_createdAt_idx" ON "EmailSignup"("createdAt");

-- CreateIndex
CREATE INDEX "EmailSignup_region_idx" ON "EmailSignup"("region");

-- CreateIndex
CREATE INDEX "EmailSignup_email_idx" ON "EmailSignup"("email");
