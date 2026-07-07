/**
 * lib/governance/claim-boundary-authority.ts
 *
 * §16 — the ONE canonical claim-boundary authority. It is the single entry point that
 * evaluates any customer-facing text (a source content page, a runtime-generated output,
 * or a publication) against the estate's claim boundaries and returns a fail-closed
 * verdict: PASS / QUALIFY / HUMAN_REVIEW / DENY.
 *
 * It does NOT re-implement the estate's existing authority-wording firewall
 * (truth-claim-firewall / claim-vocabulary-registry) — it COMPOSES it (delegating
 * "authority-grade wording" detection to scanTextForSuspiciousClaims) and ADDS the
 * high-stakes advisory + commercial-state boundaries the firewall did not cover:
 *
 *   • GUARANTEED_OUTCOME              — no product may promise a guaranteed result
 *   • UNSUPPORTED_FINANCIAL_PREDICTION— no certain financial prediction
 *   • LEGAL_CERTAINTY                 — no legal advice / guaranteed-compliance claim
 *   • CONTROLLED_SELF_SERVE           — a controlled product must not claim self-serve access
 *   • EARLY_RELEASE                   — a draft/controlled edition must not claim availability
 *
 * Bounded-uncertainty language ("may", "could", "based on available evidence") and
 * factual supported capability descriptions PASS. Fail-closed: an evaluation error
 * yields HUMAN_REVIEW (never a silent PASS); the runtime enforcement wrapper turns an
 * exception into DENY.
 */

import { scanTextForSuspiciousClaims } from "@/lib/intelligence/truth-claim-firewall";
import type { TruthClaimSurface } from "@/lib/intelligence/claim-vocabulary-registry";

export type ClaimVerdict = "PASS" | "QUALIFY" | "HUMAN_REVIEW" | "DENY";

export type BoundaryClass =
  | "GUARANTEED_OUTCOME"
  | "UNSUPPORTED_FINANCIAL_PREDICTION"
  | "LEGAL_CERTAINTY"
  | "CONTROLLED_SELF_SERVE"
  | "EARLY_RELEASE"
  | "AUTHORITY_OVERREACH";

export type BoundarySeverity = "DENY" | "REVIEW" | "QUALIFY";

export interface ClaimBoundaryContext {
  productCode?: string;
  /** controlled products (GMI Q2, retainer, strategy room) must not claim self-serve. */
  isControlledProduct?: boolean;
  /** edition/report release state — a DRAFT/CONTROLLED edition cannot claim availability. */
  releaseState?: "DRAFT" | "RELEASED" | "CONTROLLED";
  editionId?: string;
  surface?: TruthClaimSurface;
}

export interface ClaimViolation {
  boundaryClass: BoundaryClass;
  severity: BoundarySeverity;
  match: string;
  reason: string;
}

export interface ClaimBoundaryResult {
  verdict: ClaimVerdict;
  violations: ClaimViolation[];
}

interface Detector {
  boundaryClass: BoundaryClass;
  severity: BoundarySeverity;
  reason: string;
  patterns: RegExp[];
  /** only active when this predicate is true for the context (default always). */
  when?: (ctx: ClaimBoundaryContext) => boolean;
}

// Certainty verbs used to distinguish a PREDICTION (deny) from bounded language (pass).
const FINANCIAL_NOUN = /(revenue|profit|roi|returns?|valuation|growth|sales|earnings|margin)/i;

// A match preceded by a negation is a DISCLAIMER, not a claim ("not a guarantee",
// "this is not legal advice", "no guaranteed outcome") — those are the RIGHT bounded
// language and must not be flagged. We look back a short window for a negation cue.
const NEGATION = /\b(no|not|never|without|isn'?t|aren'?t|won'?t|don'?t|doesn'?t|neither|nor|avoid|cannot|can'?t)\b[^.?!]{0,16}$/i;

function isNegated(text: string, matchIndex: number): boolean {
  const window = text.slice(Math.max(0, matchIndex - 40), matchIndex);
  return NEGATION.test(window);
}

