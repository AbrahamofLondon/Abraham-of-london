/**
 * lib/intelligence/compounding/compounding-intelligence.ts
 *
 * The compounding-intelligence loops that sit on the canonical interaction spine
 * (OPP-11 cross-moat brief, OPP-13 governed next-admissible-move, OPP-15 outcome
 * loop, OPP-12 decision-integrity trend). Pure + composable over StrategicTwinState
 * and injected GMI / product views, so the intelligence is deterministically
 * provable without a DB. Runtime binds the injected views to gmi-data-service +
 * the product graph; these functions are the governed brains.
 *
 * Governance invariants enforced here:
 *  - not-advice boundary carried on every customer-facing output;
 *  - reading a GMI edition is an EXPOSURE event, never inferred agreement/adoption;
 *  - a DRAFT edition (e.g. GMI Q2) cannot be treated as released customer intelligence;
 *  - insufficient evidence yields uncertainty, never a fabricated conclusion;
 *  - next-move is state-derived and governance-gated, never revenue-maximising;
 *  - integrity scores measure PROCESS only and must be explainable from events.
 */

import type { StrategicTwinState, Severity } from "@/lib/intelligence/interaction-spine/product-interaction-spine";

export const NOT_ADVICE =
  "Governed decision-support derived from your own recorded decisions and published market judgement. Not legal, financial, or investment advice; bounded by the evidence supplied and subject to the falsification conditions stated.";

// ── OPP-11: cross-moat brief (customer twin × accountable GMI judgement) ───────

export interface GmiScoredCall {
  callId: string;
  statement: string;
  score: number | null; // 0–5 rubric; null = too early
  status: "confirmed" | "partial" | "weak" | "disconfirmed" | "too_early";
  topicKeys: string[]; // normalized topics this call concerns
}
export interface GmiFalsificationTrigger {
  variable: string;
  threshold: string;
  consequence: string;
  topicKeys: string[];
}
export interface GmiEditionView {
  editionId: string;
  editionVersion: string;
  artifactHash: string;
  lifecycleState: "DRAFT" | "ACTIVE" | "ACTIVE_UNTIL_SUPERSEDED" | "SUPERSEDED" | "ARCHIVED";
  regimeThesis: string;
  scoredCalls: GmiScoredCall[];
  falsificationTriggers: GmiFalsificationTrigger[];
  dii: number | null;
  sourceConfidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface CrossMoatIntersection {
  twinKey: string; // contradiction/commitment/signal key on the customer side
  gmiRef: string; // callId or trigger variable
  kind: "exposed_commitment" | "conflicting_assumption" | "applicable_trigger";
  detail: string;
}

export interface CrossMoatBrief {
  caseId: string;
  twinVersion: number;
  editionId: string;
  editionVersion: string;
  artifactHash: string;
  editionReleased: boolean;
  exposureOnly: true; // reading is exposure, never agreement
  regimeThesis: string;
  intersections: CrossMoatIntersection[];
  applicableTriggers: GmiFalsificationTrigger[];
  uncertainty: string[];
  falsificationConditions: string[];
  claimBoundary: string;
  generatedAt: string;
  provenance: { twinCaseId: string; twinVersion: number; editionId: string; artifactHash: string };
}

export class CompoundingError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = "CompoundingError";
    this.code = code;
  }
}

function topicMatch(keys: string[], twinKey: string): boolean {
  const t = twinKey.toLowerCase();
  return keys.some((k) => t.includes(k.toLowerCase()) || k.toLowerCase().includes(t));
}

