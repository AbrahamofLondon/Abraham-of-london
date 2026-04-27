/**
 * Case Eligibility Check
 *
 * Determines whether an OutcomeVerificationRecord qualifies
 * for case study generation. Strict criteria to ensure only
 * high-confidence, positive outcomes are surfaced.
 */

import { prisma } from "@/lib/prisma.server";
import type { CaseEligibility } from "./case-draft-types";

export async function checkCaseEligibility(outcomeId: string): Promise<CaseEligibility> {
  const reasons: string[] = [];

  const outcome = await prisma.outcomeVerificationRecord.findUnique({
    where: { id: outcomeId },
  });

  if (!outcome) {
    return { eligible: false, reasons: ["Outcome record not found"] };
  }

  // Confidence threshold: >= 0.85
  const payload = safePayload(outcome.payload);
  const confidence = payload.confidence ?? outcome.effectivenessScore / 100;
  if (confidence < 0.85) {
    reasons.push(`Confidence ${confidence.toFixed(2)} is below threshold (0.85 required)`);
  }

  // Outcome classification must not be negative
  const disqualifiedClassifications = ["invalid", "deteriorated", "disputed"];
  if (disqualifiedClassifications.includes(outcome.outcomeClassification.toLowerCase())) {
    reasons.push(`Outcome classification "${outcome.outcomeClassification}" is disqualified`);
  }

  // Financial impact must be present
  const financialAmount = payload.financialImpact?.amount ?? payload.recoveredValue ?? null;
  if (financialAmount === null || financialAmount === 0) {
    reasons.push("No financial impact data present");
  }

  // Timeframe must be derivable
  const timeframeDays = payload.timeframeDays ?? payload.timeToOutcomeDays ?? outcome.timeToAdvantage;
  if (!timeframeDays || timeframeDays <= 0) {
    reasons.push("No timeframe data available");
  }

  return {
    eligible: reasons.length === 0,
    reasons: reasons.length === 0 ? ["All eligibility criteria met"] : reasons,
  };
}

function safePayload(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "object" && value !== null) return value as Record<string, any>;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return {};
}
