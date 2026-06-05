-- Migration: add_boardroom_brief_order_handoff
-- Adds BoardroomBriefOrder and BoardroomBridgeHandoff tables
-- for the Boardroom Brief payment-to-delivery loop.

BEGIN TRANSACTION;

-- Boardroom Brief Orders
CREATE TABLE "boardroom_brief_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "diagnostic_id" TEXT,
    "handoff_id" TEXT,
    "stripe_session_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "delivery_status" TEXT NOT NULL DEFAULT 'requested',
    "source" TEXT NOT NULL DEFAULT 'inner_circle',
    "risk_level" TEXT,
    "score" INTEGER,
    "metadata_json" JSONB,
    "delivered_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boardroom_brief_orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "boardroom_brief_orders_stripe_session_id_key" UNIQUE ("stripe_session_id")
);

CREATE INDEX "boardroom_brief_orders_user_id_idx" ON "boardroom_brief_orders" ("user_id");
CREATE INDEX "boardroom_brief_orders_payment_status_idx" ON "boardroom_brief_orders" ("payment_status");
CREATE INDEX "boardroom_brief_orders_delivery_status_idx" ON "boardroom_brief_orders" ("delivery_status");

-- Boardroom Bridge Handoffs (safe redirect records)
CREATE TABLE "boardroom_bridge_handoffs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "diagnostic_id" TEXT,
    "risk_level" TEXT,
    "recommended_route" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boardroom_bridge_handoffs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "boardroom_bridge_handoffs_user_id_idx" ON "boardroom_bridge_handoffs" ("user_id");
CREATE INDEX "boardroom_bridge_handoffs_expires_at_idx" ON "boardroom_bridge_handoffs" ("expires_at");

COMMIT;