export function buildCrossMoatBrief(twin: StrategicTwinState, edition: GmiEditionView, now = () => new Date().toISOString()): CrossMoatBrief {
  // A DRAFT edition (e.g. GMI Q2 pre-release) must never be presented as released
  // customer intelligence.
  const editionReleased = edition.lifecycleState === "ACTIVE" || edition.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED";
  if (edition.lifecycleState === "DRAFT") {
    throw new CompoundingError("DRAFT_EDITION_NOT_RELEASABLE", `Edition ${edition.editionId} is DRAFT; it cannot be used as released customer intelligence.`);
  }

  const intersections: CrossMoatIntersection[] = [];
  const twinContradictionKeys = Object.keys(twin.contradictions);
  const twinCommitmentKeys = Object.keys(twin.commitments);

  // Exposed commitments: a customer commitment that a falsification trigger bears on.
  for (const trig of edition.falsificationTriggers) {
    for (const ck of twinCommitmentKeys) {
      if (topicMatch(trig.topicKeys, ck)) {
        intersections.push({ twinKey: ck, gmiRef: trig.variable, kind: "applicable_trigger", detail: `Commitment "${ck}" is exposed to trigger: ${trig.variable} ${trig.threshold} → ${trig.consequence}.` });
      }
    }
  }
  // Conflicting assumptions: a customer contradiction aligned to a scored GMI call.
  for (const call of edition.scoredCalls) {
    for (const xk of twinContradictionKeys) {
      if (topicMatch(call.topicKeys, xk)) {
        intersections.push({ twinKey: xk, gmiRef: call.callId, kind: "conflicting_assumption", detail: `Your unresolved "${xk}" intersects GMI call ${call.callId} (scored ${call.score ?? "too-early"}): ${call.statement}.` });
      }
    }
  }

  const applicableTriggers = edition.falsificationTriggers.filter((t) => intersections.some((i) => i.gmiRef === t.variable));
  const uncertainty = Object.keys(twin.evidenceGaps).map((g) => `Unresolved evidence gap "${g}" limits confidence in this exposure read.`);
  if (edition.sourceConfidence !== "HIGH") uncertainty.push(`GMI source confidence is ${edition.sourceConfidence}; treat as monitored, not settled.`);

  return {
    caseId: twin.caseId,
    twinVersion: twin.version,
    editionId: edition.editionId,
    editionVersion: edition.editionVersion,
    artifactHash: edition.artifactHash,
    editionReleased,
    exposureOnly: true,
    regimeThesis: edition.regimeThesis,
    intersections,
    applicableTriggers,
    uncertainty,
    falsificationConditions: applicableTriggers.map((t) => `${t.variable} ${t.threshold} would invalidate the current posture: ${t.consequence}.`),
    claimBoundary: NOT_ADVICE,
    generatedAt: now(),
    provenance: { twinCaseId: twin.caseId, twinVersion: twin.version, editionId: edition.editionId, artifactHash: edition.artifactHash },
  };
}

/** A brief is stale (must be regenerated) if the edition artifact hash changed. */
export function crossMoatBriefStale(brief: CrossMoatBrief, edition: GmiEditionView): boolean {
  return brief.artifactHash !== edition.artifactHash || brief.editionId !== edition.editionId;
}

// ── OPP-13: governed next-admissible-move ─────────────────────────────────────

export type CommercialMode = "free" | "paid_checkout" | "manual_billing" | "contracted" | "controlled" | "retired" | "inactive";
export interface CandidateProduct {
  code: string;
  commercialMode: CommercialMode;
  addressesTopics: string[]; // topic keys this product helps with
  eligibleForTier: string[]; // tiers eligible; empty = any
  isEvidenceGathering?: boolean;
}
export interface NextMoveContext {
  tier: string;
  priorProducts: string[]; // already completed
  candidates: CandidateProduct[];
}
export interface NextMove {
  action: "gather_evidence" | "controlled_intake" | "recommend_product" | "manual_request" | "no_admissible_move";
  productCode: string | null;
  route: "self_serve_checkout" | "controlled_request" | "manual_billing_request" | "free_access" | "evidence_intake" | "none";
  recommendedBecause: string[];
  claimBoundary: string;
  revenueMaximising: false;
}

const CONTRADICTION_RANK: Record<Severity, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

