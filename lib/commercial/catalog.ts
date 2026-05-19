/**
 * lib/commercial/catalog.ts — COMMERCIAL CATALOG (SINGLE SOURCE OF TRUTH)
 *
 * Canonical commercial products, access identities, Stripe references,
 * entitlement slugs, product lifecycle status, success/cancel routing,
 * and commercial display metadata.
 *
 * Checkout, webhook, admin, entitlement, access-resolution, and UI pricing
 * must resolve through this file or helpers derived from this file.
 *
 * Do not hardcode product names, prices, entitlement slugs, or Stripe price IDs
 * in UI surfaces.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ──────────���──────────────────────────────────────────────────────────────────

export type AccessType = "one_time" | "free" | "subscription";
export type Duration = "lifetime" | "monthly" | "semi_annual" | "annual";
export type ProductCategory =
  | "decision_tools"
  | "bundle"
  | "evidence"
  | "intelligence"
  | "reporting"
  | "reporting_premium"
  | "execution"
  | "execution_premium"
  | "membership"
  | "retainer"
  | "governed_playbook";

export type CommercialStatus =
  | "free_controlled"
  | "paid"
  | "contracted"
  | "manual_billing"
  | "inactive"
  | "retired"
  | "internal_only";

export type PricingFamily =
  | "free_entry"
  | "professional_subscription"
  | "governed_instruments"
  | "governance_playbooks"
  | "executive_reporting"
  | "strategy_room"
  | "intelligence_reports"
  | "enterprise_retainer"
  | "inactive_archive";

export type CatalogProduct = {
  code: string;
  displayName: string;
  amount: number;
  displayPrice: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  entitlementSlug: string;
  /** Metadata tier label (routing, NOT access tier enum) */
  tier: string;
  category: ProductCategory;
  accessType: AccessType;
  duration: Duration;
  active: boolean;
  successPath: string;
  cancelPath: string;
  cookieName: string | null;
  includes: string[];
  // Extended identity fields
  commercialStatus?: CommercialStatus;
  marketName?: string;
  publicLabel?: string;
  legacyNames?: string[];
  shortDescription?: string;
  userPromise?: string;
  pricingNote?: string;
  primaryCta?: string;
  upgradePath?: string[];
  requiresCheckout?: boolean;
  requiresContract?: boolean;
  futurePaidCandidate?: boolean;
  hiddenFromPricing?: boolean;
  hiddenReason?: string;
  pricingFamily?: PricingFamily;
  // Delivery specs (decision instruments)
  deliveryFormat?: "interactive_instrument" | "pdf_dossier" | "combined" | "bundle" | "governed_methodology_run";
  estimatedCompletionMinutes?: number;
  writesToDecisionMemory?: boolean;
  dossierEligible?: boolean;
  nextAdmissibleMove?: string;
};

// ─────────────────────────────────────���───────────────────────────────────────
// Catalog — Canonical Products
// ──────────────���────────────────────────────��─────────────────────────────────

