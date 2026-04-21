/**
 * lib/strategy-room/execution-feedback.ts
 *
 * Feedback loop: when decisions are logged or updated in a Strategy Room
 * execution session, this module propagates changes to:
 *  - tension thread (via monitoring snapshot)
 *  - trajectory inference
 *  - decision journey events
 *
 * This creates live operating system behaviour.
 */

import { prisma } from "@/lib/prisma.server";
import { recordJourneyEvent } from "@/lib/analytics/decision-journey";

type DecisionSnapshot = {
  total: number;
  pending: number;
  executed: number;
  blocked: number;
};

/**
 * Called after any decision log change in an execution session.
 * Updates the monitoring snapshot and records journey events.
 */
export async function propagateDecisionChange(
  sessionId: string,
  action: "created" | "status_changed",
  decisionId: string,
): Promise<void> {
  try {
    // 1. Load session with all decisions
    const session = await prisma.strategyRoomExecutionSession.findUnique({
      where: { id: sessionId },
      include: { decisions: true },
    });
    if (!session) return;

    // 2. Calculate decision snapshot
    const snapshot: DecisionSnapshot = {
      total: session.decisions.length,
      pending: session.decisions.filter((d) => d.status === "pending").length,
      executed: session.decisions.filter((d) => d.status === "executed").length,
      blocked: session.decisions.filter((d) => d.status === "blocked").length,
    };

    // 3. Derive execution trajectory from decision state
    const executionRate = snapshot.total > 0 ? snapshot.executed / snapshot.total : 0;
    const blockRate = snapshot.total > 0 ? snapshot.blocked / snapshot.total : 0;

    let trajectory: "ASCENDING" | "STAGNANT" | "FRAGILE" | "DETERIORATING";
    if (executionRate > 0.6) trajectory = "ASCENDING";
    else if (blockRate > 0.4) trajectory = "DETERIORATING";
    else if (executionRate > 0.3) trajectory = "STAGNANT";
    else trajectory = "FRAGILE";

    // 4. Update session's canonical snapshot with execution state
    let canonical: Record<string, unknown> = {};
    try {
      canonical = session.canonicalSnapshot
        ? JSON.parse(session.canonicalSnapshot)
        : {};
    } catch { /* ignore */ }

    canonical.executionState = {
      snapshot,
      trajectory,
      lastUpdated: new Date().toISOString(),
      executionRate,
      blockRate,
    };

    await prisma.strategyRoomExecutionSession.update({
      where: { id: sessionId },
      data: {
        canonicalSnapshot: JSON.stringify(canonical),
      },
    });

    // 5. Create monitoring snapshot if linked to a journey
    if (session.strategyRoomSessionId) {
      // Find linked journey via the strategy room session
      const srSession = await prisma.strategyRoomSession.findUnique({
        where: { sessionKey: session.strategyRoomSessionId },
      });

      if (srSession) {
        // Update the strategy room session with execution progress
        await prisma.strategyRoomSession.update({
          where: { sessionKey: session.strategyRoomSessionId },
          data: {
            status: trajectory === "ASCENDING" ? "executing" : session.status,
          },
        });
      }
    }

    // 6. Record journey event for decision progression
    await recordJourneyEvent(
      session.sessionKey,
      action === "created" ? "strategy_attempt" : "strategy_allowed",
      {
        sessionKey: session.sessionKey,
        evidenceDepth: snapshot.total,
        escalationLevel: trajectory,
      },
    );
  } catch (err) {
    // Non-blocking — feedback loop failures should not break the UI
    console.error("[execution-feedback]", err);
  }
}

/**
 * Derives session exit recommendation based on current decision state.
 */
export function deriveExitRecommendation(
  decisions: Array<{ status: string }>,
): "continue" | "monitoring" | "escalate" {
  if (decisions.length === 0) return "continue";

  const blocked = decisions.filter((d) => d.status === "blocked").length;
  const executed = decisions.filter((d) => d.status === "executed").length;
  const total = decisions.length;

  // If most decisions are blocked, recommend escalation
  if (blocked / total > 0.5) return "escalate";

  // If most decisions are executed, recommend monitoring
  if (executed / total > 0.7) return "monitoring";

  return "continue";
}
