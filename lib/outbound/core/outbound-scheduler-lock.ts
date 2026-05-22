/**
 * lib/outbound/core/outbound-scheduler-lock.ts
 *
 * Distributed scheduler lock to prevent duplicate concurrent scheduler runs.
 *
 * Uses the SchedulerLock table in Postgres.
 * Stale locks expire after LOCK_TIMEOUT_MS (default 5 minutes).
 *
 * Server-only.
 */

import { prisma } from "@/lib/prisma.server";
import crypto from "crypto";

// ─── Constants ────────────────────────────────────────────────────────────────

const LOCK_KEY = "outbound-scheduler";
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ─── Types ────────────────────────────────────────────────────────────────────

export type SchedulerLockResult = {
  acquired: boolean;
  lockId?: string;
  expiresAt?: Date;
  reason?: string;
};

// ─── Lock operations ──────────────────────────────────────────────────────────

/**
 * Try to acquire the scheduler lock.
 *
 * If no lock exists, creates one.
 * If a lock exists but is expired, deletes it and creates a new one.
 * If a lock exists and is not expired, returns acquired=false.
 */
export async function acquireSchedulerLock(
  holder?: string,
): Promise<SchedulerLockResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_TIMEOUT_MS);
  const hostname = holder ?? (process.env.HOSTNAME || `pid-${process.pid}`);

  try {
    // Try to find existing lock
    const existing = await prisma.schedulerLock.findUnique({
      where: { lockKey: LOCK_KEY },
    });

    if (existing) {
      // Check if expired
      if (existing.expiresAt < now) {
        // Stale lock — delete and re-acquire
        await prisma.schedulerLock.delete({
          where: { lockKey: LOCK_KEY },
        });
      } else {
        // Lock is still valid — cannot acquire
        return {
          acquired: false,
          lockId: existing.id,
          expiresAt: existing.expiresAt,
          reason: `Scheduler lock is held by ${existing.holder ?? "unknown"} until ${existing.expiresAt.toISOString()}.`,
        };
      }
    }

    // Create new lock
    const lock = await prisma.schedulerLock.create({
      data: {
        lockKey: LOCK_KEY,
        lockedAt: now,
        expiresAt,
        holder: hostname,
        metadata: JSON.stringify({
          acquiredAt: now.toISOString(),
          hostname,
          pid: process.pid,
        }),
      },
    });

    return {
      acquired: true,
      lockId: lock.id,
      expiresAt: lock.expiresAt,
    };
  } catch (err) {
    return {
      acquired: false,
      reason: `Failed to acquire scheduler lock: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Release the scheduler lock.
 * Should be called after the scheduler run completes (success or failure).
 */
export async function releaseSchedulerLock(): Promise<void> {
  try {
    await prisma.schedulerLock.deleteMany({
      where: { lockKey: LOCK_KEY },
    });
  } catch {
    // Best-effort release — lock will expire naturally
  }
}

/**
 * Check if the scheduler lock is currently held (by any holder).
 */
export async function isSchedulerLocked(): Promise<boolean> {
  try {
    const existing = await prisma.schedulerLock.findUnique({
      where: { lockKey: LOCK_KEY },
    });
    if (!existing) return false;
    if (existing.expiresAt < new Date()) {
      // Stale lock — clean up
      await prisma.schedulerLock.delete({
        where: { lockKey: LOCK_KEY },
      });
      return false;
    }
    return true;
  } catch {
    return false; // Fail open on error — better to risk duplicate than block entirely
  }
}

/**
 * Get current lock info (for admin UI).
 */
export async function getSchedulerLockInfo(): Promise<{
  locked: boolean;
  holder: string | null;
  lockedAt: string | null;
  expiresAt: string | null;
}> {
  try {
    const existing = await prisma.schedulerLock.findUnique({
      where: { lockKey: LOCK_KEY },
    });
    if (!existing || existing.expiresAt < new Date()) {
      if (existing) {
        // Clean up stale lock
        await prisma.schedulerLock.delete({
          where: { lockKey: LOCK_KEY },
        });
      }
      return { locked: false, holder: null, lockedAt: null, expiresAt: null };
    }
    return {
      locked: true,
      holder: existing.holder,
      lockedAt: existing.lockedAt.toISOString(),
      expiresAt: existing.expiresAt.toISOString(),
    };
  } catch {
    return { locked: false, holder: null, lockedAt: null, expiresAt: null };
  }
}

/**
 * Generate a unique run key for a scheduler run.
 */
export function generateRunKey(): string {
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(4).toString("hex");
  return `sched_${ts}_${rand}`;
}
