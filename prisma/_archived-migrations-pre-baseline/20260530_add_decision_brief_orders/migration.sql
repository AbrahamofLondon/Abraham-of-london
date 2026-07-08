-- Migration: add_decision_brief_orders
-- Creates the decision_brief_orders table for paid Decision Failure Brief transactions.

-- CreateTable
CREATE TABLE "decision_brief_orders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decisionSummary" TEXT,
    "decisionType" TEXT,
    "primaryFailurePoint" TEXT,
    "directive" TEXT,
    "sourceTest" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "verificationToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "decision_brief_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "decision_brief_orders_stripeCheckoutSessionId_key" ON "decision_brief_orders"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "decision_brief_orders_stripePaymentIntentId_key" ON "decision_brief_orders"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "decision_brief_orders_verificationToken_key" ON "decision_brief_orders"("verificationToken");

-- CreateIndex
CREATE INDEX "decision_brief_orders_email_idx" ON "decision_brief_orders"("email");

-- CreateIndex
CREATE INDEX "decision_brief_orders_status_idx" ON "decision_brief_orders"("status");

-- CreateIndex
CREATE INDEX "decision_brief_orders_tier_idx" ON "decision_brief_orders"("tier");

-- CreateIndex
CREATE INDEX "decision_brief_orders_createdAt_idx" ON "decision_brief_orders"("createdAt");