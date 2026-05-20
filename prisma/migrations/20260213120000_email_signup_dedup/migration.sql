-- Deduplicate emails (keep oldest row per address) before unique constraint.
DELETE FROM "EmailSignup" a
USING "EmailSignup" b
WHERE lower(trim(a.email)) = lower(trim(b.email))
  AND a."createdAt" > b."createdAt";

-- Normalize email casing on survivors.
UPDATE "EmailSignup" SET email = lower(trim(email));

-- AlterTable
ALTER TABLE "EmailSignup" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "EmailSignup" ADD COLUMN "promoAutomationSentAt" TIMESTAMP(3);
ALTER TABLE "EmailSignup" ADD COLUMN "firstOrderAt" TIMESTAMP(3);

-- Treat existing signups as already welcomed (avoid re-firing on re-submit).
UPDATE "EmailSignup" SET "promoAutomationSentAt" = "createdAt" WHERE "promoAutomationSentAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EmailSignup_email_key" ON "EmailSignup"(email);

-- DropIndex (redundant with unique)
DROP INDEX IF EXISTS "EmailSignup_email_idx";

-- CreateIndex
CREATE INDEX "EmailSignup_firstOrderAt_idx" ON "EmailSignup"("firstOrderAt");
