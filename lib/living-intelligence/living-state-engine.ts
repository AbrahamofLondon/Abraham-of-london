/**
 * lib/living-intelligence/living-state-engine.ts
 *
 * The intelligence of the Living State layer. Adapters translate raw records
 * into pre-engine LivingStateObjects; this engine applies the cross-cutting
 * rules that are identical across every domain and derives blockers, next
 * actions, and safety flags.
 *
 * Hard governance invariants (the system REFUSES to infer these):
 *   - It never marks something approved, published, verified, consented, or
 *     delivered on its own. Those are human/owner/admin/reviewer actions.
 *   - It never claims a repair route exists when it does not.
 *   - It never marks an object user-safe when unresolved internal blockers
 *     would leak operator/admin detail to a user.
 *   - It never marks an action auto-safe when it requires human judgement.
 *
 * The presentation layer must stay dumb: it renders what this engine decided.
 */

import {
  LIVING_STATE_SEVERITY_RANK,
  type LivingStateActionType,
  type LivingStateActor,
  type LivingStateBlocker,
  type LivingStateBlockerCode,
  type LivingStateNextAction,
  type LivingStateObject,
  type LivingStateSeverity,
  type LivingStateStage,
} from "@/lib/living-intelligence/living-state-object-contract";
import { resolveRepairRoute } from "@/lib/living-intelligence/living-state-route-map";

// ─── Stage classifications ───────────────────────────────────────────────────

/** Stages that assert an outcome the system must never fabricate. */
const OUTCOME_CLAIMED_STAGES: ReadonlySet<LivingStateStage> = new Set([
  "approved",
  "published",
  "delivered",
]);

/** Stages where the subject is mid-flight and consent/evidence gaps are fatal. */
const IN_FLIGHT_PUBLICATION_STAGES: ReadonlySet<LivingStateStage> = new Set([
  "draft_generated",
  "artifact_incomplete",
  "awaiting_evidence",
  "awaiting_verification",
  "awaiting_consent",
  "awaiting_review",
  "ready_for_review",
]);

/** Blocker codes that must never be exposed verbatim to an end user. */
const UNSAFE_FOR_USER_CODES: ReadonlySet<LivingStateBlockerCode> = new Set([
  "missing_operator_action",
  "missing_repair_path",
  "route_missing",
  "status_contradiction",
  "source_of_truth_conflict",
  "lifecycle_conflict",
  "checkout_permission_conflict",
  "owner_decision_required",
]);

// ─── Blocker metadata defaults ───────────────────────────────────────────────

type BlockerMeta = {
  label: string;
  severity: LivingStateSeverity;
  owner: LivingStateActor;
  actionType: LivingStateActionType;
  canAutomate: boolean;
};

