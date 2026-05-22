/**
 * lib/outbound/core/outbound-control-state.ts
 *
 * DB-backed runtime controls for the outbound scheduler.
 *
 * The scheduler pause state is stored in the OutboundControlState singleton
 * table so that an OWNER can pause/resume without a redeploy.
 *
 * Server-only.
 */

import { prisma } from "@/lib/prisma.server";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OutboundControlSnapshot = {
  schedulerPaused: boolean;
  pausedReason: string | null;
  pausedById: string | null;
  pausedByEmail: string | null;
  pausedAt: Date | null;
  resumedAt: Date | null;
  updatedAt: Date;
};

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Returns the current outbound control state.
 * If the singleton row does not yet exist (new deployment), returns defaults.
 * Safe to call from the scheduler runner without holding a lock.
 */
export async function getOutboundControlState(): Promise<OutboundControlSnapshot> {
  try {
    const row = await prisma.outboundControlState.findUnique({
      where: { id: "singleton" },
    });
    if (!row) {
      return {
        schedulerPaused: false,
        pausedReason: null,
        pausedById: null,
        pausedByEmail: null,
        pausedAt: null,
        resumedAt: null,
        updatedAt: new Date(0),
      };
    }
    return {
      schedulerPaused: row.schedulerPaused,
      pausedReason: row.pausedReason,
      pausedById: row.pausedById,
      pausedByEmail: row.pausedByEmail,
      pausedAt: row.pausedAt,
      resumedAt: row.resumedAt,
      updatedAt: row.updatedAt,
    };
  } catch {
    // Fail-safe: if DB is unreachable, do not assume paused (return defaults)
    // Scheduler eligibility checks the env var too, so env-based pause still works
    return {
      schedulerPaused: false,
      pausedReason: null,
      pausedById: null,
      pausedByEmail: null,
      pausedAt: null,
      resumedAt: null,
      updatedAt: new Date(0),
    };
  }
}

/**
 * Returns true if the scheduler is paused via DB OR env var.
 * This is the authoritative pause check — use in eligibility, runner, cron.
 */
export async function isSchedulerPaused(): Promise<boolean> {
  if (process.env.OUTBOUND_SCHEDULER_PAUSED === "true") return true;
  const state = await getOutboundControlState();
  return state.schedulerPaused;
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Pause the scheduler via DB.
 * Creates the singleton row if it doesn't exist.
 */
export async function pauseScheduler(input: {
  reason?: string;
  actorId?: string | null;
  actorEmail?: string | null;
}): Promise<OutboundControlSnapshot> {
  const now = new Date();
  const row = await prisma.outboundControlState.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      schedulerPaused: true,
      pausedReason: input.reason ?? null,
      pausedById: input.actorId ?? null,
      pausedByEmail: input.actorEmail ?? null,
      pausedAt: now,
      resumedAt: null,
    },
    update: {
      schedulerPaused: true,
      pausedReason: input.reason ?? null,
      pausedById: input.actorId ?? null,
      pausedByEmail: input.actorEmail ?? null,
      pausedAt: now,
      resumedAt: null,
    },
  });
  return row as OutboundControlSnapshot;
}

/**
 * Resume the scheduler via DB.
 */
export async function resumeScheduler(input: {
  actorId?: string | null;
  actorEmail?: string | null;
}): Promise<OutboundControlSnapshot> {
  const now = new Date();
  const row = await prisma.outboundControlState.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      schedulerPaused: false,
      pausedReason: null,
      pausedById: null,
      pausedByEmail: null,
      pausedAt: null,
      resumedAt: now,
    },
    update: {
      schedulerPaused: false,
      pausedReason: null,
      resumedAt: now,
    },
  });
  return row as OutboundControlSnapshot;
}