export const CATALOG: Record<string, CatalogProduct> = {

  // ═══ ENTRY LAYER ═══════════════════════════════════════════════════════

  fast_diagnostic: {
    code: "fast_diagnostic",
    displayName: "Fast Diagnostic",
    marketName: "Fast Diagnostic",
    publicLabel: "Fast Diagnostic",
    amount: 0,
    displayPrice: "Currently free",
    stripeProductId: null,
    stripePriceId: null,
    entitlementSlug: "fast-diagnostic",
    tier: "public-entry",
    category: "decision_tools",
    accessType: "free",
    duration: "lifetime",
    active: true,
    commercialStatus: "free_controlled",
    requiresCheckout: false,
    requiresContract: false,
    futurePaidCandidate: true,
    successPath: "/diagnostics/fast",
    cancelPath: "/diagnostics",
    cookieName: null,
    includes: [],
    shortDescription: "Identify the decision fracture, required move, and checkpoint.",
    userPromise: "Identify the decision fracture, receive one required move, and create a 48-hour checkpoint.",
    pricingNote: "Currently free during controlled market entry.",
    primaryCta: "Start Fast Diagnostic",
    upgradePath: ["personal_decision_audit", "executive_reporting", "strategy_room"],
  },

  personal_decision_audit: {
    code: "personal_decision_audit",
    displayName: "Personal Decision Audit",
    marketName: "Personal Decision Audit",
    publicLabel: "Personal Decision Audit",
    legacyNames: ["Purpose Alignment", "Purpose Alignment Assessment"],
    amount: 4900,
    displayPrice: "£49",
    stripeProductId: "prod_UUahB8wv21HWQt",
    stripePriceId: "price_1TVbW8QFpelVFMXJzLrIQJu1",
    entitlementSlug: "personal-decision-audit",
    tier: "personal-decision-audit",
    category: "decision_tools",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    requiresContract: false,
    successPath: "/diagnostics/purpose-alignment",
    cancelPath: "/diagnostics/purpose-alignment",
    cookieName: "aol_paid_personal_decision_audit",
    includes: [],
    shortDescription: "Expose contradiction between stated mandate, behaviour, and competing obligation.",
    userPromise: "Mandate clarity reading, obligation conflict map, decision behaviour pattern, alignment drift warning, execution integrity implication, personal decision constitution, next admissible move, Decision Centre memory, PDF dossier, and corridor bridge.",
    pricingNote: "Active. Stripe product and price IDs are configured.",
    primaryCta: "Start Personal Decision Audit",
    upgradePath: ["executive_reporting", "strategy_room", "retainer_core"],
    deliveryFormat: "combined",
    estimatedCompletionMinutes: 12,
    writesToDecisionMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: "Executive Reporting or Strategy Room",
  },

  // ═══ A. DECISION LAYER ═══════════════════════════════════════════════════

  decision_exposure_instrument: {
    code: "decision_exposure_instrument",
    displayName: "Decision Exposure Instrument",
    amount: 2900,
    displayPrice: "\u00a329",
    stripeProductId: "prod_SRLlGzqV6k3dDH",
    stripePriceId: "price_1TP1XIQFpelVFMXJ35YurntT",
    entitlementSlug: "decision-exposure-instrument",
    tier: "decision-instrument",
    category: "decision_tools",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    successPath: "/decision-instruments/decision-exposure-instrument/start",
    cancelPath: "/decision-instruments/decision-exposure-instrument",
    cookieName: null,
    includes: [],
    shortDescription: "Measure decision exposure across financial, operational, reputational, strategic, and temporal dimensions.",
    deliveryFormat: "interactive_instrument",
    estimatedCompletionMinutes: 8,
    writesToDecisionMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: "Executive Reporting",
  },

  mandate_clarity_framework: {
    code: "mandate_clarity_framework",
    displayName: "Mandate Clarity Framework",
    amount: 4900,
    displayPrice: "\u00a349",
    stripeProductId: "prod_SRLmhJBFLjXDnp",
    stripePriceId: "price_1TP1ZaQFpelVFMXJovfynFoS",
    entitlementSlug: "mandate-clarity-framework",
    tier: "decision-instrument",
    category: "decision_tools",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    successPath: "/decision-instruments/mandate-clarity-framework/start",
    cancelPath: "/decision-instruments/mandate-clarity-framework",
    cookieName: null,
    includes: [],
    shortDescription: "Classify whether decision ownership, scope, accountability, and delegation are clear.",
    deliveryFormat: "interactive_instrument",
    estimatedCompletionMinutes: 12,
    writesToDecisionMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: "Strategy Room or Boardroom",
  },

  intervention_path_selector: {
    code: "intervention_path_selector",
    displayName: "Intervention Path Selector",
    amount: 7900,
    displayPrice: "\u00a379",
    stripeProductId: "prod_SRLnPE5yKPOBJH",
    stripePriceId: "price_1TP1dRQFpelVFMXJvVlFQjWH",
    entitlementSlug: "intervention-path-selector",
    tier: "decision-instrument",
    category: "decision_tools",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    successPath: "/decision-instruments/intervention-path-selector/start",
    cancelPath: "/decision-instruments/intervention-path-selector",
    cookieName: null,
    includes: [],
    shortDescription: "Select the risk-adjusted optimal intervention path given constraints and stakeholder state.",
    deliveryFormat: "interactive_instrument",
    estimatedCompletionMinutes: 15,
    writesToDecisionMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: "Strategy Room or Boardroom",
  },

  // ═══ TIER 1A — EXPOSURE & RISK ═══════════════════════════════════════════

  escalation_readiness_scorecard: {
    code: "escalation_readiness_scorecard",
    displayName: "Escalation Readiness Scorecard",
    amount: 1900,
    displayPrice: "\u00a319",
    stripeProductId: "prod_UUZc4x8b5WlWjF",
    stripePriceId: "price_1TVaSvQFpelVFMXJbfaw1N6c",
    entitlementSlug: "escalation-readiness-scorecard",
    tier: "decision-instrument",
    category: "decision_tools" as ProductCategory,
    accessType: "one_time" as AccessType,
    duration: "lifetime" as Duration,
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    successPath: "/decision-instruments/escalation-readiness-scorecard/run",
    cancelPath: "/decision-instruments",
    cookieName: null,
    includes: [],
    shortDescription: "Determine whether a decision is ready for executive, strategy, counsel, or retained escalation.",
    deliveryFormat: "interactive_instrument",
    estimatedCompletionMinutes: 6,
    writesToDecisionMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: "Executive Reporting or Strategy Room",
  },

  structural_failure_diagnostic_canvas: {
    code: "structural_failure_diagnostic_canvas",
    displayName: "Structural Failure Diagnostic Canvas",
    amount: 1900,
    displayPrice: "\u00a319",
    stripeProductId: "prod_UUZfGWTpw4HBtw",
    stripePriceId: "price_1TVaW0QFpelVFMXJA8uL6uFs",
    entitlementSlug: "structural-failure-diagnostic-canvas",
    tier: "decision-instrument",
    category: "decision_tools" as ProductCategory,
    accessType: "one_time" as AccessType,
    duration: "lifetime" as Duration,
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    successPath: "/decision-instruments/structural-failure-diagnostic-canvas/run",
    cancelPath: "/decision-instruments",
    cookieName: null,
    includes: [],
    shortDescription: "Identify whether the issue is strategic, operational, authority-based, or governance-based.",
    deliveryFormat: "interactive_instrument",
    estimatedCompletionMinutes: 8,
    writesToDecisionMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: "Intervention Path Selector",
  },

  execution_risk_index: {
    code: "execution_risk_index",
    displayName: "Execution Risk Index",
    amount: 4900,
    displayPrice: "\u00a349",
    stripeProductId: "prod_UUZhYqsDEf3RU4",
    stripePriceId: "price_1TVaXlQFpelVFMXJaUp4CcyW",
    entitlementSlug: "execution-risk-index",
    tier: "decision-instrument",
    category: "decision_tools" as ProductCategory,
    accessType: "one_time" as AccessType,
    duration: "lifetime" as Duration,
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    successPath: "/decision-instruments/execution-risk-index/run",
    cancelPath: "/decision-instruments",
    cookieName: null,
    includes: [],
    shortDescription: "Measure whether a decision can survive execution reality across 8 factors.",
    deliveryFormat: "interactive_instrument",
    estimatedCompletionMinutes: 10,
    writesToDecisionMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: "Strategy Room or Executive Reporting",
  },

  team_alignment_gap_map: {
    code: "team_alignment_gap_map",
    displayName: "Decision Alignment Gap Map",
    amount: 2900,
    displayPrice: "\u00a329",
    stripeProductId: "prod_UUZlpV3cJ5mRar",
    stripePriceId: "price_1TVabZQFpelVFMXJEWnyrpmL",
    entitlementSlug: "team-alignment-gap-map",
    tier: "decision-instrument",
    category: "decision_tools" as ProductCategory,
    accessType: "one_time" as AccessType,
    duration: "lifetime" as Duration,
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    successPath: "/decision-instruments/team-alignment-gap-map/run",
    cancelPath: "/decision-instruments",
    cookieName: null,
    includes: [],
    shortDescription: "Show where decision owners and affected operators diverge on reality, priority, and action.",
    deliveryFormat: "interactive_instrument",
    estimatedCompletionMinutes: 10,
    writesToDecisionMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: "Mandate Clarity Framework",
  },

  // ═══ TIER 1B — ALIGNMENT & AUTHORITY ═════════════════════════════════════

  governance_drift_detector: {
    code: "governance_drift_detector",
    displayName: "Governance Drift Detector",
    amount: 4900,
    displayPrice: "\u00a349",
    stripeProductId: "prod_UUZmTzvPtjH5Cx",
    stripePriceId: "price_1TVadIQFpelVFMXJGNLVkoMl",
    entitlementSlug: "governance-drift-detector",
    tier: "decision-instrument",
    category: "decision_tools" as ProductCategory,
    accessType: "one_time" as AccessType,
    duration: "lifetime" as Duration,
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    successPath: "/decision-instruments/governance-drift-detector/run",
    cancelPath: "/decision-instruments",
    cookieName: null,
    includes: [],
    shortDescription: "Detect whether governance is drifting from declared standards across 6 dimensions.",
    deliveryFormat: "interactive_instrument",
    estimatedCompletionMinutes: 12,
    writesToDecisionMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: "Oversight Command or Retained Review",
  },

  strategic_priority_stack_builder: {
    code: "strategic_priority_stack_builder",
    displayName: "Strategic Priority Stack Builder",
    amount: 7900,
    displayPrice: "\u00a379",
    stripeProductId: "prod_UUZoZBRllX8jux",
    stripePriceId: "price_1TVaevQFpelVFMXJYVpONZTM",
    entitlementSlug: "strategic-priority-stack-builder",
    tier: "decision-instrument",
    category: "decision_tools" as ProductCategory,
    accessType: "one_time" as AccessType,
    duration: "lifetime" as Duration,
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    successPath: "/decision-instruments/strategic-priority-stack-builder/run",
    cancelPath: "/decision-instruments",
    cookieName: null,
    includes: [],
    shortDescription: "Convert competing priorities into a governed ranked stack with conflict detection.",
    deliveryFormat: "interactive_instrument",
    estimatedCompletionMinutes: 15,
    writesToDecisionMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: "Executive Reporting or Board Brief Builder",
  },

  // ═══ TIER 1C — BOARD & EXECUTION GRADE ══════════════════════════════════

  board_brief_builder: {
    code: "board_brief_builder",
    displayName: "Board Brief Builder",
    amount: 12900,
    displayPrice: "\u00a3129",
    stripeProductId: "prod_UUZqrFkzDl4oCO",
    stripePriceId: "price_1TVagTQFpelVFMXJ7wqif734",
    entitlementSlug: "board-brief-builder",
    tier: "decision-instrument-premium",
    category: "decision_tools" as ProductCategory,
    accessType: "one_time" as AccessType,
    duration: "lifetime" as Duration,
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    successPath: "/decision-instruments/board-brief-builder/run",
    cancelPath: "/decision-instruments",
    cookieName: null,
    includes: [],
    shortDescription: "Turn a decision record into a board-ready structured brief with objection handling.",
    deliveryFormat: "interactive_instrument",
    estimatedCompletionMinutes: 20,
    writesToDecisionMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: "Boardroom or Proof Pack",
  },

  // ═══ GOVERNED PLAYBOOKS ═════════════════════════════════════════════════

  execution_integrity_protocol: {
    code: "execution_integrity_protocol",
    displayName: "Execution Integrity Protocol",
    amount: 4900,
    displayPrice: "\u00a349",
    stripeProductId: "prod_UUao8cfUdkfDUt",
    stripePriceId: "price_1TVbcqQFpelVFMXJrDWrVe7X",
    entitlementSlug: "playbook.execution-integrity-protocol.access",
    tier: "governed-playbook",
    category: "governed_playbook" as ProductCategory,
    accessType: "one_time" as AccessType,
    duration: "lifetime" as Duration,
    active: true,
    commercialStatus: "manual_billing" as CommercialStatus,
    successPath: "/playbooks/execution-integrity-protocol/run",
    cancelPath: "/playbooks",
    cookieName: "aol_paid_execution_integrity_protocol",
    requiresCheckout: false,
    includes: [],
    shortDescription: "Restore execution discipline without rewriting strategy. Controlled-release governed methodology run; request access while self-serve checkout is not enabled.",
    primaryCta: "Request access",
    deliveryFormat: "governed_methodology_run",
    estimatedCompletionMinutes: 15,
    writesToDecisionMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: "Execution Risk Index or Strategy Room",
  },

  alignment_audit_playbook: {
    code: "alignment_audit_playbook",
    displayName: "The Alignment Audit Playbook",
    amount: 4900,
    displayPrice: "\u00a349",
    stripeProductId: "prod_UUarolZ86m0oLG",
    stripePriceId: "price_1TVbfLQFpelVFMXJRMwJ3ksk",
    entitlementSlug: "playbook.alignment-audit.access",
    tier: "governed-playbook",
    category: "governed_playbook" as ProductCategory,
    accessType: "one_time" as AccessType,
    duration: "lifetime" as Duration,
    active: true,
    commercialStatus: "manual_billing" as CommercialStatus,
    successPath: "/playbooks/the-alignment-audit-playbook/run",
    cancelPath: "/playbooks",
    cookieName: "aol_paid_alignment_audit_playbook",
    requiresCheckout: false,
    includes: [],
    shortDescription: "Diagnose organisational misalignment before intervention. Controlled-release governed methodology run; request access while self-serve checkout is not enabled.",
    primaryCta: "Request access",
    deliveryFormat: "governed_methodology_run",
    estimatedCompletionMinutes: 20,
    writesToDecisionMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: "Strategic Priority Stack Builder or Executive Reporting",
  },

  drift_detection_framework: {
    code: "drift_detection_framework",
    displayName: "The Drift Detection Framework",
    amount: 3900,
    displayPrice: "\u00a339",
    stripeProductId: "prod_UUas0gVjMrIXnw",
    stripePriceId: "price_1TVbgpQFpelVFMXJIm9gc8rL",
    entitlementSlug: "playbook.drift-detection-framework.access",
    tier: "governed-playbook",
    category: "governed_playbook" as ProductCategory,
    accessType: "one_time" as AccessType,
    duration: "lifetime" as Duration,
    active: true,
    commercialStatus: "manual_billing" as CommercialStatus,
    successPath: "/playbooks/the-drift-detection-framework/run",
    cancelPath: "/playbooks",
    cookieName: "aol_paid_drift_detection_framework",
    requiresCheckout: false,
    includes: [],
    shortDescription: "Identify silent organisational decay before it becomes structural failure. Controlled-release governed methodology run; request access while self-serve checkout is not enabled.",
    primaryCta: "Request access",
    deliveryFormat: "governed_methodology_run",
    estimatedCompletionMinutes: 12,
    writesToDecisionMemory: true,
    dossierEligible: true,
    nextAdmissibleMove: "Governance Drift Detector or Oversight Command",
  },

  // ═══ PACKS ══════════════════════════════════════════════════════════════

  operator_decision_pack: {
    code: "operator_decision_pack",
    displayName: "Operator Decision Pack",
    amount: 12900,
    displayPrice: "\u00a3129",
    stripeProductId: "prod_SRLpFVDmjvVsv3",
    stripePriceId: "price_1TP1idQFpelVFMXJG77Vj5bE",
    entitlementSlug: "operator-decision-pack",
    tier: "decision-pack",
    category: "bundle",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    successPath: "/decision-instruments/operator-decision-pack/start",
    cancelPath: "/decision-instruments",
    cookieName: null,
    includes: [
      "decision_exposure_instrument",
      "mandate_clarity_framework",
      "intervention_path_selector",
    ],
  },

  operator_essentials_pack: {
    code: "operator_essentials_pack",
    displayName: "Operator Essentials",
    amount: 12900,
    displayPrice: "\u00a3129",
    stripeProductId: "prod_UUZsFTHRigifxM",
    stripePriceId: "price_1TVaioQFpelVFMXJe2jvAB0C",
    entitlementSlug: "operator-essentials-pack",
    tier: "decision-pack",
    category: "bundle" as ProductCategory,
    accessType: "one_time" as AccessType,
    duration: "lifetime" as Duration,
    active: false,
    commercialStatus: "inactive", // Pack checkout blocked until bundle entitlement resolution is verified
    successPath: "/decision-instruments",
    cancelPath: "/decision-instruments",
    cookieName: null,
    includes: [
      "decision_exposure_instrument",
      "escalation_readiness_scorecard",
      "structural_failure_diagnostic_canvas",
      "execution_risk_index",
    ],
    shortDescription: "What is broken, and how exposed are we?",
    deliveryFormat: "bundle" as const,
  },

  command_pack: {
    code: "command_pack",
    displayName: "Command Pack",
    amount: 24900,
    displayPrice: "\u00a3249",
    stripeProductId: "prod_UUZttE6rWwtbj9",
    stripePriceId: "price_1TVak1QFpelVFMXJekck5w1o",
    entitlementSlug: "command-pack",
    tier: "decision-pack",
    category: "bundle" as ProductCategory,
    accessType: "one_time" as AccessType,
    duration: "lifetime" as Duration,
    active: false,
    commercialStatus: "inactive", // Pack checkout blocked until bundle entitlement resolution is verified
    successPath: "/decision-instruments",
    cancelPath: "/decision-instruments",
    cookieName: null,
    includes: [
      "decision_exposure_instrument",
      "escalation_readiness_scorecard",
      "structural_failure_diagnostic_canvas",
      "execution_risk_index",
      "mandate_clarity_framework",
      "team_alignment_gap_map",
    ],
    shortDescription: "What is broken, who should fix it, and where is alignment failing?",
    deliveryFormat: "bundle" as const,
  },

  governance_suite: {
    code: "governance_suite",
    displayName: "Governance Suite",
    amount: 49500,
    displayPrice: "\u00a3495",
    stripeProductId: "prod_UUZv4DKEL6PiaB",
    stripePriceId: "price_1TVallQFpelVFMXJZdNH3bOh",
    entitlementSlug: "governance-suite",
    tier: "decision-suite",
    category: "bundle" as ProductCategory,
    accessType: "one_time" as AccessType,
    duration: "lifetime" as Duration,
    active: false,
    commercialStatus: "inactive", // Pack checkout blocked until bundle entitlement resolution is verified
    successPath: "/decision-instruments",
    cancelPath: "/decision-instruments",
    cookieName: null,
    includes: [
      "decision_exposure_instrument",
      "escalation_readiness_scorecard",
      "structural_failure_diagnostic_canvas",
      "execution_risk_index",
      "team_alignment_gap_map",
      "mandate_clarity_framework",
      "governance_drift_detector",
      "strategic_priority_stack_builder",
      "intervention_path_selector",
      "board_brief_builder",
    ],
    shortDescription: "How do we govern this decision estate?",
    deliveryFormat: "bundle" as const,
  },

  // ═══ B. EVIDENCE LAYER ════════════════════════════════════════════════════

  case_dossier_tariff_shock: {
    code: "case_dossier_tariff_shock",
    displayName: "Case Dossier \u2014 Tariff Shock",
    amount: 0,
    displayPrice: "Free",
    stripeProductId: null,
    stripePriceId: null, // Removed — free products do not require Stripe checkout
    entitlementSlug: "case-dossier-tariff-shock",
    tier: "evidence",
    category: "evidence",
    accessType: "free",
    duration: "lifetime",
    active: true,
    commercialStatus: "free_controlled",
    hiddenFromPricing: true,
    hiddenReason: "free_evidence_dossier",
    successPath: "/evidence/tariff-shock-growth-break",
    cancelPath: "/evidence",
    cookieName: null,
    includes: [],
  },

  case_dossier_team_alignment: {
    code: "case_dossier_team_alignment",
    displayName: "Case Dossier \u2014 Team Alignment",
    amount: 0,
    displayPrice: "Free",
    stripeProductId: null,
    stripePriceId: null, // Removed — free products do not require Stripe checkout
    entitlementSlug: "case-dossier-team-alignment-illusion",
    tier: "evidence",
    category: "evidence",
    accessType: "free",
    duration: "lifetime",
    active: true,
    commercialStatus: "free_controlled",
    hiddenFromPricing: true,
    hiddenReason: "free_evidence_dossier",
    successPath: "/evidence/team-alignment-illusion",
    cancelPath: "/evidence",
    cookieName: null,
    includes: [],
  },

  case_dossier_escalation_denied: {
    code: "case_dossier_escalation_denied",
    displayName: "Case Dossier \u2014 Escalation Denied",
    amount: 0,
    displayPrice: "Free",
    stripeProductId: null,
    stripePriceId: null, // Removed — free products do not require Stripe checkout
    entitlementSlug: "case-dossier-escalation-denied",
    tier: "evidence",
    category: "evidence",
    accessType: "free",
    duration: "lifetime",
    active: true,
    commercialStatus: "free_controlled",
    hiddenFromPricing: true,
    hiddenReason: "free_evidence_dossier",
    successPath: "/evidence/escalation-denied-case",
    cancelPath: "/evidence",
    cookieName: null,
    includes: [],
  },

  // ═══ C. INTELLIGENCE LAYER ���════════════════════════���═════════════════════

  gmi_q1_2026: {
    code: "gmi_q1_2026",
    displayName: "Global Market Intelligence Report \u2014 Q1 2026",
    amount: 5900,
    displayPrice: "\u00a359",
    stripeProductId: null, // Stripe resolves via priceId — productId for metadata only
    stripePriceId: "price_1TP1rRQFpelVFMXJWaFMOpJQ",
    entitlementSlug: "global-market-intelligence-report-q1-2026",
    tier: "premium-report",
    category: "intelligence",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    hiddenFromPricing: false,
    shortDescription: "Q1 2026 market intelligence kept active for Q2 decision use until the Q2 report supersedes it.",
    pricingNote: "Coverage period: Q1 2026. Current decision window: Q2 2026. Updated 8 April 2026.",
    successPath: "/artifacts/global-market-intelligence-report-q1-2026",
    cancelPath: "/artifacts/global-market-intelligence-report-q1-2026",
    cookieName: null,
    includes: [],
  },

  // ═══ D. REPORTING LAYER ══════���═══════════════════════════════════════════

  executive_reporting: {
    code: "executive_reporting",
    displayName: "Executive Reporting",
    amount: 29500,
    displayPrice: "\u00a3295",
    stripeProductId: "prod_UWxIps4rApNxcx",
    stripePriceId: "price_1TXtNlQFpelVFMXJtn73BFTl",
    entitlementSlug: "assessment.executive_reporting",
    tier: "one-time-executive-reporting",
    category: "reporting",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    successPath: "/diagnostics/executive-reporting/run",
    cancelPath: "/diagnostics/executive-reporting",
    cookieName: "aol_paid_executive_reporting",
    includes: [],
  },

  diagnostic_report_basic: {
    code: "diagnostic_report_basic",
    displayName: "Diagnostic Report \u2014 Basic",
    amount: 25000,
    displayPrice: "\u00a3250",
    stripeProductId: null,
    stripePriceId: "price_1TP1ufQFpelVFMXJ4NqwIXjv",
    entitlementSlug: "diagnostic-report-basic",
    tier: "one-time-reporting",
    category: "reporting",
    accessType: "one_time",
    duration: "lifetime",
    active: false,
    commercialStatus: "inactive",
    successPath: "/diagnostics",
    cancelPath: "/diagnostics",
    cookieName: null,
    includes: [],
  },

  diagnostic_report_pro: {
    code: "diagnostic_report_pro",
    displayName: "Diagnostic Report \u2014 Pro",
    amount: 75000,
    displayPrice: "\u00a3750",
    stripeProductId: null,
    stripePriceId: "price_1TP1w5QFpelVFMXJvIQUVqgz",
    entitlementSlug: "diagnostic-report-pro",
    tier: "one-time-reporting",
    category: "reporting",
    accessType: "one_time",
    duration: "lifetime",
    active: false,
    commercialStatus: "inactive",
    successPath: "/diagnostics",
    cancelPath: "/diagnostics",
    cookieName: null,
    includes: [],
  },

  executive_reporting_priority: {
    code: "executive_reporting_priority",
    displayName: "Executive Reporting \u2014 Advanced",
    amount: 29500,
    displayPrice: "\u00a3295",
    stripeProductId: "prod_UWxIps4rApNxcx",
    stripePriceId: "price_1TXtNlQFpelVFMXJtn73BFTl",
    entitlementSlug: "executive-reporting-priority",
    tier: "one-time-reporting-priority",
    category: "reporting_premium",
    accessType: "one_time",
    duration: "lifetime",
    active: false,
    commercialStatus: "inactive", // Deactivated — duplicate of executive_reporting at same price. Use executive_reporting as canonical.
    successPath: "/diagnostics/executive-reporting/run",
    cancelPath: "/diagnostics/executive-reporting",
    cookieName: "aol_paid_executive_reporting",
    includes: [],
  },

  // ═��═ E. EXECUTION LAYER ��═══════════��════════════════════════════════��════

  strategy_room: {
    code: "strategy_room",
    displayName: "Strategy Room \u2014 Entry",
    amount: 75000,
    displayPrice: "\u00a3750",
    stripeProductId: "prod_UOAYVuehd5sSG0",
    stripePriceId: "price_1TPODlQFpelVFMXJY3Mo0ayo",
    entitlementSlug: "strategy-room.entry",
    tier: "one-time-strategy-room",
    category: "execution",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    successPath: "/strategy-room",
    cancelPath: "/strategy-room",
    cookieName: "aol_paid_strategy_room",
    includes: [],
  },

  strategy_room_extended: {
    code: "strategy_room_extended",
    displayName: "Strategy Room \u2014 Active / Multi-Decision",
    amount: 125000,
    displayPrice: "\u00a31,250",
    stripeProductId: "prod_UOAYVuehd5sSG0",
    stripePriceId: "price_1TP26NQFpelVFMXJgMpsREew",
    entitlementSlug: "strategy-room-extended",
    tier: "execution-premium",
    category: "execution_premium",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    successPath: "/strategy-room",
    cancelPath: "/strategy-room",
    cookieName: "aol_paid_strategy_room",
    includes: [],
  },

  // ══�� F. MEMBERSHIP LAYER ═══════════════════════════════════════════════��═

  inner_circle: {
    code: "inner_circle",
    displayName: "Inner Circle",
    amount: 3000,
    displayPrice: "\u00a330/mo",
    stripeProductId: null,
    stripePriceId: "price_1TP20xQFpelVFMXJwBO0Kz1h",
    entitlementSlug: "inner-circle",
    tier: "inner-circle",
    category: "membership",
    accessType: "subscription",
    duration: "monthly",
    active: false,
    commercialStatus: "inactive",
    successPath: "/inner-circle",
    cancelPath: "/",
    cookieName: null,
    includes: [],
  },

  // ═══ G. ENTERPRISE RETAINER LAYER ════════════════════════════════════════
  // Stripe subscription price IDs are intentionally not guessed here. These
  // products are first-class catalog identities, but inactive until contracted
  // monthly prices are created in Stripe and inserted into this SSOT.

  retainer_core: {
    code: "retainer_core",
    displayName: "Decision Authority Retainer — Core",
    amount: 0,
    displayPrice: "Contracted monthly",
    stripeProductId: null,
    stripePriceId: null,
    entitlementSlug: "retainer_core",
    tier: "CORE",
    category: "retainer",
    accessType: "subscription",
    duration: "monthly",
    active: false,
    commercialStatus: "contracted",
    requiresContract: true,
    requiresCheckout: false,
    successPath: "/retainer",
    cancelPath: "/retainer",
    cookieName: null,
    includes: [],
  },

  retainer_operational: {
    code: "retainer_operational",
    displayName: "Decision Authority Retainer — Operational",
    amount: 0,
    displayPrice: "Contracted monthly",
    stripeProductId: null,
    stripePriceId: null,
    entitlementSlug: "retainer_operational",
    tier: "OPERATIONAL",
    category: "retainer",
    accessType: "subscription",
    duration: "monthly",
    active: false,
    commercialStatus: "contracted",
    requiresContract: true,
    requiresCheckout: false,
    successPath: "/retainer",
    cancelPath: "/retainer",
    cookieName: null,
    includes: [],
  },

  retainer_institutional: {
    code: "retainer_institutional",
    displayName: "Decision Authority Retainer — Institutional",
    amount: 0,
    displayPrice: "Contracted monthly",
    stripeProductId: null,
    stripePriceId: null,
    entitlementSlug: "retainer_institutional",
    tier: "INSTITUTIONAL",
    category: "retainer",
    accessType: "subscription",
    duration: "monthly",
    active: false,
    commercialStatus: "contracted",
    requiresContract: true,
    requiresCheckout: false,
    successPath: "/retainer",
    cancelPath: "/retainer",
    cookieName: null,
    includes: [],
  },

  // ═══ PROFESSIONAL TIER ══════════════════════════════════════════════════

  professional: {
    code: "professional",
    displayName: "Professional",
    marketName: "Professional",
    publicLabel: "Professional",
    amount: 5900,
    displayPrice: "£59/month",
    stripeProductId: "prod_UWwpCLnxMuqDff",
    stripePriceId: "price_1TXsvkQFpelVFMXJ4OSKRCiR",
    entitlementSlug: "tier.professional",
    tier: "professional",
    category: "membership",
    accessType: "subscription",
    duration: "monthly",
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    requiresContract: false,
    futurePaidCandidate: false,
    successPath: "/decision-centre",
    cancelPath: "/pricing",
    cookieName: null,
    includes: [],
    shortDescription: "The continuity layer: unlimited active governed cases, Return Brief generation, client-safe evidence export, client-safe reviewer links, and organisation workspace.",
    userPromise: "Preserve continuity across governed cases. Keep new active cases moving and unlock Return Brief generation, client-safe evidence export, reviewer links, and organisation collaboration.",
    pricingNote: "Professional is the continuity layer for ongoing governed case work.",
    primaryCta: "Upgrade to Professional",
    upgradePath: [],
  },

  // ═══ PROFESSIONAL ANNUAL ════════════════════════════════════════════════

  professional_annual: {
    code: "professional_annual",
    displayName: "Professional Annual",
    marketName: "Professional Annual",
    publicLabel: "Professional Annual",
    amount: 59000,
    displayPrice: "£590/year",
    stripeProductId: "prod_UWwsNbIyuncGmT",
    stripePriceId: "price_1TXsyXQFpelVFMXJp9Ey5FiB",
    entitlementSlug: "tier.professional",
    tier: "professional",
    category: "membership",
    accessType: "subscription",
    duration: "annual",
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    requiresContract: false,
    futurePaidCandidate: false,
    successPath: "/decision-centre",
    cancelPath: "/pricing",
    cookieName: null,
    includes: [],
    shortDescription: "All Professional features at an annual rate — two months free compared to monthly.",
    userPromise: "All Professional features with annual billing. Two months free. Cancel anytime.",
    pricingNote: "Professional Annual — two months free compared to monthly billing.",
    primaryCta: "Go Annual — save 2 months",
    upgradePath: [],
  },

  // ═══ ENTERPRISE ════════════════════════════════════════════════════════

  enterprise: {
    code: "enterprise",
    displayName: "Enterprise",
    marketName: "Enterprise",
    publicLabel: "Enterprise",
    amount: 0,
    displayPrice: "Custom",
    stripeProductId: null,
    stripePriceId: null,
    entitlementSlug: "tier.enterprise",
    tier: "enterprise",
    category: "membership",
    accessType: "subscription",
    duration: "annual",
    active: true,
    commercialStatus: "contracted",
    requiresCheckout: false,
    requiresContract: true,
    futurePaidCandidate: true,
    successPath: "/contact",
    cancelPath: "/pricing",
    cookieName: null,
    includes: [],
    shortDescription: "Annual custom plan for organisations. Includes organisation workspace, seat management, and dedicated support.",
    userPromise: "Enterprise-grade governed decision infrastructure. Annual custom plan with organisation workspace, seat management, and dedicated support.",
    pricingNote: "Enterprise — annual / custom pricing. Contact for details.",
    primaryCta: "Request Enterprise access",
    upgradePath: [],
  },

  // ═══ ADDITIONAL COLLABORATOR SEAT ═════════════════════════════════════

  additional_collaborator: {
    code: "additional_collaborator",
    displayName: "Additional Collaborator",
    marketName: "Additional Collaborator",
    publicLabel: "Additional Collaborator",
    amount: 1500,
    displayPrice: "£15/month",
    stripeProductId: "prod_UWwvGUtEuJn6mx",
    stripePriceId: null,
    entitlementSlug: "seat.additional",
    tier: "professional",
    category: "membership",
    accessType: "subscription",
    duration: "monthly",
    active: true,
    commercialStatus: "manual_billing",
    requiresCheckout: false,
    requiresContract: false,
    futurePaidCandidate: true,
    successPath: "/decision-centre",
    cancelPath: "/pricing",
    cookieName: null,
    includes: [],
    shortDescription: "Additional collaborator support for Professional organisation workspace.",
    userPromise: "Add collaborators as your governed case load grows. Additional collaborator billing is currently handled manually.",
    pricingNote: "Additional collaborators: £15/month each after included seats. Added through account billing support until automated seat billing is enabled.",
    primaryCta: "Add collaborator seat",
    upgradePath: [],
  },
};