const BLOCKER_META: Record<LivingStateBlockerCode, BlockerMeta> = {
  missing_artifact: { label: "Required artifact is missing", severity: "blocker", owner: "operator", actionType: "generate_artifact", canAutomate: false },
  stub_artifact_only: { label: "Only a stub artifact exists", severity: "blocker", owner: "operator", actionType: "regenerate_artifact", canAutomate: false },
  missing_evidence: { label: "Required evidence is missing", severity: "blocker", owner: "operator", actionType: "request_more_evidence", canAutomate: false },
  unverified_evidence: { label: "Evidence is not yet verified", severity: "blocker", owner: "reviewer", actionType: "verify_evidence", canAutomate: false },
  missing_consent: { label: "Required consent is missing", severity: "blocker", owner: "client", actionType: "request_consent", canAutomate: false },
  pending_consent: { label: "Consent is pending", severity: "blocker", owner: "client", actionType: "request_consent", canAutomate: false },
  publication_not_allowed: { label: "Publication is not permitted in this state", severity: "blocker", owner: "admin", actionType: "block_publication", canAutomate: false },
  verification_not_allowed: { label: "Verification cannot proceed yet", severity: "blocker", owner: "reviewer", actionType: "verify_evidence", canAutomate: false },
  missing_repair_path: { label: "No repair route exists for this blocker", severity: "blocker", owner: "operator", actionType: "create_missing_route", canAutomate: false },
  missing_operator_action: { label: "An operator action is required but undefined", severity: "blocker", owner: "operator", actionType: "escalate", canAutomate: false },
  status_contradiction: { label: "Status contradicts the evidence", severity: "blocker", owner: "operator", actionType: "repair_case", canAutomate: false },
  fulfilment_incomplete: { label: "Fulfilment is incomplete", severity: "blocker", owner: "operator", actionType: "generate_artifact", canAutomate: false },
  delivery_claim_without_artifact: { label: "Delivery is claimed without a delivered artifact", severity: "blocker", owner: "operator", actionType: "regenerate_artifact", canAutomate: false },
  paid_without_fulfilment: { label: "Paid but not fulfilled", severity: "blocker", owner: "operator", actionType: "generate_artifact", canAutomate: false },
  draft_without_review_path: { label: "Draft exists with no review route", severity: "blocker", owner: "operator", actionType: "create_missing_route", canAutomate: false },
  assessment_without_memory: { label: "Continuity promised but no memory written", severity: "blocker", owner: "system", actionType: "write_memory", canAutomate: true },
  diagnostic_without_evidence_posture: { label: "Diagnostic result has no evidence posture", severity: "warning", owner: "operator", actionType: "request_more_evidence", canAutomate: false },
  component_without_live_state: { label: "Living component has no live state binding", severity: "warning", owner: "operator", actionType: "repair_case", canAutomate: false },
  route_missing: { label: "A referenced route does not exist", severity: "blocker", owner: "operator", actionType: "create_missing_route", canAutomate: false },
  owner_decision_required: { label: "An explicit owner decision is required", severity: "governed_tension", owner: "founder", actionType: "escalate", canAutomate: false },
  unsafe_to_show_user: { label: "Not safe to show the user in current state", severity: "warning", owner: "operator", actionType: "show_operator_warning", canAutomate: false },
  unsafe_to_automate: { label: "Not safe to automate in current state", severity: "warning", owner: "operator", actionType: "do_not_proceed", canAutomate: false },
  source_of_truth_conflict: { label: "Sources of truth disagree", severity: "blocker", owner: "operator", actionType: "repair_case", canAutomate: false },
  lifecycle_conflict: { label: "Lifecycle state conflicts with the surface", severity: "blocker", owner: "admin", actionType: "block_publication", canAutomate: false },
  checkout_permission_conflict: { label: "Checkout permission conflicts with governance", severity: "blocker", owner: "admin", actionType: "do_not_proceed", canAutomate: false },
};

// ─── Engine ──────────────────────────────────────────────────────────────────

export type EvaluateContext = {
  availableRoutes?: string[];
};

function maxSeverity(blockers: LivingStateBlocker[]): LivingStateSeverity | null {
  let best: LivingStateSeverity | null = null;
  for (const b of blockers) {
    if (best === null || LIVING_STATE_SEVERITY_RANK[b.severity] > LIVING_STATE_SEVERITY_RANK[best]) {
      best = b.severity;
    }
  }
  return best;
}

/**
 * Evaluate a single (pre-engine) LivingStateObject: append the cross-cutting
 * blockers, derive next actions, and set safety flags. Idempotent and pure.
 */
