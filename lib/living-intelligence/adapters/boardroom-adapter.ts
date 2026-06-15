/**
 * lib/living-intelligence/adapters/boardroom-adapter.ts
 *
 * Boardroom domain adapter. Translates Boardroom brief-order records into
 * pre-engine LivingStateObjects. The Boardroom case is only ONE proof case for
 * the reusable architecture — this adapter invents no state logic; it maps the
 * real Boardroom delivery state machine (boardroom-delivery-state-machine.shared)
 * and value-readiness gate into the shared contract, and lets the engine apply
 * the cross-cutting rules.
 *
 * Source of truth (non-negotiable):
 *   - lib/boardroom/boardroom-delivery-state-machine.shared.ts  (delivery stage)
 *   - lib/boardroom/boardroom-value-readiness.ts                (approval gate)
 */

import {
  DELIVERY_STATUS_LABELS,
  mapLegacyStatus,
  type BoardroomArtifactStatus,
  type BoardroomDeliveryStatus,
} from "@/lib/boardroom/boardroom-delivery-state-machine.shared";
import {
  readBool,
  readNumber,
  readString,
  readStringArray,
  type LivingDomainAdapter,
  type LivingDomainAdapterInput,
} from "@/lib/living-intelligence/living-domain-adapter-contract";
import type {
  LivingStateArtifactStatus,
  LivingStateEvidenceStatus,
  LivingStateObject,
  LivingStateStage,
} from "@/lib/living-intelligence/living-state-object-contract";

const KNOWN_DELIVERY_STATUSES: ReadonlySet<string> = new Set<BoardroomDeliveryStatus>([
  "paid",
  "case_stubs_created",
  "draft_generated",
  "awaiting_operator_review",
  "approved_for_delivery",
  "customer_access_ready",
  "delivered",
  "blocked",
  "failed",
]);

function toDeliveryStatus(raw: string | undefined): BoardroomDeliveryStatus {
  if (raw && KNOWN_DELIVERY_STATUSES.has(raw)) return raw as BoardroomDeliveryStatus;
  return mapLegacyStatus(raw ?? "paid");
}

function deliveryToStage(status: BoardroomDeliveryStatus): LivingStateStage {
  switch (status) {
    case "paid":
      return "paid";
    case "case_stubs_created":
      return "processing";
    case "draft_generated":
      return "draft_generated";
    case "awaiting_operator_review":
      return "awaiting_review";
    case "approved_for_delivery":
      return "approved";
    case "customer_access_ready":
      return "approved";
    case "delivered":
      return "delivered";
    case "blocked":
      return "blocked";
    case "failed":
      return "failed";
  }
}

function artifactToStatus(
  raw: string | undefined,
  delivery: BoardroomDeliveryStatus,
): LivingStateArtifactStatus {
  switch (raw as BoardroomArtifactStatus | undefined) {
    case "DRAFT":
      return "draft";
    case "AWAITING_REVIEW":
      return "awaiting_review";
    case "READY":
      return "generated";
    case "READY_FOR_DELIVERY":
      return "approved";
    case "DELIVERED":
      return "delivered";
    case "FAILED":
      return "incomplete";
    case "PENDING":
    case "REVOKED":
    case undefined:
    default:
      // No real artifact yet. If only stubs have been created, that is a stub —
      // not nothing, but also not a generated deliverable.
      return delivery === "case_stubs_created" ? "stub_only" : "missing";
  }
}

function deriveEvidenceStatus(
  record: Record<string, unknown>,
  delivery: BoardroomDeliveryStatus,
  approvalAllowed: boolean,
): LivingStateEvidenceStatus {
  const explicit = readString(record, "evidencePosture");
  const allowed: ReadonlySet<string> = new Set<LivingStateEvidenceStatus>([
    "verified",
    "strongly_indicated",
    "weakly_indicated",
    "inferred",
    "unverified",
    "contradictory",
    "needs_human_review",
  ]);
  if (explicit && allowed.has(explicit)) return explicit as LivingStateEvidenceStatus;
  if (delivery === "delivered") return "verified";
  if (approvalAllowed) return "strongly_indicated";
  return "unverified";
}

