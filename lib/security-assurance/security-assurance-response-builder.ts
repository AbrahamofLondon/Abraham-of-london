/**
 * lib/security-assurance/security-assurance-response-builder.ts
 *
 * Builds admin response drafts for security assurance material requests.
 * No automation — output is for operator review and manual send only.
 */

import {
  getSecurityAssuranceMaterialById,
} from "./security-assurance-pack-registry";

export type SecurityAssuranceResponseInput = {
  requestedMaterialId: string;
  requesterName?: string | null;
  organisation?: string | null;
  procurementStage?: string | null;
};

export type SecurityAssuranceResponseOutput = {
  subject: string;
  body: string;
  disclosureNotice: string;
  recommendedAttachments: string[];
  requiresReview: boolean;
  requiresNda: boolean;
};

function firstName(name?: string | null): string {
  if (!name?.trim()) return "";
  return name.trim().split(/\s+/)[0] ?? "";
}

function salutation(name?: string | null): string {
  const f = firstName(name);
  return f ? `Hi ${f},` : "Hello,";
}

const ASSURANCE_BOUNDARY_NOTE = [
  "Current independent-assurance status:",
  "— SOC 2: not yet completed",
  "— ISO 27001 organisational certification: not yet completed",
  "— Independent external penetration testing: not yet completed",
  "",
  "These items are planned and will be shared when completed. We do not represent them as complete.",
].join("\n");

const RFI_PACK_ID = "enterprise-assurance-rfi-answer-pack";

function buildRfiPackResponse(
  input: SecurityAssuranceResponseInput,
): SecurityAssuranceResponseOutput {
  const greeting = salutation(input.requesterName);
  const orgLine = input.organisation
    ? ` at ${input.organisation}`
    : "";
  const stageNote = input.procurementStage
    ? ` (${input.procurementStage.replace(/_/g, " ")})`
    : "";

  const body = [
    greeting,
    "",
    `Thank you for requesting the Enterprise Assurance RFI Pack${orgLine}${stageNote}. Following review, I am happy to share the pack for your procurement and vendor-risk evaluation.`,
    "",
    "The pack covers:",
    "— Legal entity and contracting (Alomarada Ltd, Company no. 11549053)",
    "— Security assurance and testing status",
    "— Access control and identity",
    "— Data residency, storage, and backups",
    "— Privacy and compliance",
    "— Sub-processors and infrastructure",
    "— Operational resilience",
    "— Provenance and integrity",
    "— Insurance and liability (status and what to confirm in contract)",
    "— Roadmap and commitments",
    "",
    ASSURANCE_BOUNDARY_NOTE,
    "",
    "Some answers within the pack direct to contract or procurement review — these include insurance, formal RTO/RPO, EU-only residency guarantees, and enterprise SSO/MFA commitments. These items require contractual agreement and cannot be committed to outside of that process.",
    "",
    "For early evaluation, we recommend using sanitised or minimally sensitive information and not treating the platform as a system of record until deeper review is complete.",
    "",
    "Please let me know if you have questions about specific items in the pack or would like to discuss procurement-specific requirements.",
    "",
    "Regards,",
    "[Sender name]",
    "Abraham of London",
  ].join("\n");

  return {
    subject: "Enterprise Assurance RFI Pack — Abraham of London",
    body,
    disclosureNotice:
      "This material is requestable and should be reviewed before release. It does not represent SOC 2, ISO 27001, completed penetration testing, or external certification.",
    recommendedAttachments: [
      "enterprise-assurance-rfi-answer-pack",
      "security-assurance-readiness",
      "pilot-data-boundary-policy",
    ],
    requiresReview: true,
    requiresNda: false,
  };
}

function buildGenericResponse(
  input: SecurityAssuranceResponseInput,
): SecurityAssuranceResponseOutput {
  const material = getSecurityAssuranceMaterialById(input.requestedMaterialId);
  if (!material) {
    return {
      subject: "Security Assurance Request — Abraham of London",
      body: [
        salutation(input.requesterName),
        "",
        "Thank you for your security assurance request. I will review the details and respond shortly.",
        "",
        "Regards,",
        "[Sender name]",
        "Abraham of London",
      ].join("\n"),
      disclosureNotice: "Requested material not recognised. Review before responding.",
      recommendedAttachments: [],
      requiresReview: true,
      requiresNda: false,
    };
  }

  const greeting = salutation(input.requesterName);
  const isRestricted = material.disclosureLevel === "RESTRICTED";

  const body = isRestricted
    ? [
        greeting,
        "",
        `Thank you for requesting the ${material.title}. Given the sensitivity of this material, we share it under NDA. Please reply confirming you are willing to proceed under a mutual NDA and I will send the agreement for your signature.`,
        "",
        ASSURANCE_BOUNDARY_NOTE,
        "",
        "Regards,",
        "[Sender name]",
        "Abraham of London",
      ].join("\n")
    : [
        greeting,
        "",
        `Thank you for requesting the ${material.title}. Following review of your request, I am happy to share this material.`,
        "",
        ASSURANCE_BOUNDARY_NOTE,
        "",
        "Regards,",
        "[Sender name]",
        "Abraham of London",
      ].join("\n");

  return {
    subject: `Security Assurance Request: ${material.title} — Abraham of London`,
    body,
    disclosureNotice: isRestricted
      ? "This material is restricted. NDA required before sharing."
      : "This material is requestable. Review before release.",
    recommendedAttachments: [material.id],
    requiresReview: material.requiresReview,
    requiresNda: material.requiresNda,
  };
}

export function buildSecurityAssuranceResponse(
  input: SecurityAssuranceResponseInput,
): SecurityAssuranceResponseOutput {
  if (input.requestedMaterialId === RFI_PACK_ID) {
    return buildRfiPackResponse(input);
  }
  return buildGenericResponse(input);
}
