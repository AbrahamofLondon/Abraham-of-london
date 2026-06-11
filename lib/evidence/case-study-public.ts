/**
 * lib/evidence/case-study-public.ts
 *
 * Public-safe projection of case study records.
 * Strips all PII and admin-only fields.
 * Every public output must pass through this projector.
 */

import type { CaseStudyRecord, EvidenceStatus, OutcomeStatus } from "./case-study-service-contracts";

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC PROJECTION
// ─────────────────────────────────────────────────────────────────────────────

export type PublicCaseStudy = {
  id: string;
  slug: string | null;
  title: string;
  // Classification
  productCode: string | null;
  sector: string | null;
  orgType: string | null;
  decisionType: string | null;
  // Evidence provenance
  evidenceStatus: EvidenceStatus;
  evidenceStatusLabel: string;
  outcomeStatus: OutcomeStatus;
  outcomeStatusLabel: string;
  consentBasis: ConsentBasis;
  // Public narrative
  pressureCondition: string | null;
  interventionPerformed: string | null;
  evidenceTested: string | null;
  falsificationQuestion: string | null;
  outcomeHypothesisText: string | null;
  currentOutcomeState: string | null;
  whatRemainsUnproven: string | null;
  whatWouldChangeConclusion: string | null;
  // Trust anchors
  isAnonymised: boolean;
  isFalsificationLinked: boolean;
  isHypothesisLinked: boolean;
  isArtifactLinked: boolean;
  // Publication state
  publishedAt: string | null;
};

export type ConsentBasis = "ANONYMISED" | "NAMED_WITH_CONSENT" | "INTERNAL_ONLY" | "NOT_REQUIRED";

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  METHOD_DEMONSTRATION:  "Method Demonstration",
  FOUNDER_VERIFIED:      "Founder Verified",
  CLIENT_CONFIRMED:      "Client Confirmed",
  EVIDENCE_LINKED:       "Evidence Linked",
  OUTCOME_PENDING:       "Outcome Pending",
  OUTCOME_VERIFIED:      "Outcome Verified",
  PARTIAL_OUTCOME:       "Partial Outcome",
  DISPUTED:              "Disputed",
  WITHDRAWN:             "Withdrawn",
};

export const OUTCOME_STATUS_LABELS: Record<OutcomeStatus, string> = {
  NOT_MEASURED:    "Not Measured",
  HYPOTHESIS_SET:  "Hypothesis Set",
  PENDING_REVIEW:  "Pending Review",
  VERIFIED:        "Verified",
  PARTIAL:         "Partial",
  FAILED:          "Failed",
  DISPUTED:        "Disputed",
};

function resolveConsentBasis(consentStatus: string, anonymised: boolean): ConsentBasis {
  if (consentStatus === "NOT_REQUIRED") return "NOT_REQUIRED";
  if (anonymised) return "ANONYMISED";
  if (consentStatus === "GRANTED" && !anonymised) return "NAMED_WITH_CONSENT";
  return "INTERNAL_ONLY";
}

export function toPublicCaseStudy(record: CaseStudyRecord): PublicCaseStudy {
  const n = record.narrative;

  const isFalsificationLinked = record.evidenceLinks.some(e => e.sourceType === "falsification_entry");
  const isHypothesisLinked = record.evidenceLinks.some(e => e.sourceType === "outcome_hypothesis");
  const isArtifactLinked = record.evidenceLinks.some(e => e.sourceType === "product_artifact");

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    productCode: n.productCode ?? null,
    sector: n.sector ?? null,
    orgType: n.orgType ?? null,
    decisionType: n.decisionType ?? null,
    evidenceStatus: record.evidenceStatus,
    evidenceStatusLabel: EVIDENCE_STATUS_LABELS[record.evidenceStatus],
    outcomeStatus: record.outcomeStatus,
    outcomeStatusLabel: OUTCOME_STATUS_LABELS[record.outcomeStatus],
    consentBasis: resolveConsentBasis(record.consentStatus, record.anonymised),
    pressureCondition: n.pressureCondition ?? null,
    interventionPerformed: n.interventionPerformed ?? null,
    evidenceTested: n.evidenceTested ?? null,
    falsificationQuestion: n.falsificationQuestion ?? null,
    outcomeHypothesisText: n.outcomeHypothesisText ?? null,
    currentOutcomeState: n.currentOutcomeState ?? null,
    whatRemainsUnproven: n.whatRemainsUnproven ?? null,
    whatWouldChangeConclusion: n.whatWouldChangeConclusion ?? null,
    isAnonymised: record.anonymised,
    isFalsificationLinked,
    isHypothesisLinked,
    isArtifactLinked,
    publishedAt: record.publishedAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PII GUARD — verify no private fields are leaking
// ─────────────────────────────────────────────────────────────────────────────

const PRIVATE_FIELDS = ["adminNotes", "deliveryNotes", "internalClientRef", "clientName", "clientEmail"];

export function assertNoPII(obj: Record<string, unknown>): void {
  for (const field of PRIVATE_FIELDS) {
    if (field in obj) {
      throw new Error(`PII_LEAK: private field "${field}" found in public output`);
    }
  }
}
