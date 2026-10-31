-- Add referralCode and referredById to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredById" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");

-- Create ReferralStatus enum
DO $$ BEGIN
  CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'credited', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create Referral table
CREATE TABLE IF NOT EXISTS "Referral" (
  "id"            TEXT NOT NULL,
  "referrerId"    TEXT NOT NULL,
  "referrerName"  TEXT NOT NULL,
  "referredId"    TEXT,
  "referredName"  TEXT,
  "referredEmail" TEXT,
  "referredPhone" TEXT,
  "partnerType"   TEXT,
  "status"        "ReferralStatus" NOT NULL DEFAULT 'pending',
  "rewardAmount"  DOUBLE PRECISION NOT NULL DEFAULT 150,
  "creditedAt"    TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);