const DETECTORS: Detector[] = [
  {
    boundaryClass: "GUARANTEED_OUTCOME",
    severity: "DENY",
    reason: "Guaranteed-outcome language is not permitted — outcomes are never guaranteed.",
    patterns: [
      /\bguarantee(?:d|s)?\b/i,
      /\brisk[-\s]?free\b/i,
      /\b100%\s*(?:success|guaranteed|effective|results?)\b/i,
      /\b(?:will|shall)\s+(?:definitely|certainly|always)\b/i,
      /\bassured\s+(?:results?|outcomes?|success)\b/i,
    ],
  },
  {
    boundaryClass: "UNSUPPORTED_FINANCIAL_PREDICTION",
    severity: "DENY",
    reason: "A certain financial prediction is not permitted without evidence and disclosure.",
    patterns: [
      // "will increase revenue", "will double your returns", "will boost profit"
      new RegExp(`\\b(?:will|shall)\\s+(?:increase|grow|boost|double|triple|maximis[ez]e|multiply)[^.]{0,40}${FINANCIAL_NOUN.source}`, "i"),
      // "guaranteed 30% ROI", "12% return guaranteed"
      /\b\d+%\s*(?:roi|return|returns|gains?|growth)\b/i,
      new RegExp(`\\bguaranteed\\s+${FINANCIAL_NOUN.source}`, "i"),
    ],
  },
  {
    boundaryClass: "LEGAL_CERTAINTY",
    severity: "DENY",
    reason: "Legal-certainty / legal-advice claims are outside the advisory boundary.",
    patterns: [
      /\blegal advice\b/i,
      /\blegally compliant\b/i,
      /\bguarantee(?:s|d)?\s+compliance\b/i,
      /\bfully compliant with (?:the )?law\b/i,
      /\bwill not be sued\b/i,
      /\bregulatory approval guaranteed\b/i,
    ],
  },
  {
    boundaryClass: "CONTROLLED_SELF_SERVE",
    severity: "DENY",
    reason: "A controlled product must route through qualification — no self-serve/instant-access claim.",
    when: (ctx) => ctx.isControlledProduct === true,
    patterns: [
      /\b(?:instant|immediate)\s+access\b/i,
      /\bself[-\s]?serve\b/i,
      /\bbuy now\b/i,
      /\badd to cart\b/i,
      /\bcheckout now\b/i,
      /\bpurchase (?:instantly|immediately)\b/i,
    ],
  },
  {
    boundaryClass: "EARLY_RELEASE",
    severity: "DENY",
    reason: "A draft/controlled edition must not claim availability before authorised release.",
    when: (ctx) => ctx.releaseState === "DRAFT" || ctx.releaseState === "CONTROLLED",
    patterns: [
      /\b(?:available|released|out|live)\s+now\b/i,
      /\b(?:download|access|read|get)\s+(?:the\s+)?(?:q[1-4]|latest|new)\b/i,
      /\bnow (?:available|released|published|live)\b/i,
      /\bq[1-4]\b[^.]{0,20}\b(?:available|released|live|out)\b/i,
    ],
  },
];

const VERDICT_RANK: Record<ClaimVerdict, number> = { PASS: 0, QUALIFY: 1, HUMAN_REVIEW: 2, DENY: 3 };
const SEVERITY_VERDICT: Record<BoundarySeverity, ClaimVerdict> = { QUALIFY: "QUALIFY", REVIEW: "HUMAN_REVIEW", DENY: "DENY" };

/**
 * Evaluate text against every applicable boundary. Pure + deterministic. Composes the
 * existing authority-wording firewall (as QUALIFY-level AUTHORITY_OVERREACH signals).
 */
