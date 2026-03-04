-- Add emailHash to StrategyIntake
ALTER TABLE "strategy_intakes" ADD COLUMN IF NOT EXISTS "emailHash" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "strategy_intakes_emailHash_idx" ON "strategy_intakes"("emailHash");
