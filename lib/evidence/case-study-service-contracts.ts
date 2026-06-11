/**
 * lib/evidence/case-study-service-contracts.ts
 *
 * Pure logic contracts exported for testing.
 * No Prisma imports — safe to import in Vitest without DB.
 */

// Pure types — no Prisma, no DB imports

export type EvidenceStatus =
  | "METHOD_DEMONSTRATION"
  | "FOUNDER_VERIFIED"
  | "CLIENT_CONFIRMED"
  | "EVIDENCE_LINKED"
  | "OUTCOME_PENDING"
  | "OUTCOME_VERIFIED"
  | "PARTIAL_OUTCOME"
  | "DISPUTED"
  | "WITHDRAWN";

export type OutcomeStatus =
  | "NOT_MEASURED"
  | "HYPOTHESIS_SET"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "PARTIAL"
  | "FAILED"
  | "DISPUTED";

export type VisibilityStatus =
  | "DRAFT"
  | "INTERNAL_REVIEW"
  | "PUBLIC_ANONYMISED"
  | "PUBLIC_NAMED"
  | "PRIVATE_ARCHIVED"
  | "WITHDRAWN";

export type PublicationGuardResult =
  | { allowed: true }
  | { allowed: false; reason: string };

export type CaseStudyNarrative = {
  productCode?: string;
  caseType?: string;
  evidenceStatus?: EvidenceStatus;
  outcomeStatus?: OutcomeStatus;
  sector?: string;
  orgType?: string;
  decisionType?: string;
  pressureCondition?: string;
  interventionPerformed?: string;
  evidenceTested?: string;
  falsificationQuestion?: string;
  outcomeHypothesisText?: string;
  currentOutcomeState?: string;
  whatRemainsUnproven?: string;
  whatWouldChangeConclusion?: string;
  riskClass?: string;
  interventionType?: string;
  evidenceMaturity?: string;
  outcomeMaturity?: string;
  adminNotes?: string;
  deliveryNotes?: string;
  internalClientRef?: string;
};

export type CaseStudyRecord = {
  id: string;
  slug: string | null;
  title: string;
  summary: string | null;
  visibilityStatus: VisibilityStatus;
  evidenceStatus: EvidenceStatus;
  outcomeStatus: OutcomeStatus;
  consentStatus: string;
  verificationStatus: string;
  publicationAllowed: boolean;
  anonymised: boolean;
  narrative: CaseStudyNarrative;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  evidenceLinks: Array<{ id: string; sourceType: string; sourceId: string; verificationStatus: string; notes: string | null }>;
};

export function checkPublicationAllowed(
  evidenceStatus: EvidenceStatus,
  outcomeStatus: OutcomeStatus,
  consentStatus: string,
  targetVisibility: VisibilityStatus,
  anonymised: boolean,
): PublicationGuardResult {
  if (targetVisibility === "PUBLIC_NAMED" && consentStatus !== "GRANTED") {
    return { allowed: false, reason: "Named publication requires GRANTED consent." };
  }
  if (outcomeStatus === "VERIFIED" && evidenceStatus !== "OUTCOME_VERIFIED") {
    return { allowed: false, reason: "Outcome cannot be marked VERIFIED without OUTCOME_VERIFIED evidence status." };
  }
  if (evidenceStatus === "WITHDRAWN") {
    return { allowed: false, reason: "Withdrawn case studies cannot be published." };
  }
  if (evidenceStatus === "DISPUTED" && targetVisibility !== "INTERNAL_REVIEW") {
    return { allowed: false, reason: "Disputed case studies can only be published after internal review." };
  }
  return { allowed: true };
}

export function toSchemaStatus(v: VisibilityStatus): { status: string; anonymised: boolean; publicationAllowed: boolean } {
  switch (v) {
    case "DRAFT":              return { status: "DRAFT",     anonymised: true,  publicationAllowed: false };
    case "INTERNAL_REVIEW":    return { status: "REVIEW",    anonymised: true,  publicationAllowed: false };
    case "PUBLIC_ANONYMISED":  return { status: "PUBLISHED", anonymised: true,  publicationAllowed: true  };
    case "PUBLIC_NAMED":       return { status: "PUBLISHED", anonymised: false, publicationAllowed: true  };
    case "PRIVATE_ARCHIVED":   return { status: "REJECTED",  anonymised: true,  publicationAllowed: false };
    case "WITHDRAWN":          return { status: "REVOKED",   anonymised: true,  publicationAllowed: false };
  }
}

export function fromSchemaStatus(status: string, anonymised: boolean): VisibilityStatus {
  if (status === "REVOKED")  return "WITHDRAWN";
  if (status === "REJECTED") return "PRIVATE_ARCHIVED";
  if (status === "PUBLISHED" && anonymised) return "PUBLIC_ANONYMISED";
  if (status === "PUBLISHED" && !anonymised) return "PUBLIC_NAMED";
  if (status === "REVIEW")   return "INTERNAL_REVIEW";
  return "DRAFT";
}