export function evaluateLivingStateObject(
  object: LivingStateObject,
  context: EvaluateContext = {},
): LivingStateObject {
  const availableRoutes = context.availableRoutes ?? [];
  const stage = object.currentStage;
  const outcomeClaimed = OUTCOME_CLAIMED_STAGES.has(stage);

  // Start from any blockers the adapter already attached; dedupe by code later.
  const derived: LivingStateBlocker[] = [];

  const add = (
    code: LivingStateBlockerCode,
    overrides: Partial<Omit<LivingStateBlocker, "code">> & {
      explanation: string;
      requiredAction: string;
    },
  ): void => {
    const meta = BLOCKER_META[code];
    const repair = resolveRepairRoute(object.domain, code, availableRoutes);
    const blocker: LivingStateBlocker = {
      code,
      label: overrides.label ?? meta.label,
      severity: overrides.severity ?? meta.severity,
      explanation: overrides.explanation,
      evidence: overrides.evidence ?? [],
      affectedItems: overrides.affectedItems ?? [object.title],
      requiredAction: overrides.requiredAction,
      actionOwner: overrides.actionOwner ?? meta.owner,
      canAutomate: overrides.canAutomate ?? meta.canAutomate,
      ...(repair.route ? { repairRoute: repair.route } : {}),
    };
    derived.push(blocker);

    // If a canonical repair surface is defined but does not exist, surface it.
    if (repair.route && repair.missing) {
      derived.push({
        code: "missing_repair_path",
        label: BLOCKER_META.missing_repair_path.label,
        severity: "blocker",
        explanation: `The repair surface "${repair.route}" needed to resolve "${code}" does not exist in the application.`,
        evidence: [`expected route: ${repair.route}`],
        affectedItems: [object.title],
        requiredAction: `Create the operator route ${repair.route} so this blocker can be resolved.`,
        actionOwner: "operator",
        canAutomate: false,
      });
    }
  };

  // ── A. Evidence rules ──────────────────────────────────────────────────────
  const ev = object.evidence;
  const evidenceUnsound =
    ev.status === "unverified" ||
    ev.status === "contradictory" ||
    ev.status === "needs_human_review" ||
    ev.status === "inferred";

  if (ev.status === "contradictory") {
    add("status_contradiction", {
      explanation: "The recorded evidence is internally contradictory.",
      requiredAction: "Reconcile the conflicting evidence before this can advance.",
      evidence: ev.supportingEvidence,
    });
  }
  if (ev.missingEvidence.length > 0) {
    add("missing_evidence", {
      severity: outcomeClaimed ? "blocker" : "warning",
      explanation: `Evidence is missing: ${ev.missingEvidence.join("; ")}.`,
      requiredAction: "Gather the missing evidence before proceeding.",
      evidence: ev.missingEvidence,
    });
  }
  if (evidenceUnsound && (outcomeClaimed || object.publication.relevant)) {
    add("unverified_evidence", {
      severity: outcomeClaimed ? "blocker" : "warning",
      explanation: `Evidence posture is "${ev.status}" but the state claims an outcome or publication.`,
      requiredAction: "Verify the evidence with a human reviewer before this proceeds.",
      evidence: ev.supportingEvidence,
    });
  }

  // ── B. Consent rules ────────────────────────────────────────────────────────
  const consent = object.consent;
  if (consent.required && consent.status === "pending") {
    add("pending_consent", {
      severity: object.publication.relevant || outcomeClaimed ? "blocker" : "warning",
      explanation: "Consent is required and still pending.",
      requiredAction: "Obtain explicit consent before publication or delivery.",
      evidence: consent.supportingEvidence,
    });
  }
  if (consent.required && consent.status === "missing") {
    add("missing_consent", {
      explanation: "Consent is required but has not been requested.",
      requiredAction: "Request and record consent before any user-visible publication.",
      evidence: consent.missing,
    });
  }

  // ── C. Artifact rules ───────────────────────────────────────────────────────
  const artifact = object.artifact;
  if (artifact.required) {
    if (artifact.status === "missing") {
      add("missing_artifact", {
        explanation: "An artifact is required for this subject but none exists.",
        requiredAction: "Generate the required artifact.",
        evidence: artifact.missing,
      });
    }
    if (artifact.status === "stub_only") {
      add("stub_artifact_only", {
        explanation: "Only a stub/placeholder artifact exists; no generated deliverable.",
        requiredAction: "Generate the real artifact to replace the stub.",
        evidence: artifact.missing,
      });
    }
    if (artifact.status === "draft") {
      const reviewRoute = resolveRepairRoute(object.domain, "draft_without_review_path", availableRoutes);
      if (!reviewRoute.route || reviewRoute.missing) {
        add("draft_without_review_path", {
          explanation: "A draft artifact exists but there is no route to review it.",
          requiredAction: "Create a review route before this draft can advance.",
        });
      }
    }
  }
  // Outcome claimed but artifact not actually delivered/approved/generated.
  if (artifact.required && outcomeClaimed) {
    const delivered =
      artifact.status === "generated" ||
      artifact.status === "approved" ||
      artifact.status === "delivered";
    if (!delivered) {
      add("delivery_claim_without_artifact", {
        explanation: `Stage is "${stage}" but the artifact status is "${artifact.status}".`,
        requiredAction: "Do not claim delivery until a real artifact is generated and reviewed.",
      });
    }
  }

  // ── D. Publication rules ────────────────────────────────────────────────────
  const pub = object.publication;
  if (pub.relevant && !pub.allowed) {
    add("publication_not_allowed", {
      explanation: pub.reason || "Publication is not permitted in the current state.",
      requiredAction: "Resolve the publication preconditions before publishing.",
      evidence: pub.missing,
    });
  }
  if (pub.relevant && pub.allowed && IN_FLIGHT_PUBLICATION_STAGES.has(stage)) {
    add("lifecycle_conflict", {
      explanation: `Publication is marked allowed but the subject is still "${stage}".`,
      requiredAction: "Reconcile lifecycle state and publication permission.",
    });
  }

  // ── E. Fulfilment rules ─────────────────────────────────────────────────────
  if (stage === "paid" && artifact.required) {
    const fulfilled =
      artifact.status === "generated" ||
      artifact.status === "approved" ||
      artifact.status === "delivered";
    if (!fulfilled) {
      add("paid_without_fulfilment", {
        explanation: "Payment is recorded but no fulfilment artifact has been produced.",
        requiredAction: "Produce and review the fulfilment artifact for this paid subject.",
      });
    }
  }

  // ── F. Assessment / diagnostic rules ────────────────────────────────────────
  if (object.domain === "assessment" || object.domain === "diagnostic") {
    if (ev.supportingEvidence.length === 0) {
      add("diagnostic_without_evidence_posture", {
        explanation: "An assessment/diagnostic result was produced without a stated evidence posture.",
        requiredAction: "Attach the evidence posture that supports this result.",
      });
    }
    const continuityPromised = object.raw?.["continuityPromised"] === true;
    const memoryWritten = object.raw?.["memoryWritten"] === true;
    if (continuityPromised && !memoryWritten) {
      add("assessment_without_memory", {
        explanation: "Continuity was promised to the user but no durable memory was written.",
        requiredAction: "Write the continuity memory or stop promising continuity.",
      });
    }
  }

  // ── Merge adapter blockers + derived, dedupe by code ───────────────────────
  const byCode = new Map<LivingStateBlockerCode, LivingStateBlocker>();
  for (const b of [...object.blockers, ...derived]) {
    const existing = byCode.get(b.code);
    if (!existing || LIVING_STATE_SEVERITY_RANK[b.severity] > LIVING_STATE_SEVERITY_RANK[existing.severity]) {
      byCode.set(b.code, b);
    }
  }
  const blockers = [...byCode.values()].sort(
    (a, b) => LIVING_STATE_SEVERITY_RANK[b.severity] - LIVING_STATE_SEVERITY_RANK[a.severity],
  );

  // ── Derive next actions from blockers (+ keep adapter-provided ones) ────────
  const nextActions: LivingStateNextAction[] = [...object.nextActions];
  const seenActions = new Set(nextActions.map((a) => `${a.actionType}:${a.label}`));
  for (const b of blockers) {
    const meta = BLOCKER_META[b.code];
    const label = b.requiredAction;
    const key = `${meta.actionType}:${label}`;
    if (seenActions.has(key)) continue;
    seenActions.add(key);
    nextActions.push({
      label,
      description: b.explanation,
      owner: b.actionOwner,
      actionType: meta.actionType,
      ...(b.repairRoute ? { route: b.repairRoute } : {}),
      safeToAutomate: false,
      requiredEvidence: b.evidence,
    });
  }

  const topSeverity = maxSeverity(blockers);
  const hasHardBlocker = topSeverity === "blocker";

  // ── Do-not-proceed when a hard blocker prevents an outcome ──────────────────
  if (hasHardBlocker) {
    const key = "do_not_proceed:Do not approve, publish, or deliver in this state";
    if (!seenActions.has(key)) {
      seenActions.add(key);
      nextActions.unshift({
        label: "Do not approve, publish, or deliver in this state",
        description: "Unresolved blockers prevent this subject from being safely advanced.",
        owner: "operator",
        actionType: "do_not_proceed",
        safeToAutomate: false,
        requiredEvidence: [],
      });
    }
  }

  // ── G. User visibility ──────────────────────────────────────────────────────
  const leaksInternal = blockers.some((b) => UNSAFE_FOR_USER_CODES.has(b.code));
  const safeToShowUser =
    object.safeToShowUser && !leaksInternal && ev.status !== "contradictory";

  // ── H. Automation ───────────────────────────────────────────────────────────
  const safeToAutomate =
    object.safeToAutomate &&
    !hasHardBlocker &&
    blockers.every((b) => b.canAutomate) &&
    !OUTCOME_CLAIMED_STAGES.has(stage);

  return {
    ...object,
    blockers,
    nextActions,
    safeToShowUser,
    safeToShowOperator: object.safeToShowOperator,
    safeToAutomate,
  };
}

