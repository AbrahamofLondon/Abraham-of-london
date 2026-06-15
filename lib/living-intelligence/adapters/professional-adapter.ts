/**
 * lib/living-intelligence/adapters/professional-adapter.ts
 *
 * Professional/advisor domain adapter — Phase 5D.
 *
 * Translates professional advisor engagements, the public professional surface,
 * organisation access boundaries, and advisor-client workflows into
 * LivingStateObjects.
 *
 * Sources inspected:
 *   pages/professionals.tsx                                (public surface)
 *   lib/professional-console/professional-console-contract.ts (advisor contract)
 *   lib/professional-console/professional-engagement-boundary.ts (boundary enforcement)
 *   lib/product/organisation-access-contract.ts            (access roles/boundaries)
 *   lib/product/organisation-access.ts                     (access decisions)
 *   lib/product/organisation-divergence-summary.ts          (divergence)
 *   lib/commercial/catalog.ts                              (professional product)
 *   reports/living-estate-intelligence-report.json         (estate checker)
 *   reports/living-product-view-model.json                 (product truth)
 *
 * Every object answers:
 *   1. What advisor/client/access object exists?
 *   2. What access boundary applies?
 *   3. Is raw user/client response protected?
 *   4. Is the object sponsor-safe, operator-safe, advisor-safe, or user-safe?
 *   5. Is client/advisor consent or authority boundary required?
 *   6. What cannot be inferred?
 *
 * The system REFUSES to infer:
 *   - advisor authority from workspace access
 *   - client consent from advisor access
 *   - organisation-level visibility from individual case access
 *   - raw response visibility from sponsor/owner role
 *   - professional entitlement from Stripe metadata
 */

import {
  readString,
  readBool,
  readNumber,
  readStringArray,
  type LivingDomainAdapter,
  type LivingDomainAdapterInput,
} from "@/lib/living-intelligence/living-domain-adapter-contract";
import type {
  LivingStateArtifactStatus,
  LivingStateBlockerCode,
  LivingStateConsentStatus,
  LivingStateEvidenceStatus,
  LivingStateObject,
  LivingStateSeverity,
  LivingStateStage,
} from "@/lib/living-intelligence/living-state-object-contract";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function engagementStatusToStage(status: string | undefined): LivingStateStage {
  switch (status) {
    case "active":
      return "processing";
    case "suspended":
      return "blocked";
    case "concluded":
      return "delivered";
    default:
      return "created";
  }
}

function advisorStatusToEvidence(status: string | undefined): LivingStateEvidenceStatus {
  switch (status) {
    case "verified":
      return "verified";
    case "unverified":
      return "unverified";
    case "suspended":
      return "contradictory";
    default:
      return "unverified";
  }
}

function buildCannotInfer(): string[] {
  return [
    "Advisor authority from workspace access — workspace access is not authority.",
    "Client consent from advisor access — access does not imply consent.",
    "Organisation-level visibility from individual case access — case access is not org access.",
    "Raw response visibility from sponsor/owner role — role does not grant raw data access.",
    "Professional entitlement from Stripe metadata — Stripe IDs are not entitlement.",
  ];
}

function detectProfessionalBlockers(
  record: Record<string, unknown>,
  stage: LivingStateStage,
): { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] {
  const blockers: { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] = [];

  const verificationStatus = readString(record, "verificationStatus");
  const canViewRawResponses = readBool(record, "canViewRawResponses");
  const smallSampleSuppression = readBool(record, "smallSampleSuppressionApplies");
  const hasConsent = readBool(record, "hasClientConsent");
  const hasStripeMetadata = readBool(record, "hasStripeMetadata");
  const isBlocked = readBool(record, "isBlocked");
  const organisationBoundaryEnforced = readBool(record, "organisationBoundaryEnforced");

  // Professional surface exists without advisor/client boundary.
  if (!organisationBoundaryEnforced && stage === "processing") {
    blockers.push({
      code: "missing_consent",
      explanation: "Professional engagement exists but no organisation boundary is enforced. Client evidence could cross tenant boundaries.",
      requiredAction: "Enforce organisation boundary for this engagement.",
    });
  }

  // Advisor workspace exists without consent boundary.
  if (stage === "processing" && hasConsent === false) {
    blockers.push({
      code: "missing_consent",
      explanation: "Advisor workspace is active but client consent has not been recorded. Advisor activity requires explicit client consent.",
      requiredAction: "Record client consent before proceeding with advisor activities.",
    });
  }

  // Raw client response could be visible to sponsor/advisor incorrectly.
  if (canViewRawResponses === true && smallSampleSuppression === false) {
    blockers.push({
      code: "unsafe_to_show_user",
      explanation: "Raw responses are visible but small-sample suppression is not applied. Respondent privacy may be compromised.",
      requiredAction: "Enable small-sample suppression to protect respondent privacy.",
    });
  }

  // Professional product has Stripe metadata but is blocked/internal.
  if (hasStripeMetadata && isBlocked) {
    blockers.push({
      code: "checkout_permission_conflict",
      explanation: "Professional product has Stripe metadata but is blocked or internal. Governance state overrides catalogue metadata.",
      requiredAction: "Reconcile governance state with Stripe metadata.",
    });
  }

  // Advisor unverified.
  if (verificationStatus === "unverified" || verificationStatus === "suspended") {
    blockers.push({
      code: "unverified_evidence",
      explanation: `Advisor verification status is "${verificationStatus}". Unverified or suspended advisors cannot create or manage engagements.`,
      requiredAction: "Verify the advisor before allowing engagement creation.",
    });
  }

  return blockers;
}

