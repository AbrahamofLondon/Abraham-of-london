/**
 * lib/security-assurance/security-assurance-pack-registry.ts
 *
 * Registry of security assurance materials and their disclosure levels.
 *
 * Disclosure levels:
 *   PUBLIC     — summary available immediately, no request needed
 *   REQUESTABLE — available after review; shared manually by operator
 *   RESTRICTED  — requires NDA and explicit approval; not auto-released
 *
 * Do not auto-deliver restricted documents.
 */

export type SecurityAssuranceDisclosureLevel =
  | "PUBLIC"
  | "REQUESTABLE"
  | "RESTRICTED";

export type SecurityAssuranceMaterial = {
  id: string;
  title: string;
  description: string;
  disclosureLevel: SecurityAssuranceDisclosureLevel;
  requiresReview: boolean;
  requiresNda: boolean;
  publicHref?: string;
};

const MATERIALS: readonly SecurityAssuranceMaterial[] = [
  {
    id: "security-assurance-readiness",
    title: "Security Assurance Readiness Overview",
    description:
      "Current assurance posture: hosting provider, auth model, secrets management, rate limiting, and the honest status of independent certifications (SOC 2, ISO 27001, pen-test).",
    disclosureLevel: "PUBLIC",
    requiresReview: false,
    requiresNda: false,
    publicHref: "/trust",
  },
  {
    id: "vendor-security-questionnaire",
    title: "Vendor Security Questionnaire",
    description:
      "Structured responses to standard vendor security questions covering infrastructure, data handling, access controls, incident response, and sub-processor dependencies.",
    disclosureLevel: "REQUESTABLE",
    requiresReview: true,
    requiresNda: false,
  },
  {
    id: "pilot-data-boundary-policy",
    title: "Pilot Data Boundary Policy",
    description:
      "Guidance on what information is appropriate for pilot use: what should be sanitised, what categories should be excluded during initial evaluation, and the rationale.",
    disclosureLevel: "PUBLIC",
    requiresReview: false,
    requiresNda: false,
    publicHref: "/trust#pilot-data-boundary",
  },
  {
    id: "incident-response-summary",
    title: "Incident Response Summary",
    description:
      "Detection, containment, assessment, notification decision tree, remediation posture, and post-incident review process.",
    disclosureLevel: "REQUESTABLE",
    requiresReview: true,
    requiresNda: false,
  },
  {
    id: "sub-processor-register",
    title: "Sub-Processor Register",
    description:
      "Current named sub-processors with purpose, data category handled, and data region. Updated when sub-processors change.",
    disclosureLevel: "REQUESTABLE",
    requiresReview: true,
    requiresNda: false,
  },
  {
    id: "independent-penetration-test-readiness",
    title: "Independent Penetration Test Readiness",
    description:
      "Current status of external penetration testing engagement: scope, provider selection status, and expected timeline. Not yet completed — no test report exists.",
    disclosureLevel: "RESTRICTED",
    requiresReview: true,
    requiresNda: true,
  },
  {
    id: "procurement-security-review-call",
    title: "Procurement Security Review Call",
    description:
      "A structured call with the operator covering architecture, data flows, threat model assumptions, and security roadmap. For security teams at the active procurement stage.",
    disclosureLevel: "RESTRICTED",
    requiresReview: true,
    requiresNda: true,
  },
  {
    id: "enterprise-assurance-rfi-answer-pack",
    title: "Enterprise Assurance RFI Answer Pack",
    description:
      "Structured honest answers to all standard enterprise vendor-risk questionnaire categories: legal entity, security assurance status, access control, data residency, privacy, sub-processors, operational resilience, provenance, insurance status, and roadmap. Some answers direct to contract or procurement review.",
    disclosureLevel: "REQUESTABLE",
    requiresReview: true,
    requiresNda: false,
  },
] as const;

export function getSecurityAssuranceMaterials(): readonly SecurityAssuranceMaterial[] {
  return MATERIALS;
}

export function getSecurityAssuranceMaterialById(
  id: string,
): SecurityAssuranceMaterial | null {
  return MATERIALS.find((m) => m.id === id) ?? null;
}

export function getSecurityAssuranceRequestHref(id: string): string {
  return `/contact?type=security-assurance&requested=${encodeURIComponent(id)}`;
}

export function isPublicSecurityAssuranceMaterial(id: string): boolean {
  const material = getSecurityAssuranceMaterialById(id);
  return material?.disclosureLevel === "PUBLIC";
}

export function requiresSecurityAssuranceReview(id: string): boolean {
  const material = getSecurityAssuranceMaterialById(id);
  return material?.requiresReview ?? true;
}

export const VALID_SECURITY_ASSURANCE_MATERIAL_IDS = MATERIALS.map(
  (m) => m.id,
) as string[];

export type SecurityAssuranceRequestStatus =
  | "NEW"
  | "UNDER_REVIEW"
  | "PUBLIC_PACK_APPROVED"
  | "NDA_REQUIRED"
  | "RESTRICTED_PACK_APPROVED"
  | "DECLINED"
  | "FULFILLED";

export const SECURITY_ASSURANCE_REQUEST_STATUSES: SecurityAssuranceRequestStatus[] =
  [
    "NEW",
    "UNDER_REVIEW",
    "PUBLIC_PACK_APPROVED",
    "NDA_REQUIRED",
    "RESTRICTED_PACK_APPROVED",
    "DECLINED",
    "FULFILLED",
  ];
