// lib/auth/lifecycle.ts — MEMBER LIFECYCLE STATE MACHINE
// (auth-migration/03-state-machine.md)
//
// Defines valid transitions between member statuses and the actions
// that trigger them. Used by admin operations, key redemption, and
// session resolution.

import type { MemberLifecycle } from "./resolve-identity";

/* -------------------------------------------------------------------------- */
/*  VALID TRANSITIONS                                                          */
/* -------------------------------------------------------------------------- */

const VALID_TRANSITIONS: Record<
  MemberLifecycle,
  MemberLifecycle[]
> = {
  invited: ["active", "suspended"],
  active: ["expired", "suspended"],
  expired: ["active", "suspended"],
  suspended: ["active"], // reinstatement by admin only
};

/**
 * Check if a transition from one status to another is valid.
 */
export function isValidTransition(
  from: MemberLifecycle,
  to: MemberLifecycle,
): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to);
}

/* -------------------------------------------------------------------------- */
/*  TRANSITION ACTIONS                                                         */
/* -------------------------------------------------------------------------- */

type TransitionResult = {
  ok: boolean;
  newStatus: MemberLifecycle;
  actions: string[]; // descriptions of side effects performed
  error?: string;
};

/**
 * Transition a member to a new lifecycle status. Performs side effects:
 * - active → suspended: revoke all sessions + keys
 * - active → expired: revoke all sessions
 * - * → active: no automatic session issuance (caller handles)
 *
 * The caller (admin API, cron job, etc.) is responsible for persisting
 * the new status to the database after this function validates the
 * transition.
 */
export async function transitionMember(
  memberId: string,
  from: MemberLifecycle,
  to: MemberLifecycle,
): Promise<TransitionResult> {
  if (!isValidTransition(from, to)) {
    return {
      ok: false,
      newStatus: from,
      actions: [],
      error: `Invalid transition: ${from} → ${to}`,
    };
  }

  const actions: string[] = [];

  // Side effects
  if (to === "suspended") {
    await invalidateAllSessions(memberId);
    actions.push("revoked all active sessions");
    await revokeAllKeys(memberId);
    actions.push("revoked all active keys");
  }

  if (to === "expired") {
    await invalidateAllSessions(memberId);
    actions.push("revoked all active sessions");
  }

  return { ok: true, newStatus: to, actions };
}

/**
 * Invalidate all active sessions for a member. Used on:
 * - suspension
 * - expiry
 * - tier downgrade
 * - explicit revocation
 */
export async function invalidateAllSessions(
  memberId: string,
): Promise<number> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const result = await (prisma as any).session?.updateMany?.({
      where: {
        memberId,
        status: "active",
      },
      data: {
        status: "revoked",
      },
    });
    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Revoke all active keys for a member.
 */
async function revokeAllKeys(memberId: string): Promise<number> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const result = await (prisma as any).innerCircleKey?.updateMany?.({
      where: {
        memberId,
        status: "active",
      },
      data: {
        status: "revoked",
      },
    });
    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Handle tier downgrade: invalidate all sessions so the member must
 * re-authenticate at the new tier level.
 */
export async function handleTierDowngrade(
  memberId: string,
  _oldTier: string,
  _newTier: string,
): Promise<{ sessionsRevoked: number }> {
  const count = await invalidateAllSessions(memberId);
  return { sessionsRevoked: count };
}