function buildOperatorSummary(record: Record<string, unknown>): string {
  const engagementId = readString(record, "engagementId") ?? readString(record, "id") ?? "unknown";
  const advisorStatus = readString(record, "verificationStatus") ?? "unknown";
  const engagementStatus = readString(record, "status") ?? "unknown";
  const hasConsent = readBool(record, "hasClientConsent");
  const boundaryEnforced = readBool(record, "organisationBoundaryEnforced");

  const parts: string[] = [
    `Professional engagement "${engagementId}" — advisor: ${advisorStatus}, engagement: ${engagementStatus}.`,
  ];
  if (hasConsent) parts.push("Client consent recorded.");
  else parts.push("⚠ No client consent recorded.");
  if (boundaryEnforced) parts.push("Organisation boundary enforced.");
  else parts.push("⚠ Organisation boundary NOT enforced.");
  return parts.join(" ");
}

function buildUserSummary(record: Record<string, unknown>): string {
  const clientName = readString(record, "clientName") ?? "your organisation";
  const status = readString(record, "status") ?? "unknown";
  if (status === "active") return `A professional advisor is engaged with ${clientName}. Evidence is being structured under governed boundary.`;
  if (status === "concluded") return `The professional engagement with ${clientName} has concluded.`;
  return `Professional services are available for ${clientName}.`;
}

