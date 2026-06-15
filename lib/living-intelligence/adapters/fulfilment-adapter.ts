/**
 * lib/living-intelligence/adapters/fulfilment-adapter.ts
 *
 * Fulfilment domain adapter — Phase 5A.
 *
 * Translates fulfilment records from the estate fulfilment service into
 * LivingStateObjects. This adapter works GENERICALLY across all fulfilment
 * source types (boardroom orders, product artefacts, oversight cycles,
 * retainer readiness, case studies, oversight deliveries) — it does NOT
 * hardcode product-specific names.
 *
 * The adapter does NOT assume:
 *   - delivery from order existence
 *   - fulfilment from checkout success
 *   - artefact generation from artefact listing
 *   - verification from link presence
 *   - consent from silence
 *
 * Inputs derive from:
 *   lib/fulfilment/estate-fulfilment-service.ts  (FulfilmentItem contract)
 *   pages/admin/fulfilment/index.tsx             (admin surface)
 *   reports/living-state-objects.json            (prior objects for memory)
 *   reports/living-state-view-model.json         (prior view model)
 *
 * Because the fulfilment service is async (Prisma-backed), this adapter works
 * from the same FulfilmentItem-shaped records that the service returns.
 * In the proof-case runner, we provide synthetic records that exercise the
 * adapter generically.
 *
 * Every object answers:
 *   1. What was purchased/requested?
 *   2. Is there a fulfilment path?
 *   3. Is an artefact required?
 *   4. Has the artefact been generated?
 *   5. Has delivery been claimed?
 *   6. Is delivery supported by evidence?
 *   7. What is blocked?
 *   8. Who must act?
 *   9. What is the next governed action?
 */

import { CATALOG } from "@/lib/commercial/catalog";

import {
  readString,
  readBool,
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
  LivingStateStage,
} from "@/lib/living-intelligence/living-state-object-contract";

// ─── Fulfilment source types ─────────────────────────────────────────────────

const FULFILMENT_SOURCE_TYPES = [
  "boardroom_brief_order",
  "product_artifact",
  "executive_report",
  "oversight_review_cycle",
  "retainer_readiness",
  "case_study",
  "oversight_delivery",
] as const;

type FulfilmentSourceType = (typeof FULFILMENT_SOURCE_TYPES)[number];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map a fulfilment source type to a living domain subject type.
 */
function sourceTypeToSubjectType(sourceType: string): "order" | "artifact" | "workflow" {
  switch (sourceType) {
    case "boardroom_brief_order":
      return "order";
    case "product_artifact":
      return "artifact";
    case "executive_report":
    case "oversight_review_cycle":
    case "retainer_readiness":
    case "case_study":
    case "oversight_delivery":
      return "workflow";
    default:
      return "workflow";
  }
}

/**
 * Map a delivery status string to a living stage.
 * This is generic — it works for any product's delivery status.
 */
function deliveryStatusToStage(deliveryStatus: string | undefined | null): LivingStateStage {
  if (!deliveryStatus) return "processing";

  switch (deliveryStatus) {
    case "requested":
    case "paid":
      return "paid";
    case "case_stubs_created":
    case "PENDING":
    case "pending":
      return "processing";
    case "draft_generated":
    case "in_review":
    case "dossier_generated":
    case "AWAITING_REVIEW":
    case "awaiting_operator_review":
      return "awaiting_review";
    case "approved_for_delivery":
    case "READY_FOR_DELIVERY":
    case "customer_access_ready":
    case "approved":
      return "approved";
    case "delivered":
    case "DELIVERED":
    case "published":
      return "delivered";
    case "blocked":
      return "blocked";
    case "failed":
    case "FAILED":
      return "failed";
    case "QUEUED":
      return "processing";
    case "APPROVED":
      return "approved";
    default:
      return "processing";
  }
}

/**
 * Map a generation/artifact status to a living artifact status.
 */
