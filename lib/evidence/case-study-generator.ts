/**
 * Case Study Generator — Automated Evidence Pipeline
 *
 * Turns verified outcomes into controlled, anonymised, reviewable case-study drafts.
 * Never auto-publishes. Generates evidence assets only when data is strong enough.
 *
 * Pipeline:
 *   Verified Outcome → Eligibility Check → Data Assembly → Integrity Seal → Draft
 */

import { prisma } from "@/lib/prisma.server";
import type {
  CaseStudyDraft,
  CaseStudyClassification,
  CaseStudyEligibilityResult,
  CaseStudyGenerationInput,
  CaseStudyGenerationResult,
} from "./case-study-types";
import { CLASSIFICATION_LABELS, CLASSIFICATION_DESCRIPTIONS } from "./case-study-types";
import { generateIntegritySeal, type SealInput } from "./evidence-integrity-seal";

// ─────────────────────────────────────────────────────────────────────────────
// ELIGIBILITY CHECK
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS: Array<{ field: string; check: (data: Record<string, unknown>) => boolean }> = [
  { field: "outcomeExists", check: (d) => !!d.outcomeId },
  { field: "outcomeVerified", check: (d) => d.verificationStatus === "verified" },
  { field: "confidence", check: (d) => (d.confidence as number) >= 0.85 },
  { field: "financialImpactGBP", check: (d) => typeof d.financialImpactGBP === "number" && (d.financialImpactGBP as number) > 0 },
  { field: "timeframeDays", check: (d) => typeof d.timeframeDays === "number" && (d.timeframeDays as number) > 0 },
  { field: "verificationMethod", check: (d) => {
    const method = d.verificationMethod as string;
    return method === "BEHAVIOURAL" || method === "DOCUMENTARY" || method === "OPERATOR_CONFIRMED";
  }},
  { field: "anonymisationFields", check: (d) => !!d.anonymisedSector || !!d.anonymisedOrganisationSize || !!d.anonymisedRegion },
  { field: "sourceExists", check: (d) => !!d.sourceContractId || !!d.sourceDecisionId },
];

const HARD_FAIL_FIELDS: Array<{ field: string; check: (data: Record<string, unknown>) => boolean; reason: string }> = [
  { field: "verificationMethod", check: (d) => (d.verificationMethod as string) !== "SELF_REPORTED", reason: "Self-reported outcomes cannot be used as public proof" },
  { field: "confidence", check: (d) => (d.confidence as number) >= 0.85, reason: "Confidence below 0.85 threshold" },
  { field: "financialImpactGBP", check: (d) => typeof d.financialImpactGBP === "number" && (d.financialImpactGBP as number) > 0, reason: "Financial impact missing or zero" },
  { field: "timeframeDays", check: (d) => typeof d.timeframeDays === "number" && (d.timeframeDays as number) > 0, reason: "Timeframe missing" },
  { field: "outcomeDisputed", check: (d) => d.outcomeDisputed !== true, reason: "Outcome is disputed" },
  { field: "outcomeFailed", check: (d) => d.outcomeFailed !== true, reason: "Outcome failed" },
  { field: "sourceRecord", check: (d) => !!d.sourceContractId || !!d.sourceDecisionId, reason: "No source contract or decision record" },
];