function mapOne(
  record: Record<string, unknown>,
  input: LivingDomainAdapterInput,
): LivingStateObject {
  const engagementId = readString(record, "engagementId") ?? readString(record, "id") ?? `prof-${Math.random().toString(36).slice(2, 10)}`;
  const status = readString(record, "status") ?? "active";
  const verificationStatus = readString(record, "verificationStatus") ?? "unverified";
  const stage = engagementStatusToStage(status);
  const evidenceStatus = advisorStatusToEvidence(verificationStatus);
  const profBlockers = detectProfessionalBlockers(record, stage);
  const hasConsent = readBool(record, "hasClientConsent") === true;
  const boundaryEnforced = readBool(record, "organisationBoundaryEnforced") === true;
  const clientName = readString(record, "clientName") ?? "Unknown client";

  const id = `professional-${engagementId}`;
  const title = `Professional engagement — ${clientName}`;

  return {
    id,
    domain: "professional",
    subjectType: "workflow",
    sourceId: engagementId,
    productCode: "professional",
    title,
    currentStage: stage,
    statusLabel: `${status} — advisor ${verificationStatus}`,
    userVisibleSummary: buildUserSummary(record),
    operatorSummary: buildOperatorSummary(record),
    evidence: {
      status: evidenceStatus,
      supportingEvidence: [
        `Advisor status: ${verificationStatus}`,
        `Engagement status: ${status}`,
        `Consent: ${hasConsent ? "recorded" : "missing"}`,
      ],
      missingEvidence: !hasConsent ? ["Client consent for advisor engagement"] : [],
      cannotInfer: buildCannotInfer(),
    },
    consent: {
      required: true,
      status: hasConsent ? "granted" : "missing",
      supportingEvidence: [],
      missing: hasConsent ? [] : ["Client consent for advisor engagement"],
    },
    artifact: {
      required: false,
      status: "not_required",
      artifactIds: [],
      artifactRoutes: [],
      missing: [],
    },
    publication: {
      relevant: false,
      allowed: false,
      reason: "Professional engagement data is private to the client and advisor; it is not published.",
      missing: [],
    },
    blockers: profBlockers.map((b) => ({
      code: b.code,
      label: b.code === "missing_consent"
        ? "Required consent is missing"
        : b.code === "unsafe_to_show_user"
          ? "Not safe to show the user in current state"
          : b.code === "checkout_permission_conflict"
            ? "Checkout permission conflicts with governance"
            : b.code === "unverified_evidence"
              ? "Evidence is not yet verified"
              : "Professional issue",
      severity: (b.code === "missing_consent" || b.code === "unsafe_to_show_user"
        ? "blocker"
        : b.code === "checkout_permission_conflict"
          ? "governed_tension"
          : "warning") as LivingStateSeverity,
      explanation: b.explanation,
      evidence: [
        `engagementId=${engagementId}`,
        `advisorStatus=${verificationStatus}`,
        `hasConsent=${hasConsent}`,
        `boundaryEnforced=${boundaryEnforced}`,
      ],
      affectedItems: [engagementId],
      requiredAction: b.requiredAction,
      actionOwner: (b.code === "owner_decision_required" ? "founder" : "operator") as "founder" | "operator",
      canAutomate: false,
    })),
    nextActions: [
      ...(!hasConsent && stage === "processing"
        ? [{
            label: "Record client consent",
            description: `Client consent is required for engagement "${engagementId}".`,
            owner: "operator" as const,
            actionType: "request_consent" as const,
            safeToAutomate: false,
            requiredEvidence: [] as string[],
          }]
        : []),
      ...(!boundaryEnforced && stage === "processing"
        ? [{
            label: "Enforce organisation boundary",
            description: `Organisation boundary must be enforced for engagement "${engagementId}".`,
            owner: "operator" as const,
            actionType: "repair_case" as const,
            safeToAutomate: false,
            requiredEvidence: [] as string[],
          }]
        : []),
    ],
    memory: {
      recurrenceCount: 1,
      currentStage: stage,
      regressionDetected: false,
      resolvedSinceLastRun: false,
    },
    safeToShowUser: status === "active" && hasConsent,
    safeToShowOperator: true,
    safeToAutomate: false,
    sourceOfTruth: [
      "lib/professional-console/professional-console-contract.ts",
      "lib/professional-console/professional-engagement-boundary.ts",
      "lib/product/organisation-access-contract.ts",
      "pages/professionals.tsx",
    ],
    raw: {
      engagementId,
      status,
      verificationStatus,
      hasClientConsent: hasConsent,
      organisationBoundaryEnforced: boundaryEnforced,
      clientName,
      canViewRawResponses: readBool(record, "canViewRawResponses") === true,
      smallSampleSuppressionApplies: readBool(record, "smallSampleSuppressionApplies") === true,
      hasStripeMetadata: readBool(record, "hasStripeMetadata") === true,
      isBlocked: readBool(record, "isBlocked") === true,
    },
  };
}

function professionalProofRecords(): Record<string, unknown>[] {
  return [
    {
      engagementId: "prof-proof-active-verified",
      status: "active",
      verificationStatus: "verified",
      clientName: "Acme Corp",
      hasClientConsent: true,
      organisationBoundaryEnforced: true,
      canViewRawResponses: false,
      smallSampleSuppressionApplies: true,
      hasStripeMetadata: false,
      isBlocked: false,
    },
    {
      engagementId: "prof-proof-no-consent",
      status: "active",
      verificationStatus: "verified",
      clientName: "Beta Ltd",
      hasClientConsent: false,
      organisationBoundaryEnforced: true,
      canViewRawResponses: false,
      smallSampleSuppressionApplies: true,
      hasStripeMetadata: false,
      isBlocked: false,
    },
    {
      engagementId: "prof-proof-unverified-advisor",
      status: "active",
      verificationStatus: "unverified",
      clientName: "Gamma Inc",
      hasClientConsent: false,
      organisationBoundaryEnforced: false,
      canViewRawResponses: true,
      smallSampleSuppressionApplies: false,
      hasStripeMetadata: true,
      isBlocked: true,
    },
    {
      engagementId: "prof-proof-concluded",
      status: "concluded",
      verificationStatus: "verified",
      clientName: "Delta Group",
      hasClientConsent: true,
      organisationBoundaryEnforced: true,
      canViewRawResponses: false,
      smallSampleSuppressionApplies: true,
      hasStripeMetadata: false,
      isBlocked: false,
    },
  ];
}

export const professionalAdapter: LivingDomainAdapter = {
  domain: "professional",
  label: "Professional",
  detect(records) {
    return records.some(
      (record) =>
        typeof record["engagementId"] === "string" ||
        typeof record["verificationStatus"] === "string",
    );
  },
  map(input: LivingDomainAdapterInput) {
    return input.records.map((record) => mapOne(record, input));
  },
};

export default professionalAdapter;
