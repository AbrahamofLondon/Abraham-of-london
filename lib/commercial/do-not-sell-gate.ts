/**
 * Do-Not-Sell Gate — blocks purchase if diagnostic prerequisites not met.
 *
 * This is not a soft nudge. If the gate blocks, the sale does not happen.
 */

import { prisma } from "@/lib/prisma.server";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

export type GateResult = {
  allowed: boolean;
  reason?: string;
  message?: string;
};

/**
 * Check whether this email is allowed to purchase the given product.
 *
 * Blocking conditions:
 * 1. No completed diagnostic exists
 * 2. Stated cost < £100/month
 * 3. Accuracy not confirmed
 * 4. Intent not declared
 */
export async function checkDoNotSellGate(
  email: string,
  _productCode: string,
): Promise<GateResult> {
  if (!email) {
    return {
      allowed: false,
      reason: "NO_EMAIL",
      message: "You are not ready to purchase. Complete the diagnostic properly or leave.",
    };
  }

  // Find completed diagnostic journey with spine data
  const journey = await prisma.diagnosticJourney.findFirst({
    where: {
      email,
      diagnosticType: "intelligence_spine",
    },
    orderBy: { updatedAt: "desc" },
  });

  // Condition 1: No diagnostic exists at all
  if (!journey) {
    return {
      allowed: false,
      reason: "NO_DIAGNOSTIC",
      message: "Complete the diagnostic before purchasing.",
    };
  }

  const spine = journey.mergedTensionThread as unknown as IntelligenceSpine | null;

  if (!spine || !spine.id) {
    return {
      allowed: false,
      reason: "NO_DIAGNOSTIC",
      message: "You are not ready to purchase. Complete the diagnostic properly or leave.",
    };
  }

  // Condition 2: Cost < £100/month
  const monthlyCost = spine.economics?.estimatedMonthlyCost ?? 0;
  if (monthlyCost < 100) {
    return {
      allowed: false,
      reason: "COST_TOO_LOW",
      message: "Stated cost does not justify this engagement.",
    };
  }

  // Condition 3: Accuracy not confirmed
  const accuracyConfirmed = spine.accuracyFeedback?.response === "yes";
  if (!accuracyConfirmed) {
    // Also check evidence nodes as fallback
    const accuracyEvidence = await prisma.diagnosticEvidenceNode.findFirst({
      where: {
        journeyId: journey.id,
        kind: "accuracy_confirmation",
      },
    });

    if (!accuracyEvidence) {
      return {
        allowed: false,
        reason: "ACCURACY_NOT_CONFIRMED",
        message: "Diagnostic accuracy not confirmed.",
      };
    }
  }

  // Condition 4: Intent not declared
  const intentDeclared = spine.preCommitment?.willing48h === true;
  if (!intentDeclared) {
    // Also check evidence nodes as fallback
    const intentEvidence = await prisma.diagnosticEvidenceNode.findFirst({
      where: {
        journeyId: journey.id,
        kind: "intent_declaration",
      },
    });

    if (!intentEvidence) {
      return {
        allowed: false,
        reason: "INTENT_NOT_DECLARED",
        message: "Intent to act not declared.",
      };
    }
  }

  return { allowed: true };
}
