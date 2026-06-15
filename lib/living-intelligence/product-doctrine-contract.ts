/**
 * lib/living-intelligence/product-doctrine-contract.ts
 *
 * Canonical doctrine contract describing what the product claims to be.
 *
 * Each doctrine claim has:
 *   - id: unique identifier
 *   - claim: what the product claims
 *   - expectedBehaviour: what the code/system should do to fulfil the claim
 *   - violationPatterns: code patterns, terms, or behaviours that would violate the claim
 *   - evidencePosture: how strongly the claim is currently evidenced
 *   - lastVerified: when the claim was last checked
 *
 * This is NOT aspirational. It describes the declared product truth as of
 * the current estate state. Claims that cannot yet be evidenced are marked
 * as such rather than removed.
 */

export type EvidencePosture =
  | "verified"
  | "strongly_indicated"
  | "weakly_indicated"
  | "inferred"
  | "unverified"
  | "contradictory"
  | "stale"
  | "needs_human_review";

export type DoctrineClaim = {
  id: string;
  domain: string;
  claim: string;
  expectedBehaviour: string;
  violationPatterns: string[];
  evidencePosture: EvidencePosture;
  lastVerified: string | null;
  /** File/line references that support the claim */
  supportingEvidence: string[];
  /** File/line references that contradict the claim */
  contradictingEvidence: string[];
};