export function evaluateClaimBoundary(text: string, ctx: ClaimBoundaryContext = {}): ClaimBoundaryResult {
  const violations: ClaimViolation[] = [];

  for (const d of DETECTORS) {
    if (d.when && !d.when(ctx)) continue;
    for (const p of d.patterns) {
      // scan all occurrences; a negated (disclaimer) hit does not count.
      const re = new RegExp(p.source, p.flags.includes("g") ? p.flags : p.flags + "g");
      let m: RegExpExecArray | null;
      let flagged = false;
      while ((m = re.exec(text)) !== null) {
        if (isNegated(text, m.index)) continue;
        violations.push({ boundaryClass: d.boundaryClass, severity: d.severity, match: m[0], reason: d.reason });
        flagged = true;
        break;
      }
      if (flagged) break; // one hit per detector is enough
    }
  }

  // compose the existing authority-wording firewall (non-duplicative): its hits are
  // QUALIFY-grade signals here, not DENY, because the firewall governs grade wording.
  try {
    const surface: TruthClaimSurface = ctx.surface ?? "PUBLIC_PRODUCT_COPY";
    const suspicious = scanTextForSuspiciousClaims({ text, surface });
    for (const s of suspicious) {
      violations.push({ boundaryClass: "AUTHORITY_OVERREACH", severity: "QUALIFY", match: s.matchedText, reason: `Authority-grade wording (${s.label}) must remain evidence-governed.` });
    }
  } catch {
    // firewall composition failure must not weaken the high-stakes verdict — ignore.
  }

  let verdict: ClaimVerdict = "PASS";
  for (const v of violations) {
    const cand = SEVERITY_VERDICT[v.severity];
    if (VERDICT_RANK[cand] > VERDICT_RANK[verdict]) verdict = cand;
  }
  return { verdict, violations };
}

// ── 16.2 Runtime generated-output enforcement (fail-closed) ───────────────────

export class ClaimBoundaryDenied extends Error {
  readonly result: ClaimBoundaryResult;
  constructor(result: ClaimBoundaryResult) {
    super(`[CLAIM_BOUNDARY_DENIED] ${result.violations.map((v) => v.boundaryClass).join(", ")}`);
    this.name = "ClaimBoundaryDenied";
    this.result = result;
  }
}

/**
 * Enforce the boundary on a generated customer-facing output. Fail-closed: DENY throws;
 * HUMAN_REVIEW throws too (the output must not ship without a human); QUALIFY/PASS return.
 * An evaluation exception is treated as DENY (never a silent pass).
 */
export function enforceGeneratedOutput(text: string, ctx: ClaimBoundaryContext = {}): ClaimBoundaryResult {
  let result: ClaimBoundaryResult;
  try {
    result = evaluateClaimBoundary(text, ctx);
  } catch (err) {
    const denied: ClaimBoundaryResult = { verdict: "DENY", violations: [{ boundaryClass: "GUARANTEED_OUTCOME", severity: "DENY", match: "", reason: `Evaluation failed closed: ${err instanceof Error ? err.message : "error"}` }] };
    throw new ClaimBoundaryDenied(denied);
  }
  if (result.verdict === "DENY" || result.verdict === "HUMAN_REVIEW") throw new ClaimBoundaryDenied(result);
  return result;
}

// ── 16.3 Publication authority ────────────────────────────────────────────────

export interface PublicationAuthorityInput {
  text: string;
  ctx: ClaimBoundaryContext;
  humanReviewed: boolean;
  dataLocked: boolean;
  artifactHash: string | null;
  ownerAuthorised: boolean;
}
export interface PublicationDecision {
  publishable: boolean;
  verdict: ClaimVerdict;
  blockers: string[];
}

/** A public intelligence/report output is publishable only if the claim boundary passes
 *  AND every publication gate is satisfied. Fail-closed on any missing gate. */
export function evaluatePublicationAuthority(input: PublicationAuthorityInput): PublicationDecision {
  const boundary = evaluateClaimBoundary(input.text, input.ctx);
  const blockers: string[] = [];
  if (boundary.verdict === "DENY" || boundary.verdict === "HUMAN_REVIEW") blockers.push(`claim_boundary:${boundary.verdict}`);
  if (!input.humanReviewed) blockers.push("human_review_missing");
  if (!input.dataLocked) blockers.push("data_lock_missing");
  if (!input.artifactHash) blockers.push("artifact_hash_missing");
  if (!input.ownerAuthorised) blockers.push("owner_authority_missing");
  return { publishable: blockers.length === 0, verdict: boundary.verdict, blockers };
}