function mapOne(
  record: Record<string, unknown>,
  input: LivingDomainAdapterInput,
): LivingStateObject {
  const id =
    readString(record, "orderId") ??
    readString(record, "id") ??
    `boardroom-${Math.random().toString(36).slice(2, 10)}`;

  const delivery = toDeliveryStatus(readString(record, "deliveryStatus"));
  const stage = deliveryToStage(delivery);

  const approvalAllowed = readBool(record, "approvalAllowed") ?? false;
  const blockingReasons = readStringArray(record, "blockingReasons");
  const valueScore = readNumber(record, "valueScoreOutOf10");

  const artifactStatus = artifactToStatus(readString(record, "artifactStatus"), delivery);
  const adminPreviewUrl = readString(record, "adminPreviewUrl");
  const customerAccessUrl = readString(record, "customerAccessUrl");

  const evidenceStatus = deriveEvidenceStatus(record, delivery, approvalAllowed);
  const supportingEvidence = readStringArray(record, "supportingEvidence");
  const missingEvidence =
    readStringArray(record, "missingEvidence").length > 0
      ? readStringArray(record, "missingEvidence")
      : blockingReasons;

  const publicationIntended = readBool(record, "publicationIntended") ?? false;
  const consentStatusRaw = readString(record, "consentStatus");
  const consentStatus =
    consentStatusRaw === "granted" ||
    consentStatusRaw === "pending" ||
    consentStatusRaw === "missing" ||
    consentStatusRaw === "not_required"
      ? consentStatusRaw
      : publicationIntended
        ? "missing"
        : "not_required";

  const productCode = readString(record, "productCode") ?? "BOARDROOM_BRIEF";
  const statusLabel = DELIVERY_STATUS_LABELS[delivery];

  const artifactIds = adminPreviewUrl ? [adminPreviewUrl] : [];
  const artifactRoutes = [adminPreviewUrl, customerAccessUrl].filter(
    (route): route is string => typeof route === "string" && route.length > 0,
  );

  const operatorSummary =
    `Boardroom brief order ${id} is "${statusLabel}". ` +
    (approvalAllowed
      ? "Value-readiness gate is satisfied."
      : `Value-readiness gate is NOT satisfied${
          blockingReasons.length > 0 ? `: ${blockingReasons.join("; ")}` : "."
        }`);

  const userVisibleSummary =
    stage === "delivered"
      ? "Your boardroom brief has been delivered."
      : "Your boardroom brief is being prepared. You will be notified when it is ready.";

  return {
    id,
    domain: "boardroom",
    subjectType: "order",
    sourceId: id,
    productCode,
    title: `Boardroom brief order ${id}`,
    currentStage: stage,
    statusLabel,
    userVisibleSummary,
    operatorSummary,
    evidence: {
      status: evidenceStatus,
      supportingEvidence,
      missingEvidence,
      cannotInfer: [
        "Whether the brief is correct enough to act on (requires operator review).",
      ],
    },
    consent: {
      required: publicationIntended,
      status: consentStatus,
      supportingEvidence: [],
      missing:
        consentStatus === "missing" || consentStatus === "pending"
          ? ["Case-study / publication consent from the client."]
          : [],
    },
    artifact: {
      required: true,
      status: artifactStatus,
      artifactIds,
      artifactRoutes,
      missing:
        artifactStatus === "missing" || artifactStatus === "stub_only"
          ? ["Generated boardroom brief deliverable."]
          : [],
    },
    publication: {
      relevant: publicationIntended,
      allowed: publicationIntended ? approvalAllowed && consentStatus === "granted" : false,
      reason: publicationIntended
        ? approvalAllowed
          ? "Publication requires client consent."
          : "Publication requires a passing value-readiness gate and client consent."
        : "This order is not a publication subject.",
      missing: publicationIntended && consentStatus !== "granted" ? ["client consent"] : [],
    },
    blockers: [],
    nextActions: [],
    memory: {
      recurrenceCount: 1,
      currentStage: stage,
      regressionDetected: false,
      resolvedSinceLastRun: false,
    },
    safeToShowUser: stage === "delivered",
    safeToShowOperator: true,
    safeToAutomate: false,
    sourceOfTruth: [
      "lib/boardroom/boardroom-delivery-state-machine.shared.ts",
      "lib/boardroom/boardroom-value-readiness.ts",
    ],
    raw: {
      deliveryStatus: delivery,
      artifactStatus: readString(record, "artifactStatus") ?? null,
      approvalAllowed,
      valueScoreOutOf10: valueScore ?? null,
      hasAdminPreview: Boolean(adminPreviewUrl),
      hasCustomerAccess: Boolean(customerAccessUrl),
    },
  };
}

export const boardroomAdapter: LivingDomainAdapter = {
  domain: "boardroom",
  label: "Boardroom",
  detect(records) {
    return records.some(
      (record) =>
        typeof record["deliveryStatus"] === "string" ||
        typeof record["orderId"] === "string",
    );
  },
  map(input) {
    return input.records.map((record) => mapOne(record, input));
  },
};

export default boardroomAdapter;