function generationToArtifactStatus(
  generationStatus: string | undefined | null,
  deliveryStatus: string | undefined | null,
): LivingStateArtifactStatus {
  if (!generationStatus) {
    // No generation status at all — check delivery for clues.
    if (deliveryStatus === "delivered" || deliveryStatus === "DELIVERED") {
      return "delivered";
    }
    return "missing";
  }

  switch (generationStatus) {
    case "GENERATING":
      return "incomplete";
    case "generated":
    case "GENERATED":
    case "READY":
      return "generated";
    case "DRAFT":
      return "draft";
    case "AWAITING_REVIEW":
    case "in_review":
      return "awaiting_review";
    case "READY_FOR_DELIVERY":
      return "approved";
    case "DELIVERED":
      return "delivered";
    case "FAILED":
      return "incomplete";
    case "PENDING":
      return "stub_only";
    default:
      return "missing";
  }
}

/**
 * Determine whether an artefact is required for this fulfilment item.
 * Boardroom orders, product artefacts, and case studies with a product
 * that expects artefacts require them.
 */
function requiresArtifactForFulfilment(
  sourceType: string,
  productCode: string,
): boolean {
  // Boardroom brief orders always require an artefact.
  if (sourceType === "boardroom_brief_order") return true;

  // Product artefacts are themselves artefacts — they are required by definition.
  if (sourceType === "product_artifact") return true;

  // Case studies that are published require artefacts.
  if (sourceType === "case_study") return true;

  // Check the catalog for this product code.
  const product = CATALOG[productCode];
  if (product) {
    return Boolean(product.deliveryFormat) || product.commercialStatus === "paid";
  }

  return false;
}

/**
 * Derive evidence status for a fulfilment item.
 */
function deriveFulfilmentEvidence(
  deliveryStatus: string | undefined | null,
  proofStatus: string | undefined | null,
): LivingStateEvidenceStatus {
  if (deliveryStatus === "delivered" || deliveryStatus === "DELIVERED") {
    return proofStatus ? "weakly_indicated" : "inferred";
  }
  if (proofStatus === "proof_run") return "weakly_indicated";
  return "unverified";
}

/**
 * Derive consent status for a fulfilment item.
 */
function deriveFulfilmentConsent(
  sourceType: string,
  record: Record<string, unknown>,
): LivingStateConsentStatus {
  if (sourceType === "case_study") {
    const consentStatus = readString(record, "consentStatus");
    if (consentStatus === "GRANTED") return "granted";
    if (consentStatus === "PENDING") return "pending";
    return "missing";
  }
  return "not_required";
}

/**
 * Build the list of things the system refuses to infer for this fulfilment item.
 */
function buildCannotInfer(record: Record<string, unknown>): string[] {
  const cannot: string[] = [];
  cannot.push("Delivery from order existence — an order is not a delivered artefact.");
  cannot.push("Fulfilment from checkout success — checkout is not fulfilment.");
  cannot.push("Artefact generation from artefact listing — listing is not generation.");
  cannot.push("Verification from link presence — a URL does not verify content.");
  cannot.push("Consent from silence — absence of objection is not consent.");
  return cannot;
}

/**
 * Build adapter-level blockers for a fulfilment item.
 * The engine will add cross-cutting blockers (missing_artifact,
 * delivery_claim_without_artifact, paid_without_fulfilment, etc.).
 */