// ───────────────��───────────────────────────────��─────────────────────────────
// Lookups
// ───────��────────────────���────────────────────────────────────────────────────

export function getProduct(code: string): CatalogProduct | null {
  return CATALOG[code] ?? null;
}

export function requireProduct(code: string): CatalogProduct {
  const product = getProduct(code);
  if (!product) {
    throw new Error(`Unknown commercial product: ${code}`);
  }
  return product;
}

export function getProductDisplayPrice(code: string): string {
  return requireProduct(code).displayPrice;
}

export function getProductAmountGbp(code: string): number {
  return requireProduct(code).amount / 100;
}

export function getAllProducts(): CatalogProduct[] {
  return Object.values(CATALOG);
}

export function getActiveProducts(): CatalogProduct[] {
  return getAllProducts().filter((p) => p.active);
}

export function getActivePaidProducts(): CatalogProduct[] {
  return getActiveProducts().filter((p) => p.accessType !== "free" && p.amount > 0);
}

export function getProductsByCategory(cat: ProductCategory): CatalogProduct[] {
  return getAllProducts().filter((p) => p.category === cat);
}

export function getProductByStripePriceId(priceId: string): CatalogProduct | null {
  return getAllProducts().find((p) => p.stripePriceId === priceId) ?? null;
}