export async function checkCaseStudyEligibility(
  outcomeId: string,
  additionalData?: Record<string, unknown>,
): Promise<CaseStudyEligibilityResult> {
  const outcome = await prisma.outcomeVerificationRecord.findUnique({
    where: { id: outcomeId },
  });

  if (!outcome) {
    return { eligible: false, reason: "Outcome not found", missingFields: ["outcomeExists"] };
  }

  const payload = typeof outcome.payload === "object" && outcome.payload !== null
    ? outcome.payload as Record<string, unknown>
    : {};

  const data: Record<string, unknown> = {
    outcomeId: outcome.id,
    verificationStatus: outcome.outcomeClassification,
    confidence: outcome.effectivenessScore / 100,
    financialImpactGBP: payload.costOfDelay ?? payload.recoveredValue ?? null,
    timeframeDays: payload.timeframeDays ?? null,
    verificationMethod: payload.verificationMethod ?? "SELF_REPORTED",
    sourceContractId: payload.sourceContractId ?? null,
    sourceDecisionId: payload.sourceDecisionId ?? null,
    outcomeDisputed: payload.outcomeDisputed ?? false,
    outcomeFailed: outcome.outcomeClassification === "invalid" || outcome.outcomeClassification === "deteriorated",
    anonymisedSector: additionalData?.anonymisedSector ?? payload.anonymisedSector ?? null,
    anonymisedOrganisationSize: additionalData?.anonymisedOrganisationSize ?? payload.anonymisedOrganisationSize ?? null,
    anonymisedRegion: additionalData?.anonymisedRegion ?? payload.anonymisedRegion ?? null,
    ...additionalData,
  };

  // Check hard fail conditions first
  for (const fail of HARD_FAIL_FIELDS) {
    if (!fail.check(data)) {
      return { eligible: false, reason: fail.reason, missingFields: [fail.field] };
    }
  }

  // Check required fields
  const missingFields: string[] = [];
  for (const req of REQUIRED_FIELDS) {
    if (!req.check(data)) {
      missingFields.push(req.field);
    }
  }

  if (missingFields.length > 0) {
    return { eligible: false, reason: "Missing required fields", missingFields };
  }

  return { eligible: true, missingFields: [] };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASSIFICATION DERIVATION
// ─────────────────────────────────────────────────────────────────────────────

function deriveClassification(payload: Record<string, unknown>): CaseStudyClassification {
  const condition = (payload.conditionClass as string) ?? "";
  const contradictionType = (payload.contradictionType as string) ?? "";

  if (contradictionType.includes("authority") || condition === "authority") return "authority_failure";
  if (contradictionType.includes("avoidance") || payload.avoidedDecision) return "decision_avoidance";
  if (contradictionType.includes("misalignment") || payload.crossExecutiveContradictionSeverity) return "misaligned_reality";
  if (contradictionType.includes("drift") || condition === "execution") return "execution_drift";
  if (contradictionType.includes("governance") || condition === "instability") return "governance_failure";
  return "structural_contradiction";
}

// ─────────────────────────────────────────────────────────────────────────────
// NARRATIVE GENERATION
// ─────────────────────────────────────────────────────────────────────────────

function generateSituation(payload: Record<string, unknown>, classification: CaseStudyClassification): string {
  const decision = (payload.decisionText as string) ?? "a critical decision";
  const context = (payload.contextSummary as string) ?? "";

  if (context) return context;
  if (classification === "authority_failure") {
    return `An organisation faced a decision about ${decision.toLowerCase()}. Leadership believed ownership was clear. The team was waiting for direction.`;
  }
  if (classification === "decision_avoidance") {
    return `A decision about ${decision.toLowerCase()} had been "in progress" for weeks. The complexity was manufactured by the avoidance itself.`;
  }
  if (classification === "misaligned_reality") {
    return `Leadership and the team described the same decision — ${decision.toLowerCase()} — from completely different realities.`;
  }
  return `An organisation encountered a structural contradiction around ${decision.toLowerCase()}. The decision was known. It was not being taken.`;
}

function generateContradiction(payload: Record<string, unknown>, classification: CaseStudyClassification): string {
  const contradiction = (payload.primaryContradiction as string) ?? "";
  if (contradiction) return contradiction;

  if (classification === "authority_failure") {
    return "Ownership existed in conversation but not in execution. The decision had been discussed into the appearance of resolution without any individual accepting genuine accountability.";
  }
  if (classification === "decision_avoidance") {
    return "The stated position was 'we're working through it carefully.' The actual behaviour was 'no one is willing to commit.'";
  }
  if (classification === "misaligned_reality") {
    return "Leadership believed alignment existed. The team was compensating for ambiguity — filling gaps with assumptions, duplicating work, operating on unvalidated interpretations.";
  }
  return "What was stated and what was happening were not the same reality. The gap was invisible to those inside it.";
}

function generateDecision(payload: Record<string, unknown>): string {
  return (payload.decisionText as string) ?? "The decision itself was clear. What was missing was the willingness to take it.";
}

function generateIntervention(payload: Record<string, unknown>): string {
  const intervention = (payload.interventionPath as string[]) ?? [];
  if (intervention.length > 0) {
    return intervention.join(". ") + ".";
  }
  return "A single accountable owner was identified and assigned through forced escalation. A defined deadline was imposed. The option to defer was removed.";
}

function generateOutcome(payload: Record<string, unknown>, classification: CaseStudyClassification): string {
  const outcome = (payload.outcomeSummary as string) ?? "";
  if (outcome) return outcome;

  const classification_outcome = outcomeClassification(payload);
  if (classification_outcome === "resolved") {
    return "The decision was taken within the defined timeframe. Execution commenced immediately. The paralysis dissolved not through new information, but through the simple assignment of unambiguous ownership.";
  }
  if (classification_outcome === "improved") {
    return "The decision moved from open to active. Ownership was established. Execution began. Full resolution was projected within the next cycle.";
  }
  return "The intervention created movement where there was none. The contradiction was surfaced. The cost was acknowledged. Action followed.";
}

function outcomeClassification(payload: Record<string, unknown>): string {
  return (payload.outcomeClassification as string) ?? "improved";
}

function generateImplication(classification: CaseStudyClassification): string {
  const implications: Record<CaseStudyClassification, string> = {
    authority_failure: "Most delays are not strategic problems. They are ownership failures disguised as alignment. When everyone owns a decision, no one owns it.",
    decision_avoidance: "Most decisions are not hard. They are avoided. The difficulty is manufactured by the avoidance itself — each day of delay adds complexity that did not exist at the point of origin.",
    misaligned_reality: "Alignment is not what leadership believes. It is what the system actually executes. The gap between leadership perception and operational reality is the most expensive invisible cost in any organisation.",
    execution_drift: "Commitment without enforcement is theatre. The system that tracks whether action actually occurred eliminates the gap between stated intent and operational reality.",
    governance_failure: "When decision rights are unclear, every decision becomes a negotiation. The system that maps authority and enforces boundaries restores ordered execution.",
    structural_contradiction: "Contradictions that remain invisible cannot be resolved. The system that surfaces them forces the confrontation that existing structures are designed to avoid.",
  };
  return implications[classification];
}

// ─────────────────────────────────────────────────────────────────────────────
// DRAFT GENERATION
// ─────────────────────────────────────────────────────────────────────────────

export async function generateCaseStudyDraft(
  input: CaseStudyGenerationInput,
): Promise<CaseStudyGenerationResult> {
  const { outcomeId, anonymisedSector, anonymisedOrganisationSize, anonymisedRegion } = input;

  // 1. Load outcome record
  const outcome = await prisma.outcomeVerificationRecord.findUnique({
    where: { id: outcomeId },
  });

  if (!outcome) {
    return { ok: false, reason: "Outcome not found" };
  }

  // 2. Check eligibility
  const eligibility = await checkCaseStudyEligibility(outcomeId, {
    anonymisedSector,
    anonymisedOrganisationSize,
    anonymisedRegion,
  });

  if (!eligibility.eligible) {
    return { ok: false, reason: eligibility.reason ?? "Eligibility check failed", missingFields: eligibility.missingFields };
  }

  // 3. Extract payload data
  const payload = typeof outcome.payload === "object" && outcome.payload !== null
    ? outcome.payload as Record<string, unknown>
    : {};

  const financialImpactGBP = (payload.costOfDelay as number) ?? (payload.recoveredValue as number) ?? 0;
  const timeframeDays = (payload.timeframeDays as number) ?? 0;
  const confidence = outcome.effectivenessScore / 100;
  const verificationMethod = (payload.verificationMethod as string) ?? "SELF_REPORTED";
  const sourceContractId = (payload.sourceContractId as string) ?? null;
  const sourceDecisionId = (payload.sourceDecisionId as string) ?? null;

  // 4. Derive classification
  const classification = deriveClassification(payload);

  // 5. Generate narrative sections
  const situation = generateSituation(payload, classification);
  const contradiction = generateContradiction(payload, classification);
  const decision = generateDecision(payload);
  const intervention = generateIntervention(payload);
  const outcomeText = generateOutcome(payload, classification);
  const implication = generateImplication(classification);

  // 6. Build confidentiality notes
  const confidentialityNotes = [
    anonymisedSector ? `Sector: ${anonymisedSector}` : null,
    anonymisedOrganisationSize ? `Organisation size: ${anonymisedOrganisationSize}` : null,
    anonymisedRegion ? `Region: ${anonymisedRegion}` : null,
    "Client identity: Protected",
    "All figures are verified through the evidence integrity system",
  ].filter(Boolean).join(". ");

  // 7. Determine missing fields for seal
  const missingFields: string[] = [];
  if (!financialImpactGBP || financialImpactGBP <= 0) missingFields.push("financialImpactGBP");
  if (!timeframeDays || timeframeDays <= 0) missingFields.push("timeframeDays");
  if (!sourceContractId && !sourceDecisionId) missingFields.push("sourceTrace");
  if (!anonymisedSector && !anonymisedOrganisationSize && !anonymisedRegion) missingFields.push("anonymisation");

  // 8. Generate integrity seal
  const sealInput: SealInput = {
    confidence,
    verificationMethod: verificationMethod as SealInput["verificationMethod"],
    financialImpactGBP,
    sourceContractId,
    sourceDecisionId,
    multipleCasesConfirmed: false, // Would require checking for multiple outcomes with same pattern
    missingFields,
  };

  const integritySeal = generateIntegritySeal(sealInput);

  // 9. Determine recommended public status
  let recommendedPublicStatus: "publishable" | "needs_review" | "not_publishable";
  if (integritySeal.publicationAllowed && integritySeal.sealLevel !== "BRONZE") {
    recommendedPublicStatus = "publishable";
  } else if (integritySeal.sealLevel === "BRONZE") {
    recommendedPublicStatus = "needs_review";
  } else {
    recommendedPublicStatus = "not_publishable";
  }

  // 10. Build title
  const label = CLASSIFICATION_LABELS[classification];
  const title = `${label} — £${financialImpactGBP.toLocaleString()} Impact over ${timeframeDays} Days`;

  // 11. Assemble draft
  const draft: CaseStudyDraft = {
    title,
    classification,
    verificationBasis: `Verified outcome (${outcome.outcomeClassification}) with ${Math.round(confidence * 100)}% confidence. Verification method: ${verificationMethod}.`,
    confidentialityNotes,
    situation,
    contradiction,
    decision,
    intervention,
    outcome: outcomeText,
    financialImpactGBP,
    timeframeDays,
    confidence,
    sourceOutcomeId: outcome.id,
    sourceContractId,
    sourceDecisionId,
    recommendedPublicStatus,
    integritySeal,
    status: "draft",
    publicationAllowed: false,
    createdAt: new Date().toISOString(),
  };

  return { ok: true, draft };
}