function deriveFulfilmentBlockers(
  record: Record<string, unknown>,
  sourceType: string,
  deliveryStatus: string | undefined | null,
  generationStatus: string | undefined | null,
  productCode: string,
): { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] {
  const blockers: { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] = [];

  const isDelivered = deliveryStatus === "delivered" || deliveryStatus === "DELIVERED";
  const isPaid = deliveryStatus === "paid" || deliveryStatus === "requested";
  const isOverdue = readBool(record, "isOverdue") === true;

  // Paid order without fulfilment record.
  if (isPaid && !generationStatus) {
    blockers.push({
      code: "paid_without_fulfilment",
      explanation: `Fulfilment item "${productCode}" (${sourceType}) is paid/requested but has no generation or fulfilment record. Payment was received but no fulfilment pipeline has started.`,
      requiredAction: "Initiate the fulfilment pipeline for this paid item.",
    });
  }

  // Delivery claimed without artefact.
  if (isDelivered && (!generationStatus || generationStatus === "PENDING")) {
    blockers.push({
      code: "delivery_claim_without_artifact",
      explanation: `Fulfilment item "${productCode}" (${sourceType}) claims delivery (${deliveryStatus}) but the artefact generation status is "${generationStatus ?? "none"}". Delivery cannot be claimed without a generated artefact.`,
      requiredAction: "Do not claim delivery until a real artefact is generated and reviewed.",
    });
  }

  // Overdue item with no progress.
  if (isOverdue && !isDelivered && !generationStatus) {
    blockers.push({
      code: "missing_operator_action",
      explanation: `Fulfilment item "${productCode}" (${sourceType}) is overdue but no operator has started processing it.`,
      requiredAction: "Assign an operator to process this overdue fulfilment item.",
    });
  }

  // Draft artefact with no review path.
  if (generationStatus === "DRAFT" || generationStatus === "draft_generated") {
    blockers.push({
      code: "draft_without_review_path",
      explanation: `Fulfilment item "${productCode}" (${sourceType}) has a draft artefact but no review path has been defined or started.`,
      requiredAction: "Create a review workflow for this draft artefact.",
    });
  }

  // Stuck generation (GENERATING for too long — detected by isOverdue or status).
  if (generationStatus === "GENERATING" && isOverdue) {
    blockers.push({
      code: "fulfilment_incomplete",
      explanation: `Fulfilment item "${productCode}" (${sourceType}) has been generating for too long. The generation process may be stuck.`,
      requiredAction: "Check the generation pipeline and restart if necessary.",
    });
  }

  // Case study without consent.
  if (sourceType === "case_study") {
    const consentStatus = readString(record, "consentStatus");
    if (consentStatus === "PENDING" || consentStatus === "MISSING" || !consentStatus) {
      blockers.push({
        code: "missing_consent",
        explanation: `Case study "${productCode}" requires publication consent but consent is "${consentStatus ?? "missing"}".`,
        requiredAction: "Obtain and record publication consent before proceeding.",
      });
    }
  }

  return blockers;
}

/**
 * Build the operator summary for a fulfilment item.
 */
function buildOperatorSummary(
  record: Record<string, unknown>,
  sourceType: string,
  deliveryStatus: string | undefined | null,
  generationStatus: string | undefined | null,
  productCode: string,
): string {
  const parts: string[] = [
    `Fulfilment item "${productCode}" (type: ${sourceType}) — delivery: ${deliveryStatus ?? "none"}, generation: ${generationStatus ?? "none"}.`,
  ];

  const nextAction = readString(record, "nextAction");
  if (nextAction) parts.push(`Next action: ${nextAction}.`);

  const isOverdue = readBool(record, "isOverdue") === true;
  if (isOverdue) parts.push("⚠️ This item is overdue.");

  const riskLevel = readString(record, "riskLevel");
  if (riskLevel) parts.push(`Risk level: ${riskLevel}.`);

  const adminRoute = readString(record, "adminRoute");
  if (adminRoute) parts.push(`Admin route: ${adminRoute}.`);

  return parts.join(" ");
}

/**
 * Build the user-visible summary for a fulfilment item.
 * This is deliberately generic — we do not expose internal status to end users.
 */
function buildUserSummary(
  deliveryStatus: string | undefined | null,
  sourceType: string,
): string {
  if (deliveryStatus === "delivered" || deliveryStatus === "DELIVERED") {
    return "Your order has been delivered.";
  }
  if (deliveryStatus === "published") {
    return "Your case study has been published.";
  }
  return "Your order is being processed. You will be notified when it is ready.";
}

// ─── Map one fulfilment record ────────────────────────────────────────────────

