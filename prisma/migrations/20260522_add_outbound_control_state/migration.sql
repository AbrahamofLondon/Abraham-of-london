-- Migration: 20260522_add_outbound_control_state
-- Add OutboundControlState table for DB-backed scheduler pause
-- (single-row singleton, id = 'singleton')

CREATE TABLE IF NOT EXISTS "outbound_control_state" (
    "id"              TEXT NOT NULL DEFAULT 'singleton',
    "schedulerPaused" BOOLEAN NOT NULL DEFAULT false,
    "pausedReason"    TEXT,
    "pausedById"      TEXT,
    "pausedByEmail"   TEXT,
    "pausedAt"        TIMESTAMP(3),
    "resumedAt"       TIMESTAMP(3),
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbound_control_state_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton row so reads never return null
INSERT INTO "outbound_control_state" ("id", "schedulerPaused", "updatedAt", "createdAt")
VALUES ('singleton', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