export function deriveNextAdmissibleMove(twin: StrategicTwinState, ctx: NextMoveContext): NextMove {
  const gaps = Object.keys(twin.evidenceGaps);
  const contradictions = Object.values(twin.contradictions).filter((c) => c.status === "active");
  const worst = contradictions.reduce<Severity | null>((acc, c) => {
    const s = c.lastSeverity ?? "LOW";
    return acc === null || CONTRADICTION_RANK[s] > CONTRADICTION_RANK[acc] ? s : acc;
  }, null);
  const reasons: string[] = [];

  const eligible = (p: CandidateProduct) =>
    p.commercialMode !== "retired" && p.commercialMode !== "inactive" &&
    !ctx.priorProducts.includes(p.code) && // no redundant recommendation
    (p.eligibleForTier.length === 0 || p.eligibleForTier.includes(ctx.tier));

  // 1. Insufficient evidence dominates → evidence-gathering move, never an upsell.
  if (gaps.length > 0 && (worst === null || CONTRADICTION_RANK[worst] < 2)) {
    const ev = ctx.candidates.find((p) => p.isEvidenceGathering && eligible(p));
    reasons.push(`Unresolved evidence gaps: ${gaps.join(", ")}`, "Evidence insufficiency takes priority over any purchase.");
    return move(ev?.code ?? null, ev ? "evidence_intake" : "none", ev ? "gather_evidence" : "no_admissible_move", reasons);
  }

  // 2. Severe contradiction → the best-matching admissible product, governance-gated.
  if (worst && CONTRADICTION_RANK[worst] >= 2) {
    const topics = contradictions.flatMap((c) => c.key.split(/[_\s]+/));
    const match = ctx.candidates
      .filter(eligible)
      .find((p) => p.addressesTopics.some((t) => topics.some((k) => t.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(t.toLowerCase()))));
    if (match) {
      reasons.push(`Active ${worst} contradiction(s): ${contradictions.map((c) => c.key).join(", ")}`, `Product "${match.code}" addresses the matched topic`, `Current tier: ${ctx.tier}`);
      return routeFor(match, reasons);
    }
    reasons.push(`Severe contradiction present but no eligible product addresses it at tier ${ctx.tier}.`);
    return move(null, "none", "no_admissible_move", reasons);
  }

  // 3. Otherwise: no forced upsell.
  reasons.push("No unresolved evidence gap or severe contradiction; no admissible move is forced.");
  return move(null, "none", "no_admissible_move", reasons);
}

function routeFor(p: CandidateProduct, reasons: string[]): NextMove {
  switch (p.commercialMode) {
    case "controlled": return move(p.code, "controlled_request", "controlled_intake", reasons);
    case "manual_billing": return move(p.code, "manual_billing_request", "manual_request", reasons);
    case "contracted": return move(p.code, "controlled_request", "controlled_intake", reasons);
    case "free": return move(p.code, "free_access", "recommend_product", reasons);
    case "paid_checkout": return move(p.code, "self_serve_checkout", "recommend_product", reasons);
    default: return move(null, "none", "no_admissible_move", [...reasons, `Product mode ${p.commercialMode} is not admissible.`]);
  }
}
function move(productCode: string | null, route: NextMove["route"], action: NextMove["action"], recommendedBecause: string[]): NextMove {
  return { action, productCode, route, recommendedBecause, claimBoundary: NOT_ADVICE, revenueMaximising: false };
}

// ── OPP-15: outcome + checkpoint loop ─────────────────────────────────────────

export type OutcomeEvidenceClass = "CUSTOMER_REPORTED" | "OPERATOR_VERIFIED" | "SYSTEM_OBSERVED" | "EXTERNAL_EVIDENCE" | "WEAK_PROXY" | "INSUFFICIENT";
export interface OutcomeInput {
  commitmentKey: string;
  result: "success" | "partial" | "failure" | "changed_context" | "abandoned";
  evidenceClass: OutcomeEvidenceClass;
  detail: string;
  highStakes?: boolean;
}
export interface OutcomeRecord extends OutcomeInput {
  accepted: boolean;
  reason: string;
  recordedAt: string;
}