function mapOne(
  record: Record<string, unknown>,
  input: LivingDomainAdapterInput,
): LivingStateObject {
  const sourceType = readString(record, "sourceType") ?? "boardroom_brief_order";
  const sourceId = readString(record, "sourceId") ?? readString(record, "id") ?? "unknown";
  const productCode = readString(record, "productCode") ?? "unknown";
  const deliveryStatus = readString(record, "deliveryStatus");
  const generationStatus = readString(record, "generationStatus");
  const proofStatus = readString(record, "proofStatus");
  const isOverdue = readBool(record, "isOverdue") === true;
  const adminRoute = readString(record, "adminRoute");
  const nextActionText = readString(record, "nextAction");

  const stage = deliveryStatusToStage(deliveryStatus);
  const artifactStatus = generationToArtifactStatus(generationStatus, deliveryStatus);
  const subjectType = sourceTypeToSubjectType(sourceType);
  const requiresArtifact = requiresArtifactForFulfilment(sourceType, productCode);

  const id = `fulfilment-${sourceType}-${sourceId}`;
  const title = `${productCode} — ${sourceType.replace(/_/g, " ")}`;

  const adapterBlockers = deriveFulfilmentBlockers(
    record, sourceType, deliveryStatus, generationStatus, productCode,
  );

  // Build next actions from the fulfilment item's own nextAction field.
  const nextActions: LivingStateObject["nextActions"] = [];
  if (nextActionText) {
    nextActions.push({
      label: nextActionText,
      description: `Fulfilment action required for ${productCode} (${sourceType}).`,
      owner: "operator",
      actionType: "generate_artifact",
      route: adminRoute || undefined,
      safeToAutomate: false,
      requiredEvidence: [],
    });
  }

  return {
    id,
    domain: "fulfilment",
    subjectType,
    sourceId,
    productCode,
    title,
    currentStage: stage,
    statusLabel: `${deliveryStatus ?? "unknown"} — ${sourceType.replace(/_/g, " ")}`,
    userVisibleSummary: buildUserSummary(deliveryStatus, sourceType),
    operatorSummary: buildOperatorSummary(record, sourceType, deliveryStatus, generationStatus, productCode),
    evidence: {
      status: deriveFulfilmentEvidence(deliveryStatus, proofStatus),
      supportingEvidence: deliveryStatus === "delivered" || deliveryStatus === "DELIVERED"
        ? [`Delivery status is "${deliveryStatus}"`]
        : [],
      missingEvidence: !isDelivered(stage)
        ? [`Verified delivery record for "${productCode}"`]
        : [],
      cannotInfer: buildCannotInfer(record),
    },
    consent: {
      required: sourceType === "case_study",
      status: deriveFulfilmentConsent(sourceType, record),
      supportingEvidence: [],
      missing: sourceType === "case_study" ? ["Publication consent"] : [],
    },
    artifact: {
      required: requiresArtifact,
      status: artifactStatus,
      artifactIds: sourceType === "product_artifact" ? [sourceId] : [],
      artifactRoutes: adminRoute ? [adminRoute] : [],
      missing: requiresArtifact && artifactStatus === "missing"
        ? [`Generated artefact for "${productCode}"`]
        : [],
    },
    publication: {
      relevant: sourceType === "case_study",
      allowed: sourceType === "case_study"
        ? readString(record, "consentStatus") === "GRANTED"
        : false,
      reason: sourceType === "case_study"
        ? "Case study publication requires consent and verification."
        : "This fulfilment item is not a publication subject.",
      missing: sourceType === "case_study" && readString(record, "consentStatus") !== "GRANTED"
        ? ["Publication consent"]
        : [],
    },
    blockers: adapterBlockers.map((b) => ({
      code: b.code,
      label: b.code === "paid_without_fulfilment"
        ? "Paid but not fulfilled"
        : b.code === "delivery_claim_without_artifact"
          ? "Delivery claimed without artefact"
          : b.code === "missing_operator_action"
            ? "Operator action required"
            : b.code === "draft_without_review_path"
              ? "Draft without review path"
              : b.code === "fulfilment_incomplete"
                ? "Fulfilment incomplete"
                : b.code === "missing_consent"
                  ? "Required consent is missing"
                  : "Fulfilment issue",
      severity: b.code === "missing_consent"
        ? "blocker"
        : b.code === "draft_without_review_path"
          ? "warning"
          : "blocker",
      explanation: b.explanation,
      evidence: [
        `sourceType=${sourceType}`,
        `productCode=${productCode}`,
        `deliveryStatus=${deliveryStatus ?? "none"}`,
        `generationStatus=${generationStatus ?? "none"}`,
        ...(isOverdue ? ["overdue=true"] : []),
      ],
      affectedItems: [sourceId],
      requiredAction: b.requiredAction,
      actionOwner: "operator",
      canAutomate: false,
    })),
    nextActions,
    memory: {
      recurrenceCount: 1,
      currentStage: stage,
      regressionDetected: false,
      resolvedSinceLastRun: false,
    },
    safeToShowUser: stage === "delivered" || stage === "published",
    safeToShowOperator: true,
    safeToAutomate: false,
    sourceOfTruth: [
      "lib/fulfilment/estate-fulfilment-service.ts",
      "lib/commercial/catalog.ts",
    ],
    raw: {
      sourceType,
      deliveryStatus,
      generationStatus,
      proofStatus,
      isOverdue,
      adminRoute,
      nextAction: nextActionText,
    },
  };
}