// ─── Estate-level evaluation ─────────────────────────────────────────────────

export type LivingStateEstateSummary = {
  total: number;
  blocked: number;
  awaitingVerification: number;
  awaitingConsent: number;
  artifactIncomplete: number;
  missingRepairRoute: number;
  readyForReview: number;
  unsafeToShowUser: number;
  unsafeToAutomate: number;
};

export function evaluateLivingStateEstate(input: {
  objects: LivingStateObject[];
  previousMemory?: Record<string, unknown>;
  availableRoutes: string[];
}): { objects: LivingStateObject[]; summary: LivingStateEstateSummary } {
  const evaluated = input.objects.map((object) =>
    evaluateLivingStateObject(object, { availableRoutes: input.availableRoutes }),
  );

  const summary: LivingStateEstateSummary = {
    total: evaluated.length,
    blocked: 0,
    awaitingVerification: 0,
    awaitingConsent: 0,
    artifactIncomplete: 0,
    missingRepairRoute: 0,
    readyForReview: 0,
    unsafeToShowUser: 0,
    unsafeToAutomate: 0,
  };

  for (const object of evaluated) {
    const codes = new Set(object.blockers.map((b) => b.code));
    if (object.blockers.some((b) => b.severity === "blocker")) summary.blocked += 1;
    if (codes.has("unverified_evidence") || codes.has("verification_not_allowed")) summary.awaitingVerification += 1;
    if (codes.has("pending_consent") || codes.has("missing_consent")) summary.awaitingConsent += 1;
    if (codes.has("missing_artifact") || codes.has("stub_artifact_only") || object.artifact.status === "incomplete") summary.artifactIncomplete += 1;
    if (codes.has("missing_repair_path") || codes.has("route_missing")) summary.missingRepairRoute += 1;
    if (object.currentStage === "ready_for_review" || object.currentStage === "awaiting_review") summary.readyForReview += 1;
    if (!object.safeToShowUser) summary.unsafeToShowUser += 1;
    if (!object.safeToAutomate) summary.unsafeToAutomate += 1;
  }

  return { objects: evaluated, summary };
}