/** A high-stakes outcome cannot be auto-closed from weak/insufficient proxy evidence. */
export function recordOutcome(input: OutcomeInput, now = () => new Date().toISOString()): OutcomeRecord {
  const weak = input.evidenceClass === "WEAK_PROXY" || input.evidenceClass === "INSUFFICIENT";
  if (input.highStakes && weak) {
    return { ...input, accepted: false, reason: `High-stakes outcome cannot close on ${input.evidenceClass} evidence; requires OPERATOR_VERIFIED or EXTERNAL_EVIDENCE.`, recordedAt: now() };
  }
  return { ...input, accepted: true, reason: `Outcome accepted on ${input.evidenceClass} evidence.`, recordedAt: now() };
}

// ── OPP-12: decision-integrity trend (PROCESS quality only, evidence-backed) ───

export type IntegrityDimension = "evidence_discipline" | "owner_clarity" | "commitment_integrity" | "falsifiability" | "checkpoint_discipline" | "revision_discipline" | "response_to_warning" | "contradiction_handling" | "outcome_capture";
export interface IntegrityDimensionScore {
  dimension: IntegrityDimension;
  score: number | null; // 0–100; null = insufficient evidence (never a fake score)
  evidence: string;
}
export interface DecisionIntegritySnapshot {
  caseId: string;
  methodologyVersion: string;
  overall: number | null;
  dimensions: IntegrityDimensionScore[];
  generatedAt: string;
}
export const INTEGRITY_METHODOLOGY_VERSION = "1.0.0";

/**
 * Derive a bounded, evidence-backed process-integrity snapshot from the twin.
 * Never scores personality/worth. A dimension with no supporting evidence is null,
 * not zero and not fabricated.
 */
export function computeDecisionIntegrity(twin: StrategicTwinState, outcomes: OutcomeRecord[], now = () => new Date().toISOString()): DecisionIntegritySnapshot {
  const commitments = Object.values(twin.commitments);
  const contradictions = Object.values(twin.contradictions);
  const dims: IntegrityDimensionScore[] = [];

  // owner_clarity: share of commitments with a named owner
  if (commitments.length > 0) {
    const withOwner = commitments.filter((c) => c.owner && c.owner.trim()).length;
    dims.push({ dimension: "owner_clarity", score: Math.round((withOwner / commitments.length) * 100), evidence: `${withOwner}/${commitments.length} commitments have a named owner` });
  } else dims.push({ dimension: "owner_clarity", score: null, evidence: "no commitments recorded" });

  // commitment_integrity: share of commitments with a deadline
  if (commitments.length > 0) {
    const withDeadline = commitments.filter((c) => c.deadline).length;
    dims.push({ dimension: "commitment_integrity", score: Math.round((withDeadline / commitments.length) * 100), evidence: `${withDeadline}/${commitments.length} commitments have a deadline` });
  } else dims.push({ dimension: "commitment_integrity", score: null, evidence: "no commitments recorded" });

  // contradiction_handling: share of contradictions resolved
  if (contradictions.length > 0) {
    const resolved = contradictions.filter((c) => c.status === "resolved").length;
    dims.push({ dimension: "contradiction_handling", score: Math.round((resolved / contradictions.length) * 100), evidence: `${resolved}/${contradictions.length} contradictions resolved` });
  } else dims.push({ dimension: "contradiction_handling", score: null, evidence: "no contradictions recorded" });

  // outcome_capture: whether commitments have captured outcomes (accepted only)
  if (commitments.length > 0) {
    const captured = new Set(outcomes.filter((o) => o.accepted).map((o) => o.commitmentKey));
    const covered = commitments.filter((c) => captured.has(c.key)).length;
    dims.push({ dimension: "outcome_capture", score: Math.round((covered / commitments.length) * 100), evidence: `${covered}/${commitments.length} commitments have an accepted outcome` });
  } else dims.push({ dimension: "outcome_capture", score: null, evidence: "no commitments to capture outcomes for" });

  const scored = dims.filter((d) => d.score !== null).map((d) => d.score as number);
  const overall = scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;
  return { caseId: twin.caseId, methodologyVersion: INTEGRITY_METHODOLOGY_VERSION, overall, dimensions: dims, generatedAt: now() };
}
