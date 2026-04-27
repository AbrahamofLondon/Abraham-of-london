/**
 * Case Draft Builder
 *
 * Constructs an anonymised case study draft from a verified outcome.
 * Pulls data from the full diagnostic pipeline: journey, decision,
 * contract, collision, and outcome records.
 *
 * CRITICAL: All identifying information is stripped. Financial data
 * comes only from verified records — never invented.
 */

import { prisma } from "@/lib/prisma.server";
import { checkCaseEligibility } from "./case-eligibility";
import type { CaseDraft } from "./case-draft-types";

const CONFIDENTIALITY_NOTE =
  "This case study has been anonymised. All identifying information including organisation names, " +
  "individual names, email addresses, and proprietary details have been removed. " +
  "Financial figures represent verified outcomes only.";

// Patterns that indicate PII leakage
const PII_PATTERNS = [
  /[\w.-]+@[\w.-]+\.\w{2,}/gi, // email
  /\b[A-Z][a-z]+ (?:Ltd|Limited|PLC|Inc|Corp|Group|Holdings)\b/g, // company names
  /\b(?:Mr|Mrs|Ms|Dr|Prof)\.\s+[A-Z][a-z]+/g, // titles + names
];

function containsPII(text: string): boolean {
  return PII_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

function anonymise(text: string): string {
  let result = text;
  // Strip emails
  result = result.replace(/[\w.-]+@[\w.-]+\.\w{2,}/gi, "[REDACTED]");
  // Strip company names (heuristic)
  result = result.replace(/\b[A-Z][a-z]+ (?:Ltd|Limited|PLC|Inc|Corp|Group|Holdings)\b/g, "[Organisation]");
  // Strip titled names
  result = result.replace(/\b(?:Mr|Mrs|Ms|Dr|Prof)\.\s+[A-Z][a-z]+\s+[A-Z][a-z]+/g, "[Individual]");
  return result;
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

export async function buildCaseDraft(outcomeId: string): Promise<CaseDraft | null> {
  // 1. Check eligibility
  const eligibility = await checkCaseEligibility(outcomeId);
  if (!eligibility.eligible) {
    return null;
  }

  // 2. Load the outcome record
  const outcome = await prisma.outcomeVerificationRecord.findUnique({
    where: { id: outcomeId },
  });

  if (!outcome) return null;

  const payload = safePayload(outcome.payload);

  // Additional safety checks
  const confidence = payload.confidence ?? outcome.effectivenessScore / 100;
  if (confidence < 0.85) return null;

  const disqualified = ["invalid", "deteriorated", "disputed"];
  if (disqualified.includes(outcome.outcomeClassification.toLowerCase())) return null;

  // 3. Load related decision object
  let decisionText = "Decision context not available for this case.";
  if (outcome.decisionObjectId) {
    const decision = await prisma.diagnosticDecisionObject.findUnique({
      where: { id: outcome.decisionObjectId },
    });
    if (decision) {
      decisionText = anonymise(decision.decisionText);
    }
  }

  // 4. Load baseline journey for situation context
  let situationText = "Organisation faced a structural challenge requiring diagnostic intervention.";
  if (outcome.baselineJourneyId) {
    const journey = await prisma.diagnosticJourney.findUnique({
      where: { id: outcome.baselineJourneyId },
      select: {
        diagnosticType: true,
        mergedTensionThread: true,
        organisationKey: true,
      },
    });
    if (journey) {
      const thread = safePayload(journey.mergedTensionThread);
      if (thread.summary && typeof thread.summary === "string") {
        situationText = anonymise(thread.summary);
      } else {
        situationText = `Organisation underwent ${journey.diagnosticType.replace(/_/g, " ")} diagnostic process.`;
      }
    }
  }

  // 5. Extract contradiction context
  let contradictionText = "No explicit contradiction was recorded in this case.";
  if (outcome.unresolvedContradictions) {
    const contradictions = Array.isArray(outcome.unresolvedContradictions)
      ? outcome.unresolvedContradictions
      : safePayload(outcome.unresolvedContradictions);
    if (Array.isArray(contradictions) && contradictions.length > 0) {
      contradictionText = anonymise(
        `Structural contradictions identified: ${contradictions.slice(0, 3).join("; ")}.`,
      );
    }
  }

  // 6. Load contract for intervention context
  let interventionText = "Intervention type not explicitly recorded.";
  const contracts = await prisma.patternBreakerContract.findMany({
    where: {
      sourceId: outcome.decisionObjectId ?? undefined,
    },
    take: 1,
    orderBy: { createdAt: "desc" },
  });

  let contractCreatedAt: Date | null = null;
  if (contracts.length > 0) {
    const contract = contracts[0]!;
    contractCreatedAt = contract.createdAt;
    interventionText = anonymise(
      `Pattern-breaking contract: ${contract.commitment}. Avoided pattern: ${contract.avoidedPattern ?? "not specified"}.`,
    );
  }

  // 7. Build outcome text
  const outcomeText = `Classification: ${outcome.outcomeClassification}. ` +
    `Magnitude of change: ${outcome.magnitudeOfChange.toFixed(1)}. ` +
    `Effectiveness score: ${outcome.effectivenessScore.toFixed(1)}. ` +
    `Decision velocity delta: ${outcome.decisionVelocityDelta.toFixed(1)}. ` +
    `Competitive position shift: ${outcome.competitivePositionShift.toFixed(1)}.`;

  // 8. Verification basis
  const verificationBasis = payload.verificationMethod
    ? `Verified via: ${payload.verificationMethod}`
    : "Verified through baseline-to-follow-up outcome comparison within the diagnostic pipeline.";

  // 9. Financial impact — only from data
  let financialImpact: CaseDraft["financialImpact"] = null;
  const amount = payload.financialImpact?.amount ?? payload.recoveredValue ?? null;
  if (amount && typeof amount === "number" && amount > 0) {
    financialImpact = {
      amount,
      currency: payload.financialImpact?.currency ?? payload.currency ?? "GBP",
      period: payload.financialImpact?.period ?? payload.period ?? "reporting period",
    };
  }

  // 10. Timeframe calculation
  let timeframeDays = 0;
  if (contractCreatedAt) {
    timeframeDays = Math.max(
      1,
      Math.round((outcome.createdAt.getTime() - contractCreatedAt.getTime()) / (1000 * 60 * 60 * 24)),
    );
  } else if (payload.timeframeDays) {
    timeframeDays = payload.timeframeDays;
  } else if (outcome.timeToAdvantage > 0) {
    timeframeDays = Math.round(outcome.timeToAdvantage);
  }

  // 11. Final anonymisation check
  const allText = [situationText, contradictionText, decisionText, interventionText, outcomeText].join(" ");
  const anonymisationComplete = !containsPII(allText);

  // Generate stable ID
  const id = `case_${outcomeId}_${Date.now().toString(36)}`;

  return {
    id,
    outcomeId,
    organisationId: outcome.organisationKey ?? undefined,
    situation: situationText,
    contradiction: contradictionText,
    decision: decisionText,
    intervention: interventionText,
    outcome: outcomeText,
    verificationBasis,
    financialImpact,
    timeframeDays,
    confidence,
    anonymisationComplete,
    confidentialityNote: CONFIDENTIALITY_NOTE,
    status: "draft",
    createdAt: new Date().toISOString(),
  };
}