export const DOCTRINE_CLAIMS: DoctrineClaim[] = [
  // ── 1. Authority Boundary ────────────────────────────────────────────────
  {
    id: "authority-boundary",
    domain: "product_doctrine",
    claim: "The system does not grant authority. Outputs advise, structure, escalate, and constrain; they do not approve, command, certify, or replace decision-makers.",
    expectedBehaviour: "No output claims final authority. No product grants positive authority. Authority delta remains 0.",
    violationPatterns: [
      "approved", "certified", "guaranteed", "final authority",
      "system decides", "positive authority", "authorityRestoration",
      "canGrantAuthority",
    ],
    evidencePosture: "verified",
    lastVerified: null,
    supportingEvidence: [
      "data/ProductAuthorityContract.json: all 43 products have positiveAuthorityGranted: false",
      "lib/product/authority-grant-firewall.ts: defines checks that prevent authority grants",
      "lib/product/authority-gate-hierarchy.ts: gates that block unauthorized authority transfer",
    ],
    contradictingEvidence: [],
  },

  // ── 2. Evidence Discipline ───────────────────────────────────────────────
  {
    id: "evidence-discipline",
    domain: "product_doctrine",
    claim: "Conclusions are evidence-postured. Evidence tier, confidence posture, unsupported claims labelled, missing evidence surfaced, falsification condition exists where relevant.",
    expectedBehaviour: "Evidence tier exists on outputs. Confidence posture is declared. Unsupported claims are labelled. Missing evidence is surfaced.",
    violationPatterns: [
      "no evidence tier", "no confidence posture",
      "unsupported claim without label", "missing evidence not surfaced",
    ],
    evidencePosture: "weakly_indicated",
    lastVerified: null,
    supportingEvidence: [
      "lib/product/evidence-stage-contract.ts: defines evidence tiers",
      "lib/product/evidence-tier-derivation.ts: derives evidence level",
      "lib/intelligence/gmi-falsification-rules: falsification conditions exist",
    ],
    contradictingEvidence: [],
  },

  // ── 3. Continuity ────────────────────────────────────────────────────────
  {
    id: "continuity",
    domain: "product_doctrine",
    claim: "The system compounds context across serious decisions. Case memory exists, unresolved contradictions persist, previous warnings can reappear, return state is not reset to zero without reason.",
    expectedBehaviour: "Session continuity carries forward. Case memory persists. Unresolved items are not silently dropped.",
    violationPatterns: [
      "no continuity between sessions", "state reset to zero",
      "unresolved contradictions silently dropped",
    ],
    evidencePosture: "weakly_indicated",
    lastVerified: null,
    supportingEvidence: [
      "lib/product/save-case-continuity.ts: carries forward case context",
      "lib/product/session-case-continuity.ts: session continuity",
      "lib/kernel/living-layer-view-model.ts: derives continuity from session",
    ],
    contradictingEvidence: [],
  },

  // ── 4. Contradiction Detection ───────────────────────────────────────────
  {
    id: "contradiction-detection",
    domain: "product_doctrine",
    claim: "The system detects structural contradiction. Contradiction signals are extracted, contradictions have domain/severity/evidence, contradiction is not hidden by smooth narrative.",
    expectedBehaviour: "Contradiction detectors exist across domains. Contradictions have severity, evidence, and recommendations.",
    violationPatterns: [
      "contradiction hidden", "smooth narrative overrides contradiction",
      "no contradiction detector for domain",
    ],
    evidencePosture: "verified",
    lastVerified: null,
    supportingEvidence: [
      "lib/living-intelligence/contradiction-detector.ts: 12 detector families",
      "lib/living-intelligence/intervention-classifier.ts: classifies by severity",
      "scripts/check-living-estate-intelligence.mjs: operational gate",
    ],
    contradictingEvidence: [],
  },

  // ── 5. Bounded Simulation ────────────────────────────────────────────────
  {
    id: "bounded-simulation",
    domain: "product_doctrine",
    claim: "Strategic Twin is bounded simulation, not prediction certainty. Assumptions are declared, confidence limits are shown, simulation does not claim future certainty.",
    expectedBehaviour: "Simulation paths declare assumptions. Confidence limits are shown. No prediction certainty claims.",
    violationPatterns: [
      "prediction certainty", "guaranteed outcome",
      "no assumptions declared", "no confidence limits",
    ],
    evidencePosture: "weakly_indicated",
    lastVerified: null,
    supportingEvidence: [
      "lib/kernel/simulation-gate.ts: bounded simulation paths",
      "lib/kernel/synthesis-gate.ts: derives next admissible move",
    ],
    contradictingEvidence: [],
  },

  // ── 6. Professional Boundary ─────────────────────────────────────────────
  {
    id: "professional-boundary",
    domain: "product_doctrine",
    claim: "Advisors structure evidence without taking client authority. Advisor-mediated evidence is labelled, client consent boundary exists, enterprise escalation requires consent, cross-client isolation is protected.",
    expectedBehaviour: "Professional surface describes advisor boundary. Client consent language exists. No delegated authority claim.",
    violationPatterns: [
      "delegated authority", "advisor decides",
      "no client consent", "cross-client data leak",
    ],
    evidencePosture: "weakly_indicated",
    lastVerified: null,
    supportingEvidence: [
      "pages/professionals.tsx: describes professional boundary",
    ],
    contradictingEvidence: [],
  },

  // ── 7. Retainer/Oversight Boundary ───────────────────────────────────────
  {
    id: "retainer-oversight-boundary",
    domain: "product_doctrine",
    claim: "Oversight is gated and evidence-dependent. No self-serve retainer activation, outcome history required, recurrence evidence required, human review required.",
    expectedBehaviour: "Retainer products are contracted/manual_billing. Oversight requires evidence and human review.",
    violationPatterns: [
      "self-serve retainer", "no evidence required for oversight",
      "no human review gate",
    ],
    evidencePosture: "verified",
    lastVerified: null,
    supportingEvidence: [
      "lib/commercial/catalog.ts: retainer products are contracted/manual_billing",
      "lib/product/retainer-oversight-contract.ts: oversight requires evidence",
    ],
    contradictingEvidence: [],
  },

  // ── 8. Publication Discipline ────────────────────────────────────────────
  {
    id: "publication-discipline",
    domain: "product_doctrine",
    claim: "Current, forthcoming, and archive states are governed. Draft is not current, archive requires supersession, current issue derives from lifecycle, prior calls are reviewed before new issue.",
    expectedBehaviour: "Lifecycle controls publication state. Registry agrees with lifecycle. Current published comes from lifecycle, not hand-maintained flags.",
    violationPatterns: [
      "draft treated as current", "archive without supersession",
      "current from hand-maintained flag",
    ],
    evidencePosture: "verified",
    lastVerified: null,
    supportingEvidence: [
      "lib/intelligence/market-intelligence-lifecycle.ts: publication authority",
      "lib/commercial/gmi/gmi-edition-factory.ts: assertGmiRegistryAgreesWithLifecycle guard",
      "lib/intelligence/gmi-publication-service.ts: prior-quarter review workflow",
    ],
    contradictingEvidence: [],
  },

  // ── 9. Commercial Governance ─────────────────────────────────────────────
  {
    id: "commercial-governance",
    domain: "product_doctrine",
    claim: "Checkout is governed by resolver. Stripe metadata is not permission, checkout route calls resolver, blocked/internal-only products do not checkout.",
    expectedBehaviour: "Resolver controls checkout. Stripe IDs alone never grant checkout. Blocked products are non-purchasable.",
    violationPatterns: [
      "checkout without resolver", "Stripe ID as permission",
      "blocked product checkout",
    ],
    evidencePosture: "verified",
    lastVerified: null,
    supportingEvidence: [
      "lib/commercial/commercial-action-resolver.ts: 12-rule cascade",
      "lib/commercial/pricing-actions.ts: resolver-gated CTAs",
      "components/commercial/CheckoutButton.tsx: resolver-gated",
      "pages/api/billing/checkout.ts: server-side resolver enforcement",
    ],
    contradictingEvidence: [],
  },

  // ── 10. Living Intelligence ──────────────────────────────────────────────
  {
    id: "living-intelligence",
    domain: "product_doctrine",
    claim: "Living components represent real state, not decorative theatre. Living components consume real view models or engine output, demo/static-only usage is flagged, components map to doctrine/behaviour/memory/evidence.",
    expectedBehaviour: "Living components are wired to real data sources. Static/demo-only components are identified and flagged.",
    violationPatterns: [
      "decorative component", "static demo data",
      "no real data source",
    ],
    evidencePosture: "unverified",
    lastVerified: null,
    supportingEvidence: [],
    contradictingEvidence: [],
  },
];

export function getDoctrineClaim(id: string): DoctrineClaim | undefined {
  return DOCTRINE_CLAIMS.find((c) => c.id === id);
}

export function getDoctrineClaimsByDomain(domain: string): DoctrineClaim[] {
  return DOCTRINE_CLAIMS.filter((c) => c.domain === domain);
}

export function getDoctrineClaimsByPosture(posture: EvidencePosture): DoctrineClaim[] {
  return DOCTRINE_CLAIMS.filter((c) => c.evidencePosture === posture);
}
