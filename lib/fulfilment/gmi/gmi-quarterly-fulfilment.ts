/**
 * lib/fulfilment/gmi/gmi-quarterly-fulfilment.ts
 *
 * Reusable GMI product-family fulfilment infrastructure. It COMPOSES the existing
 * GMI release controls (lifecycle authority, release-candidate checklist / source
 * blockers, prior-call review, DII/quality gate, owner release authority) into a
 * single release gate + delivery guard + edition-bound delivery proof, and plugs
 * into the PR F execution authority. It does NOT publish, supersede, activate
 * checkout, or bind Stripe — publication authority never infers commerce.
 *
 * The edition remains temporally gated (CONTROLLED_RELEASE_READY by design) even
 * though the family infrastructure is complete.
 */

import {
  type MarketIntelligenceLifecycleRecord,
  type MarketIntelligenceLifecycleState,
  getMarketIntelligenceRecord,
} from "@/lib/intelligence/market-intelligence-lifecycle";
import {
  buildGmiReleaseChecklist,
  getBlockingChecklistItems,
} from "@/lib/intelligence/gmi-release-candidate-checklist";

export const GMI_QUARTERLY_PRODUCT_CODE = "gmi_quarterly";
export const GMI_PRODUCT_FAMILY = "GLOBAL_MARKET_INTELLIGENCE";

// ── Release context (signals composed from existing controls) ─────────────────

export interface GmiOwnerAuthority {
  authorisedBy: string;
  authorityRef: string;
  authorisedAt: string;
}

export interface GmiReleaseContext {
  dataLockComplete: boolean;
  sourceBlockersClear: boolean;
  priorCallReviewComplete: boolean;
  humanReviewComplete: boolean;
  ownerReleaseAuthority: GmiOwnerAuthority | null;
  /** the artifact hash approved for release (owner-approved). */
  approvedArtifactHash: string | null;
}

export interface GmiBlockerNote {
  code: string;
  detail: string;
}

export interface GmiReleaseDecision {
  editionId: string;
  editionVersion: string;
  lifecycleState: MarketIntelligenceLifecycleState;
  blockers: GmiBlockerNote[];
  /** the DRAFT→ACTIVE release transition is authorised (all gates + owner authority). */
  canPublish: boolean;
  /** access may be granted (edition is actually in a published state). */
  canGrantAccess: boolean;
  /** delivery may proceed (published + an approved artifact exists). */
  canDeliver: boolean;
  /** predecessor may be superseded (successor is ACTUALLY released, not merely publishable). */
  canSupersedePredecessor: boolean;
  /**
   * Publication authority NEVER infers commercial activation. This is a constant
   * proof surface: releasing an edition does not turn on checkout or Stripe.
   */
  commercialInference: { checkoutActivated: false; stripeProductId: null; stripePriceId: null };
}

function isPublished(state: MarketIntelligenceLifecycleState): boolean {
  return state === "ACTIVE" || state === "ACTIVE_UNTIL_SUPERSEDED";
}

/** Evaluate the release gate for an edition record + composed context. Pure. */
export function evaluateGmiReleaseGate(
  record: MarketIntelligenceLifecycleRecord,
  context: GmiReleaseContext,
): GmiReleaseDecision {
  const blockers: GmiBlockerNote[] = [];
  const published = isPublished(record.lifecycleState);
  const isDraft = record.lifecycleState === "DRAFT" || record.lifecycleState === "SCHEDULED";

  if (!context.dataLockComplete) blockers.push({ code: "DATA_LOCK_PENDING", detail: "Required data lock is not complete." });
  if (!context.sourceBlockersClear) blockers.push({ code: "SOURCE_BLOCKERS_OUTSTANDING", detail: "Release-blocking source rows remain unresolved." });
  if (!context.priorCallReviewComplete) blockers.push({ code: "PRIOR_CALL_REVIEW_INCOMPLETE", detail: "Prior-quarter material calls are not fully reviewed/scored." });
  if (!context.humanReviewComplete) blockers.push({ code: "HUMAN_REVIEW_INCOMPLETE", detail: "Mandatory editorial human review is not complete." });
  if (!context.ownerReleaseAuthority) blockers.push({ code: "OWNER_AUTHORITY_MISSING", detail: "Owner release authority has not been supplied." });
  if (!context.approvedArtifactHash) blockers.push({ code: "NO_APPROVED_ARTIFACT", detail: "No owner-approved artifact hash on record." });

  const gatesPass =
    context.dataLockComplete &&
    context.sourceBlockersClear &&
    context.priorCallReviewComplete &&
    context.humanReviewComplete &&
    Boolean(context.ownerReleaseAuthority) &&
    Boolean(context.approvedArtifactHash);

  // canPublish authorises the DRAFT→ACTIVE transition (requires all gates).
  const canPublish = gatesPass;
  // access/delivery/supersession require the edition to ACTUALLY be published.
  const canGrantAccess = published && gatesPass;
  const canDeliver = canGrantAccess && Boolean(context.approvedArtifactHash);
  // A predecessor may only be superseded once the successor is actually released.
  const canSupersedePredecessor = published && gatesPass;

  if (isDraft) blockers.push({ code: "DRAFT_NOT_DELIVERABLE", detail: "Edition is DRAFT/SCHEDULED; access and delivery are not permitted until it is actually released." });

  return {
    editionId: record.id,
    editionVersion: record.version ?? "unknown",
    lifecycleState: record.lifecycleState,
    blockers,
    canPublish,
    canGrantAccess,
    canDeliver,
    canSupersedePredecessor,
    commercialInference: { checkoutActivated: false, stripeProductId: null, stripePriceId: null },
  };
}