// ─── Helper: isDelivered ──────────────────────────────────────────────────────

function isDelivered(stage: LivingStateStage): boolean {
  return stage === "delivered" || stage === "published";
}

// ─── Proof-case fulfilment records ────────────────────────────────────────────
//
// These exercise the adapter generically — they are NOT hardcoded to Boardroom.
// They test different fulfilment scenarios across different source types.

function fulfilmentProofRecords(): Record<string, unknown>[] {
  return [
    {
      sourceType: "boardroom_brief_order",
      sourceId: "fulfilment-proof-paid-order",
      productCode: "boardroom_brief",
      deliveryStatus: "paid",
      generationStatus: null,
      proofStatus: null,
      isOverdue: false,
      adminRoute: "/admin/boardroom/orders/fulfilment-proof-paid-order",
      nextAction: "Start review",
    },
    {
      sourceType: "product_artifact",
      sourceId: "fulfilment-proof-draft-artifact",
      productCode: "boardroom_brief",
      deliveryStatus: "draft_generated",
      generationStatus: "DRAFT",
      proofStatus: null,
      isOverdue: false,
      adminRoute: "/admin/artifacts",
      nextAction: "Review draft",
    },
    {
      sourceType: "boardroom_brief_order",
      sourceId: "fulfilment-proof-delivery-claim",
      productCode: "boardroom_brief",
      deliveryStatus: "delivered",
      generationStatus: "PENDING",
      proofStatus: null,
      isOverdue: false,
      adminRoute: "/admin/boardroom/orders/fulfilment-proof-delivery-claim",
      nextAction: "Verify delivery",
    },
    {
      sourceType: "case_study",
      sourceId: "fulfilment-proof-case-study",
      productCode: "case_study",
      deliveryStatus: "DRAFT",
      generationStatus: "DRAFT",
      consentStatus: "MISSING",
      proofStatus: null,
      isOverdue: false,
      adminRoute: "/admin/case-studies",
      nextAction: "Review draft and request consent",
    },
  ];
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export const fulfilmentAdapter: LivingDomainAdapter = {
  domain: "fulfilment",
  label: "Fulfilment",
  detect(records) {
    return records.some(
      (record) =>
        typeof record["sourceType"] === "string" &&
        FULFILMENT_SOURCE_TYPES.includes(record["sourceType"] as FulfilmentSourceType),
    );
  },
  map(input: LivingDomainAdapterInput) {
    return input.records.map((record) => mapOne(record, input));
  },
};

export default fulfilmentAdapter;
