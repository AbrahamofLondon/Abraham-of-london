/**
 * lib/product/product-catalogue-registry.ts
 *
 * Product Catalogue Registry — every product surface must be registered here.
 *
 * No orphan products. Every entry defines:
 *   - name and public promise
 *   - buyer
 *   - price or qualification rule
 *   - source engine
 *   - route
 *   - fulfilment path
 *   - next action
 *   - visibility level
 *   - quality gates
 *   - forbidden claims
 */

import type { ProductCatalogueEntry, LadderStep } from "./decision-case-contract";

// ─── Catalogue ────────────────────────────────────────────────────────────────

const CATALOGUE: Record<LadderStep, ProductCatalogueEntry> = {
  // ── Free proof layer ──────────────────────────────────────────────────────
  test_a_decision: {
    step: "test_a_decision",
    name: "Test a Decision",
    publicPromise: "Submit a decision. Receive a failure map: where this decision is most likely to break, and the minimum viable next move.",
    buyer: "Anyone facing a serious decision — founder, operator, professional, individual.",
    price: "Free",
    qualificationRule: "instant",
    sourceEngine: "Decision Failure Map",
    route: "/foundry/decision-test",
    fulfilmentPath: "self_service",
    nextAction: "Unlock a Decision Failure Brief (£49–£349) or request an Executive Review",
    visibility: "teaser",
    qualityGates: ["EVIDENCE_GAP_IDENTIFIED", "AUTHORITY_GAP_IDENTIFIED"],
    forbiddenClaims: [
      "This is professional advice",
      "This is a verified record",
      "This replaces a qualified professional",
    ],
  },

  market_signal_check: {
    step: "market_signal_check",
    name: "Check a Market Signal",
    publicPromise: "Submit a claim, offer, or positioning statement. Receive a copy clarity score and evidence weakness assessment.",
    buyer: "Founders, marketers, and operators who need to know if a claim is defensible.",
    price: "Free",
    qualificationRule: "instant",
    sourceEngine: "Market Signal (copy + evidence lens)",
    route: "/foundry/market-signal-test",
    fulfilmentPath: "self_service",
    nextAction: "Request a Claim Failure Brief or full review",
    visibility: "teaser",
    qualityGates: ["EVIDENCE_GAP_IDENTIFIED"],
    forbiddenClaims: [
      "This is market validation",
      "This replaces customer research",
      "This is legal clearance",
    ],
  },

  release_risk_check: {
    step: "release_risk_check",
    name: "Check Release Risk",
    publicPromise: "Describe a release or operational commitment. Receive a proceed/hold/escalate directive with specific risks.",
    buyer: "Product and engineering leaders preparing a release.",
    price: "Free",
    qualificationRule: "instant",
    sourceEngine: "Release Risk (reversibility + dependency lens)",
    route: "/foundry/release-risk-test",
    fulfilmentPath: "self_service",
    nextAction: "Request a Release Failure Brief or full review",
    visibility: "teaser",
    qualityGates: ["EVIDENCE_GAP_IDENTIFIED", "AUTHORITY_GAP_IDENTIFIED"],
    forbiddenClaims: [
      "This is a security audit",
      "This guarantees safe release",
      "This replaces QA or testing",
    ],
  },

  verify_a_record: {
    step: "verify_a_record",
    name: "Verify a Record",
    publicPromise: "Enter a verification token to confirm whether it corresponds to a genuine Foundry-issued record.",
    buyer: "Anyone who has received a Foundry-issued token or reference.",
    price: "Free",
    qualificationRule: "instant",
    sourceEngine: "Verification engine (token lookup)",
    route: "/verify",
    fulfilmentPath: "self_service",
    nextAction: "Run a public test or request a full review",
    visibility: "teaser",
    qualityGates: [],
    forbiddenClaims: [
      "This is cryptographic proof",
      "This confirms the content of the decision",
      "This is a legally binding verification",
    ],
  },

  continuity: {
    step: "continuity",
    name: "Continuity",
    publicPromise: "Understand how the Foundry ensures decision continuity across governance cycles, team changes, and evolving evidence.",
    buyer: "Anyone considering whether a one-off diagnostic is enough.",
    price: "Free",
    qualificationRule: "instant",
    sourceEngine: "Continuity framework (record + follow-through layer)",
    route: "/continuity",
    fulfilmentPath: "self_service",
    nextAction: "Test a Decision or Start a full review",
    visibility: "teaser",
    qualityGates: [],
    forbiddenClaims: [
      "This replaces a decision record",
      "This is a legal archive",
    ],
  },

  // ── Paid briefs ───────────────────────────────────────────────────────────
  decision_failure_brief_basic: {
    step: "decision_failure_brief_basic",
    name: "Decision Failure Brief — Basic",
    publicPromise: "A written brief with your personalised failure map, primary failure point, primary tension, and minimum viable next move.",
    buyer: "Individuals and small operators who need structured decision analysis but have limited budget.",
    price: "£49",
    qualificationRule: "instant",
    sourceEngine: "Decision Failure Map",
    route: "/foundry/decision-test → checkout",
    fulfilmentPath: "founder_review",
    nextAction: "Upgrade to Full (£149) or Urgent (£349)",
    visibility: "brief",
    qualityGates: ["FOUNDER_REVIEW_REQUIRED", "EVIDENCE_GAP_IDENTIFIED", "AUTHORITY_GAP_IDENTIFIED"],
    forbiddenClaims: [
      "This is professional advice",
      "This is a verified record",
      "This replaces a qualified professional",
    ],
  },

  decision_failure_brief_full: {
    step: "decision_failure_brief_full",
    name: "Decision Failure Brief — Full",
    publicPromise: "Everything in Basic plus a signed record with verification token, evidence checklist, fallback path, and escalation threshold.",
    buyer: "Professionals and operators who need a verifiable record they can return to.",
    price: "£149",
    qualificationRule: "instant",
    sourceEngine: "Decision Failure Map",
    route: "/foundry/decision-test → checkout",
    fulfilmentPath: "founder_review",
    nextAction: "Upgrade to Urgent (£349) or Executive Review",
    visibility: "record",
    qualityGates: [
      "FOUNDER_REVIEW_REQUIRED",
      "REGULATED_ADVICE_BOUNDARY_CHECKED",
      "VERIFICATION_TOKEN_ISSUED",
      "EVIDENCE_GAP_IDENTIFIED",
      "AUTHORITY_GAP_IDENTIFIED",
    ],
    forbiddenClaims: [
      "This is professional advice",
      "This is cryptographic proof",
      "This replaces a qualified professional",
    ],
  },

  decision_failure_brief_urgent: {
    step: "decision_failure_brief_urgent",
    name: "Decision Failure Brief — Urgent",
    publicPromise: "Everything in Full with 24-hour turnaround and follow-up Q&A.",
    buyer: "Decision-makers facing an imminent deadline who need rapid structured analysis.",
    price: "£349",
    qualificationRule: "instant",
    sourceEngine: "Decision Failure Map",
    route: "/foundry/decision-test → checkout",
    fulfilmentPath: "founder_review",
    nextAction: "Request an Executive Review for ongoing governance",
    visibility: "record",
    qualityGates: [
      "FOUNDER_REVIEW_REQUIRED",
      "REGULATED_ADVICE_BOUNDARY_CHECKED",
      "VERIFICATION_TOKEN_ISSUED",
      "EVIDENCE_GAP_IDENTIFIED",
      "AUTHORITY_GAP_IDENTIFIED",
    ],
    forbiddenClaims: [
      "This is professional advice",
      "This is cryptographic proof",
      "This replaces a qualified professional",
    ],
  },

  // ── Premium review ────────────────────────────────────────────────────────
  executive_decision_review: {
    step: "executive_decision_review",
    name: "Executive Decision Review",
    publicPromise: "A full Decision Failure Map with authority and evidence review, risk register with named owners, board-ready summary, and continuity record.",
    buyer: "Senior leaders, board members, and operators with high-stakes decisions requiring governance-grade analysis.",
    price: "From £2,500",
    qualificationRule: "qualified_interest",
    sourceEngine: "Decision Failure Map + Executive Reporting",
    route: "/foundry/decision-test → qualified interest form",
    fulfilmentPath: "qualified_delivery",
    nextAction: "Retainer continuity or Boardroom Mode",
    visibility: "boardroom",
    qualityGates: [
      "FOUNDER_REVIEW_REQUIRED",
      "REGULATED_ADVICE_BOUNDARY_CHECKED",
      "VERIFICATION_TOKEN_ISSUED",
      "CONTINUITY_RECORD_CREATED",
      "EVIDENCE_GAP_IDENTIFIED",
      "AUTHORITY_GAP_IDENTIFIED",
      "IMPOSSIBLE_ADVICE_DETECTED",
    ],
    forbiddenClaims: [
      "This is professional advice",
      "This is cryptographic proof",
      "This replaces legal, tax, or financial advice",
      "This guarantees a specific outcome",
    ],
  },

  // ── Retainer layer ────────────────────────────────────────────────────────
  retainer_continuity: {
    step: "retainer_continuity",
    name: "Retainer Continuity",
    publicPromise: "Ongoing decision governance with continuity records, periodic review, and escalation management.",
    buyer: "Organisations requiring sustained decision infrastructure.",
    price: "Retainer",
    qualificationRule: "retainer_only",
    sourceEngine: "Continuity + Strategy Room + Boardroom Mode",
    route: "Qualified introduction",
    fulfilmentPath: "qualified_delivery",
    nextAction: "Strategy Room or Boardroom Mode engagement",
    visibility: "boardroom",
    qualityGates: [
      "FOUNDER_REVIEW_REQUIRED",
      "REGULATED_ADVICE_BOUNDARY_CHECKED",
      "VERIFICATION_TOKEN_ISSUED",
      "CONTINUITY_RECORD_CREATED",
      "HUMAN_REVIEW_COMPLETED",
      "DELIVERED",
    ],
    forbiddenClaims: [
      "This is professional advice",
      "This replaces legal, tax, or financial advice",
      "This guarantees a specific outcome",
      "This is fiduciary advice",
    ],
  },
};

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getCatalogue(): Record<LadderStep, ProductCatalogueEntry> {
  return CATALOGUE;
}

export function getProduct(step: LadderStep): ProductCatalogueEntry | null {
  return CATALOGUE[step] ?? null;
}

export function getAllProducts(): ProductCatalogueEntry[] {
  return Object.values(CATALOGUE);
}

export function getFreeProducts(): ProductCatalogueEntry[] {
  return Object.values(CATALOGUE).filter(p => p.price === "Free");
}

export function getPaidProducts(): ProductCatalogueEntry[] {
  return Object.values(CATALOGUE).filter(p => p.price !== "Free" && !p.price.startsWith("From") && p.price !== "Retainer");
}

export function getPremiumProducts(): ProductCatalogueEntry[] {
  return Object.values(CATALOGUE).filter(p => p.price.startsWith("From") || p.price === "Retainer");
}

export function getProductsByVisibility(visibility: string): ProductCatalogueEntry[] {
  return Object.values(CATALOGUE).filter(p => p.visibility === visibility);
}