export function evaluateGmiReleaseGateById(editionId: string, context: GmiReleaseContext): GmiReleaseDecision | null {
  const record = getMarketIntelligenceRecord(editionId);
  if (!record) return null;
  return evaluateGmiReleaseGate(record, context);
}

/**
 * Runtime context derived from existing controls for a REAL edition. Data lock,
 * human review, and owner authority are treated as outstanding unless explicitly
 * supplied — the safe default. Source blockers + prior-call review come from the
 * release-candidate checklist. (Q2 therefore evaluates as fully gated.)
 */
export function deriveGmiReleaseContextFromControls(
  editionId: string,
  supplied?: Partial<GmiReleaseContext>,
): GmiReleaseContext {
  const checklist = buildGmiReleaseChecklist(editionId);
  const blocking = getBlockingChecklistItems(checklist);
  const sourceBlockersClear = !blocking.some((i) => i.category === "SOURCE_APPENDIX");
  const priorCallReviewComplete = !blocking.some((i) => i.id === "PRIOR_QUARTER_CALL_REVIEW");
  return {
    dataLockComplete: false,
    sourceBlockersClear,
    priorCallReviewComplete,
    humanReviewComplete: false,
    ownerReleaseAuthority: null,
    approvedArtifactHash: null,
    ...supplied,
  };
}

// ── Edition-bound delivery proof ──────────────────────────────────────────────

export interface GmiDeliveryProof {
  productFamily: typeof GMI_PRODUCT_FAMILY;
  editionId: string;
  editionVersion: string;
  artifactHash: string;
  lifecycleStateAtDelivery: MarketIntelligenceLifecycleState;
  publicationAuthorityRef: string;
  accessRecipient: string;
  deliveryChannel: string;
  deliveredAt: string;
}

export type GmiDeliveryDecision =
  | { ok: true }
  | { ok: false; blockers: GmiBlockerNote[] };

/** Delivery guard: gate must permit delivery AND the delivered hash must equal the approved hash. */
export function assertGmiDeliveryAllowed(
  record: MarketIntelligenceLifecycleRecord,
  context: GmiReleaseContext,
  deliveredArtifactHash: string,
): GmiDeliveryDecision {
  const decision = evaluateGmiReleaseGate(record, context);
  const blockers = [...decision.blockers];
  if (!decision.canDeliver) {
    if (!blockers.some((b) => b.code === "DRAFT_NOT_DELIVERABLE" || b.code === "OWNER_AUTHORITY_MISSING")) {
      blockers.push({ code: "DELIVERY_NOT_PERMITTED", detail: `Delivery not permitted in state ${record.lifecycleState}.` });
    }
  }
  if (context.approvedArtifactHash && deliveredArtifactHash !== context.approvedArtifactHash) {
    blockers.push({ code: "ARTIFACT_HASH_MISMATCH", detail: "Delivered artifact hash differs from the owner-approved artifact." });
  }
  return blockers.length === 0 ? { ok: true } : { ok: false, blockers };
}

export function buildGmiDeliveryProof(
  record: MarketIntelligenceLifecycleRecord,
  context: GmiReleaseContext,
  delivery: { deliveredArtifactHash: string; accessRecipient: string; deliveryChannel: string },
): GmiDeliveryProof {
  const guard = assertGmiDeliveryAllowed(record, context, delivery.deliveredArtifactHash);
  if (!guard.ok) {
    throw new Error(`Refusing to build a GMI delivery proof — delivery not allowed: ${guard.blockers.map((b) => b.code).join(", ")}`);
  }
  return {
    productFamily: GMI_PRODUCT_FAMILY,
    editionId: record.id,
    editionVersion: record.version ?? "unknown",
    artifactHash: delivery.deliveredArtifactHash,
    lifecycleStateAtDelivery: record.lifecycleState,
    publicationAuthorityRef: context.ownerReleaseAuthority!.authorityRef,
    accessRecipient: delivery.accessRecipient,
    deliveryChannel: delivery.deliveryChannel,
    deliveredAt: new Date().toISOString(),
  };
}

/** A proof only satisfies the exact edition + exact artifact hash it was bound to. */
export function gmiProofSatisfies(proof: GmiDeliveryProof, expected: { editionId: string; artifactHash: string }): boolean {
  return proof.editionId === expected.editionId && proof.artifactHash === expected.artifactHash;
}