export function getProductByStripeProductId(productId: string): CatalogProduct | null {
  return getAllProducts().find((p) => p.stripeProductId === productId) ?? null;
}

export function getProductByEntitlementSlug(slug: string): CatalogProduct | null {
  return getAllProducts().find((p) => p.entitlementSlug === slug) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing Family — canonical membership for the /pricing page
// Every active, non-hidden product must appear here.
// Inactive products are mapped to inactive_archive for completeness.
// ─────────────────────────────────────────────────────────────────────────────

export const PRICING_FAMILIES: Record<string, PricingFamily> = {
  // Free entry
  fast_diagnostic: "free_entry",
  // Professional subscription
  professional: "professional_subscription",
  professional_annual: "professional_subscription",
  additional_collaborator: "professional_subscription",
  // Governed instruments (paid one-time decision tools + bundle)
  personal_decision_audit: "governed_instruments",
  decision_exposure_instrument: "governed_instruments",
  mandate_clarity_framework: "governed_instruments",
  intervention_path_selector: "governed_instruments",
  escalation_readiness_scorecard: "governed_instruments",
  structural_failure_diagnostic_canvas: "governed_instruments",
  execution_risk_index: "governed_instruments",
  team_alignment_gap_map: "governed_instruments",
  governance_drift_detector: "governed_instruments",
  strategic_priority_stack_builder: "governed_instruments",
  board_brief_builder: "governed_instruments",
  operator_decision_pack: "governed_instruments",
  // Governance playbooks (manual billing, request access)
  execution_integrity_protocol: "governance_playbooks",
  alignment_audit_playbook: "governance_playbooks",
  drift_detection_framework: "governance_playbooks",
  // Executive reporting
  executive_reporting: "executive_reporting",
  // Strategy Room
  strategy_room: "strategy_room",
  strategy_room_extended: "strategy_room",
  // Intelligence reports
  gmi_q1_2026: "intelligence_reports",
  // Enterprise retainer
  enterprise: "enterprise_retainer",
  retainer_core: "enterprise_retainer",
  retainer_operational: "enterprise_retainer",
  retainer_institutional: "enterprise_retainer",
  // Inactive archive — products not publicly priced
  operator_essentials_pack: "inactive_archive",
  command_pack: "inactive_archive",
  governance_suite: "inactive_archive",
  diagnostic_report_basic: "inactive_archive",
  diagnostic_report_pro: "inactive_archive",
  executive_reporting_priority: "inactive_archive",
  inner_circle: "inactive_archive",
};

export function getProductPricingFamily(code: string): PricingFamily | null {
  return PRICING_FAMILIES[code] ?? null;
}

export function isValidProductCode(code: string): boolean {
  return code in CATALOG;
}

export function getStripePriceId(code: string): string | null {
  return getProduct(code)?.stripePriceId ?? null;
}

export function getCookieConfig(code: string): { cookieName: string } | null {
  const p = getProduct(code);
  return p?.cookieName ? { cookieName: p.cookieName } : null;
}

// ─────────────────────────────────────────────────────────���───────────────────
// Bundle Logic
// ────────��────────────────────────────────────────────────────────────────────

export function isBundle(code: string): boolean {
  const p = getProduct(code);
  return Boolean(p && p.includes.length > 0);
}

export function resolveEntitlementSlugs(code: string): string[] {
  const product = getProduct(code);
  if (!product) return [];
  const slugs = [product.entitlementSlug];
  for (const includedCode of product.includes) {
    const included = getProduct(includedCode);
    if (included) slugs.push(included.entitlementSlug);
  }
  return slugs;
}

// ─────────��─────────────────────────���─────────────────────────────��───────────
// Activation Guardrails
// ─────────���───────────────────────────────────────────────────────────────────

export type CheckoutEligibility =
  | { eligible: true; product: CatalogProduct }
  | { eligible: false; reason: string };

/** Check if a product can be purchased right now. */
export function checkCheckoutEligibility(code: string): CheckoutEligibility {
  const product = getProduct(code);
  if (!product) return { eligible: false, reason: "UNKNOWN_PRODUCT" };
  if (!product.active || product.commercialStatus === "inactive" || product.commercialStatus === "retired") {
    return { eligible: false, reason: "PRODUCT_INACTIVE" };
  }
  if (product.commercialStatus === "contracted") {
    return { eligible: false, reason: "PRODUCT_CONTRACTED" };
  }
  if (product.commercialStatus === "manual_billing") {
    return { eligible: false, reason: "MANUAL_BILLING_REQUIRED" };
  }
  if (product.requiresCheckout !== true) {
    return { eligible: false, reason: "CHECKOUT_NOT_AVAILABLE" };
  }
  if (!product.stripePriceId) {
    return { eligible: false, reason: "STRIPE_PRICE_MISSING" };
  }
  if (product.commercialStatus !== "paid") {
    return { eligible: false, reason: "INVALID_PRODUCT_STATE" };
  }
  if (product.amount <= 0 || product.accessType === "free") {
    return { eligible: false, reason: "INVALID_PRODUCT_STATE" };
  }
  return { eligible: true, product };
}

// ─────────────���─────────────────────────────────────────────���─────────────────
// Legacy Compatibility
// ────��─────────────────────────────────────────────────────────────���──────────

/** Resolve a code that might use old slug format (hyphens vs underscores). */
export function resolveProductCode(codeOrSlug: string): CatalogProduct | null {
  return getProduct(codeOrSlug)
    ?? getProduct(codeOrSlug.replace(/-/g, "_"))
    ?? getProductByEntitlementSlug(codeOrSlug)
    ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATALOG INTEGRITY ASSERTIONS — call at build time or test time
// ─────────────────────────────────────────────────────────────────────────────

export type CatalogIntegrityError = { code: string; message: string };

/** Assert all active self-serve checkout products have Stripe price IDs. */
export function assertActiveProductsHavePriceIds(): CatalogIntegrityError[] {
  return getActiveProducts()
    .filter((p) => p.commercialStatus === "paid" && p.requiresCheckout === true && !p.stripePriceId)
    .map((p) => ({ code: p.code, message: `Active checkout product "${p.code}" has no stripePriceId` }));
}

/** Assert no duplicate product codes exist. */
export function assertNoDuplicateProductCodes(): CatalogIntegrityError[] {
  const codes = getAllProducts().map((p) => p.code);
  const seen = new Set<string>();
  const dupes: CatalogIntegrityError[] = [];
  for (const code of codes) {
    if (seen.has(code)) dupes.push({ code, message: `Duplicate product code: "${code}"` });
    seen.add(code);
  }
  return dupes;
}

/** Assert no active product has a dead checkout path (success path must exist). */
export function assertNoDeadCheckoutProducts(): CatalogIntegrityError[] {
  return getActiveProducts()
    .filter((p) => p.amount > 0 && !p.successPath)
    .map((p) => ({ code: p.code, message: `Active paid product "${p.code}" has no successPath` }));
}

/** Check whether a product is safe for self-serve checkout. */
export function isCheckoutAvailable(product: CatalogProduct): boolean {
  return Boolean(
    product.active &&
      product.commercialStatus === "paid" &&
      product.requiresCheckout === true &&
      product.amount > 0 &&
      product.stripePriceId
  );
}

/** Check whether a product requires a contract (not self-serve). */
export function isContractedProduct(product: CatalogProduct): boolean {
  return product.commercialStatus === "contracted" || product.requiresContract === true;
}

/** Get display price with commercial status awareness. */
export function getCommercialDisplayPrice(product: CatalogProduct): string {
  if (product.commercialStatus === "contracted") {
    return product.displayPrice || "Contracted monthly";
  }
  if (product.commercialStatus === "free_controlled") {
    return product.pricingNote || product.displayPrice || "Currently free";
  }
  return product.displayPrice;
}

/** Resolve product by code, entitlement slug, or legacy name. */
export function resolveProductByAlias(alias: string): CatalogProduct | null {
  const normalized = alias.trim().toLowerCase().replace(/-/g, "_");
  // Direct code match
  if (CATALOG[normalized]) return CATALOG[normalized];
  // Entitlement slug match
  const bySlug = Object.values(CATALOG).find((p) => p.entitlementSlug === alias || p.entitlementSlug === normalized);
  if (bySlug) return bySlug;
  // Legacy name match
  const byLegacy = Object.values(CATALOG).find((p) =>
    p.legacyNames?.some((n) => n.toLowerCase().replace(/\s+/g, "_") === normalized || n.toLowerCase() === alias.toLowerCase())
  );
  if (byLegacy) return byLegacy;
  return null;
}
