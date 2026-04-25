/**
 * Breach Escalation Ladder — 3-tier enforcement.
 *
 * Tier 1: "You did not act."
 * Tier 2: "This is now a pattern of avoidance."
 * Tier 3: "Your behaviour is contradicting your stated priorities."
 *
 * Tier 3 restricts Strategy Room re-entry unless pattern acknowledged.
 */

export type BreachTier = 1 | 2 | 3;

export type BreachEscalation = {
  tier: BreachTier;
  breachCount: number;
  message: string;
  restrictStrategyRoom: boolean;
  requiresAcknowledgment: boolean;
};

/**
 * Compute breach escalation from breach count.
 */
export function computeBreachEscalation(breachCount: number): BreachEscalation {
  if (breachCount <= 0) {
    return { tier: 1, breachCount: 0, message: "", restrictStrategyRoom: false, requiresAcknowledgment: false };
  }

  if (breachCount === 1) {
    return {
      tier: 1,
      breachCount,
      message: "You committed to an action and did not follow through. The system has recorded this.",
      restrictStrategyRoom: false,
      requiresAcknowledgment: false,
    };
  }

  if (breachCount === 2) {
    return {
      tier: 2,
      breachCount,
      message: "This is now a pattern of avoidance. Two commitments made, neither executed. The system adjusts confidence accordingly.",
      restrictStrategyRoom: false,
      requiresAcknowledgment: false,
    };
  }

  // 3+
  return {
    tier: 3,
    breachCount,
    message: "Your behaviour is contradicting your stated priorities. Three or more commitments breached. The system cannot treat future commitments as credible without acknowledgment.",
    restrictStrategyRoom: true,
    requiresAcknowledgment: true,
  };
}

/**
 * Generate breach email content by tier.
 */
export function breachEmailContent(tier: BreachTier, decision: string, move: string): { subject: string; body: string } {
  switch (tier) {
    case 1:
      return {
        subject: "You did not act.",
        body: `You committed to acting on this decision:\n\n"${decision}"\n\nThe move you identified:\n"${move}"\n\nNo action has been recorded. The system has noted this.`,
      };
    case 2:
      return {
        subject: "This is now a pattern.",
        body: `This is the second time you committed to an action and did not follow through.\n\nDecision: "${decision}"\nMove: "${move}"\n\nRepeated non-action is not neutral. It compounds the cost you already identified.\n\nThe system has adjusted your confidence score.`,
      };
    case 3:
      return {
        subject: "Your behaviour contradicts your priorities.",
        body: `Three or more commitments breached.\n\nDecision: "${decision}"\nMove: "${move}"\n\nThe system can no longer treat your commitments as credible. Strategy Room access will require explicit acknowledgment of this pattern before re-entry.\n\nThis is not a punishment. It is accountability.`,
      };
  }
}
