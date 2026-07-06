/**
 * lib/product/product-fulfilment-contract.ts
 *
 * Canonical product fulfilment contract registry.
 *
 * Every product that can be sold, accessed, or fulfilled must have an entry here.
 * The validator (fulfilment-readiness-validator.ts) reads these contracts to
 * determine whether each product is sellable, proof-ready, or blocked.
 *
 * PRODUCT FREEZE RULE:
 * No new product may be added to the Stripe checkout, catalog, or any intake
 * route unless a corresponding ProductFulfilmentContract exists here AND the
 * validator passes with status !== "not_sellable". This is enforced by
 * scripts/check-product-fulfilment-readiness.mjs at build time.
 */

// ── Enums ──────────────────────────────────────────────────────────────────────

export type FulfilmentType =
  | "interactive_instrument"    // self-serve browser instrument, entitlement-gated
  | "governed_methodology_run"  // browser-based methodology, entitlement-gated
  | "human_reviewed_dossier"    // analyst-produced dossier, requires admin review
  | "executive_report_artifact" // AI-generated report artifact (ExecutiveReportingRun)
  | "scheduled_session"         // requires scheduling with Abraham
  | "bundle_grant"              // grants child product entitlements on payment
  | "retainer_cycle"            // contracted monthly oversight cycle
  | "free_asset"                // immediate free access, no checkout
  | "evidence_gated"            // access requires prior governed record
  | "free_controlled"           // free browser tool, no payment
  | "corridor_stage";           // named corridor stage (may be free or evidence-gated)

export type DeliveryModel =
  | "entitlement_on_payment"    // ClientEntitlement created by webhook
  | "analyst_review_and_send"   // human reviews and delivers dossier via admin
  | "ai_generation_and_send"    // AI generates artifact, admin confirms delivery
  | "session_scheduling"        // session booked with Abraham
  | "bundle_entitlement"        // each included product gets its own entitlement
  | "contracted_onboarding"     // retainer onboarding flow
  | "immediate_access"          // no fulfilment step needed (free)
  | "evidence_gate_review";     // access reviewed against prior record

export type ReadinessStatus =
  | "sellable"         // no hard failures, fulfilment path proven end-to-end
  | "proof_ready"      // no hard failures, but not yet proven in production
  | "not_sellable"     // has hard failures blocking sale/checkout
  | "not_applicable";  // free, inactive, evidence-gated — no fulfilment risk

export type ArtifactModel =
  | "BoardroomBriefOrder"
  | "ProductArtifact"
  | "ExecutiveReportingRun"
  | "OutcomeHypothesis"
  | "FalsificationEntry"
  | "CaseStudy"
  | "OversightReviewCycle"
  | "RetainerReadinessEvaluation";

// ── Contract type ──────────────────────────────────────────────────────────────

export type ProductFulfilmentContract = {
  // Identity
  productCode: string;
  displayName: string;
  entitlementSlug: string;
  stripePriceId: string | null;
  commercialStatus: "paid" | "free_controlled" | "contracted" | "inactive" | "evidence_gated" | "manual_billing";

  // Routes
  checkoutRoute: string | null;     // /api/checkout/... or /checkout/...
  intakeRoute: string | null;       // where the customer starts
  successRoute: string | null;      // post-purchase landing
  customerAccessRoute: string | null; // where they access the product
  adminRoute: string | null;        // /admin/... for operator

  // Fulfilment classification
  fulfilmentType: FulfilmentType;
  artifactModel: ArtifactModel | null;
  deliveryModel: DeliveryModel;

  // Observability
  dashboardVisibility: boolean;     // appears in /admin/fulfilment spine
  caseStudyEligible: boolean;
  feedbackSurface: string | null;   // where post-delivery feedback is collected
  estateSpineSourceType: string | null; // FulfilmentSourceType in estate-fulfilment-service

  // Readiness
  readinessStatus: ReadinessStatus;
  proofRunCompleted: boolean;       // at least one real paid order delivered end-to-end
  hardFailures: string[];           // reasons this product cannot be sold today
  warnings: string[];               // issues that should be resolved before scale
  notes: string | null;
};

// ── Helper ─────────────────────────────────────────────────────────────────────

function contract(c: ProductFulfilmentContract): ProductFulfilmentContract {
  return c;
}

// ── Contracts ─────────────────────────────────────────────────────────────────

/**
 * BOARDROOM BRIEF — Phase 8 exemplar contract.
 * Status: proof_ready (not sellable).
 * One real paid order received and partially fulfilled (dossier not yet delivered).
 * Full admin route exists. Fulfilment path structurally complete.
 * Missing for sellable: end-to-end delivery proven in production (proofRunCompleted must be true).
 */
export const BOARDROOM_BRIEF_CONTRACT = contract({
  productCode: "boardroom_brief",
  displayName: "Boardroom Brief",
  entitlementSlug: "boardroom-brief",
  stripePriceId: "price_1TddfeQFpelVFMXJWuTH7bB2",
  commercialStatus: "paid",

  checkoutRoute: "/api/checkout/boardroom-brief",
  intakeRoute: "/boardroom-brief",
  successRoute: "/boardroom-brief",
  customerAccessRoute: "/boardroom-brief",
  adminRoute: "/admin/boardroom/orders",

  fulfilmentType: "human_reviewed_dossier",
  artifactModel: "BoardroomBriefOrder",
  deliveryModel: "analyst_review_and_send",

  dashboardVisibility: true,
  caseStudyEligible: true,
  feedbackSurface: "/admin/boardroom/orders/[id]",
  estateSpineSourceType: "boardroom_brief_order",

  readinessStatus: "proof_ready",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [
    "Proof run not yet completed end-to-end in production (paid → review → dossier_generated → delivered)",
    "No automated dossier generation: analyst must manually create and upload dossier",
    "Delivery SLA (48h) enforced by admin UI only — no automated alert to customer on breach",
  ],
  notes:
    "First product with a full admin fulfilment route. Two paid orders received (one in_review). " +
    "Requires proof run before scaling. All structural pieces in place: webhook, order model, " +
    "admin queue, order detail, delivery status machine, estate spine, notifications.",
});

// ── Interactive Instruments ───────────────────────────────────────────────────

const INTERACTIVE_INSTRUMENT_DEFAULTS = {
  fulfilmentType: "interactive_instrument" as FulfilmentType,
  artifactModel: null,
  deliveryModel: "entitlement_on_payment" as DeliveryModel,
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: "product_artifact",
  proofRunCompleted: true,
  hardFailures: [],
  warnings: [],
  notes: null,
};

export const DECISION_EXPOSURE_INSTRUMENT_CONTRACT = contract({
  ...INTERACTIVE_INSTRUMENT_DEFAULTS,
  productCode: "decision_exposure_instrument",
  displayName: "Decision Exposure Instrument",
  entitlementSlug: "decision-exposure-instrument",
  stripePriceId: "price_1TP1XIQFpelVFMXJ35YurntT",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/decision-exposure-instrument",
  intakeRoute: "/decision-instruments/decision-exposure-instrument",
  successRoute: "/decision-instruments/decision-exposure-instrument/start",
  customerAccessRoute: "/decision-instruments/decision-exposure-instrument/run",
  adminRoute: "/admin/artifacts",
  readinessStatus: "sellable",
});

export const MANDATE_CLARITY_FRAMEWORK_CONTRACT = contract({
  ...INTERACTIVE_INSTRUMENT_DEFAULTS,
  productCode: "mandate_clarity_framework",
  displayName: "Mandate Clarity Framework",
  entitlementSlug: "mandate-clarity-framework",
  stripePriceId: "price_1TP1ZaQFpelVFMXJovfynFoS",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/mandate-clarity-framework",
  intakeRoute: "/decision-instruments/mandate-clarity-framework",
  successRoute: "/decision-instruments/mandate-clarity-framework/start",
  customerAccessRoute: "/decision-instruments/mandate-clarity-framework/run",
  adminRoute: "/admin/artifacts",
  readinessStatus: "sellable",
});

export const INTERVENTION_PATH_SELECTOR_CONTRACT = contract({
  ...INTERACTIVE_INSTRUMENT_DEFAULTS,
  productCode: "intervention_path_selector",
  displayName: "Intervention Path Selector",
  entitlementSlug: "intervention-path-selector",
  stripePriceId: "price_1TP1dRQFpelVFMXJvVlFQjWH",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/intervention-path-selector",
  intakeRoute: "/decision-instruments/intervention-path-selector",
  successRoute: "/decision-instruments/intervention-path-selector/start",
  customerAccessRoute: "/decision-instruments/intervention-path-selector/run",
  adminRoute: "/admin/artifacts",
  readinessStatus: "sellable",
});

export const ESCALATION_READINESS_SCORECARD_CONTRACT = contract({
  ...INTERACTIVE_INSTRUMENT_DEFAULTS,
  productCode: "escalation_readiness_scorecard",
  displayName: "Escalation Readiness Scorecard",
  entitlementSlug: "escalation-readiness-scorecard",
  stripePriceId: "price_1TVaSvQFpelVFMXJbfaw1N6c",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/escalation-readiness-scorecard",
  intakeRoute: "/decision-instruments/escalation-readiness-scorecard",
  successRoute: "/decision-instruments/escalation-readiness-scorecard/run",
  customerAccessRoute: "/decision-instruments/escalation-readiness-scorecard/run",
  adminRoute: "/admin/artifacts",
  readinessStatus: "sellable",
});

export const STRUCTURAL_FAILURE_DIAGNOSTIC_CANVAS_CONTRACT = contract({
  ...INTERACTIVE_INSTRUMENT_DEFAULTS,
  productCode: "structural_failure_diagnostic_canvas",
  displayName: "Structural Failure Diagnostic Canvas",
  entitlementSlug: "structural-failure-diagnostic-canvas",
  stripePriceId: "price_1TVaW0QFpelVFMXJA8uL6uFs",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/structural-failure-diagnostic-canvas",
  intakeRoute: "/decision-instruments/structural-failure-diagnostic-canvas",
  successRoute: "/decision-instruments/structural-failure-diagnostic-canvas/run",
  customerAccessRoute: "/decision-instruments/structural-failure-diagnostic-canvas/run",
  adminRoute: "/admin/artifacts",
  readinessStatus: "sellable",
});

export const EXECUTION_RISK_INDEX_CONTRACT = contract({
  ...INTERACTIVE_INSTRUMENT_DEFAULTS,
  productCode: "execution_risk_index",
  displayName: "Execution Risk Index",
  entitlementSlug: "execution-risk-index",
  stripePriceId: "price_1TVaXlQFpelVFMXJaUp4CcyW",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/execution-risk-index",
  intakeRoute: "/decision-instruments/execution-risk-index",
  successRoute: "/decision-instruments/execution-risk-index/run",
  customerAccessRoute: "/decision-instruments/execution-risk-index/run",
  adminRoute: "/admin/artifacts",
  readinessStatus: "sellable",
});

export const TEAM_ALIGNMENT_GAP_MAP_CONTRACT = contract({
  ...INTERACTIVE_INSTRUMENT_DEFAULTS,
  productCode: "team_alignment_gap_map",
  displayName: "Team Alignment Gap Map",
  entitlementSlug: "team-alignment-gap-map",
  stripePriceId: "price_1TVabZQFpelVFMXJEWnyrpmL",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/team-alignment-gap-map",
  intakeRoute: "/decision-instruments/team-alignment-gap-map",
  successRoute: "/decision-instruments/team-alignment-gap-map/run",
  customerAccessRoute: "/decision-instruments/team-alignment-gap-map/run",
  adminRoute: "/admin/artifacts",
  readinessStatus: "sellable",
});

export const GOVERNANCE_DRIFT_DETECTOR_CONTRACT = contract({
  ...INTERACTIVE_INSTRUMENT_DEFAULTS,
  productCode: "governance_drift_detector",
  displayName: "Governance Drift Detector",
  entitlementSlug: "governance-drift-detector",
  stripePriceId: "price_1TVadIQFpelVFMXJGNLVkoMl",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/governance-drift-detector",
  intakeRoute: "/decision-instruments/governance-drift-detector",
  successRoute: "/decision-instruments/governance-drift-detector/run",
  customerAccessRoute: "/decision-instruments/governance-drift-detector/run",
  adminRoute: "/admin/artifacts",
  readinessStatus: "sellable",
});

export const STRATEGIC_PRIORITY_STACK_BUILDER_CONTRACT = contract({
  ...INTERACTIVE_INSTRUMENT_DEFAULTS,
  productCode: "strategic_priority_stack_builder",
  displayName: "Strategic Priority Stack Builder",
  entitlementSlug: "strategic-priority-stack-builder",
  stripePriceId: "price_1TVaevQFpelVFMXJYVpONZTM",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/strategic-priority-stack-builder",
  intakeRoute: "/decision-instruments/strategic-priority-stack-builder",
  successRoute: "/decision-instruments/strategic-priority-stack-builder/run",
  customerAccessRoute: "/decision-instruments/strategic-priority-stack-builder/run",
  adminRoute: "/admin/artifacts",
  readinessStatus: "sellable",
});

export const BOARD_BRIEF_BUILDER_CONTRACT = contract({
  ...INTERACTIVE_INSTRUMENT_DEFAULTS,
  productCode: "board_brief_builder",
  displayName: "Board Brief Builder",
  entitlementSlug: "board-brief-builder",
  stripePriceId: "price_1TVagTQFpelVFMXJ7wqif734",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/board-brief-builder",
  intakeRoute: "/decision-instruments/board-brief-builder",
  successRoute: "/decision-instruments/board-brief-builder/run",
  customerAccessRoute: "/decision-instruments/board-brief-builder/run",
  adminRoute: "/admin/artifacts",
  readinessStatus: "sellable",
});

// ── Governed Methodology Runs ─────────────────────────────────────────────────

const GOVERNED_PLAYBOOK_DEFAULTS = {
  fulfilmentType: "governed_methodology_run" as FulfilmentType,
  artifactModel: null,
  deliveryModel: "entitlement_on_payment" as DeliveryModel,
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: "product_artifact",
  proofRunCompleted: true,
  hardFailures: [],
  warnings: [],
  notes: null,
};

export const EXECUTION_INTEGRITY_PROTOCOL_CONTRACT = contract({
  ...GOVERNED_PLAYBOOK_DEFAULTS,
  productCode: "execution_integrity_protocol",
  displayName: "Execution Integrity Protocol",
  entitlementSlug: "playbook.execution-integrity-protocol.access",
  stripePriceId: "price_1TVbcqQFpelVFMXJrDWrVe7X",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/execution-integrity-protocol",
  intakeRoute: "/playbooks/execution-integrity-protocol",
  successRoute: "/playbooks/execution-integrity-protocol/run",
  customerAccessRoute: "/playbooks/execution-integrity-protocol/run",
  adminRoute: "/admin/artifacts",
  readinessStatus: "sellable",
});

export const ALIGNMENT_AUDIT_PLAYBOOK_CONTRACT = contract({
  ...GOVERNED_PLAYBOOK_DEFAULTS,
  productCode: "alignment_audit_playbook",
  displayName: "The Alignment Audit Playbook",
  entitlementSlug: "playbook.alignment-audit.access",
  stripePriceId: "price_1TVbfLQFpelVFMXJRMwJ3ksk",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/alignment-audit-playbook",
  intakeRoute: "/playbooks/the-alignment-audit-playbook",
  successRoute: "/playbooks/the-alignment-audit-playbook/run",
  customerAccessRoute: "/playbooks/the-alignment-audit-playbook/run",
  adminRoute: "/admin/artifacts",
  readinessStatus: "sellable",
});

export const DRIFT_DETECTION_FRAMEWORK_CONTRACT = contract({
  ...GOVERNED_PLAYBOOK_DEFAULTS,
  productCode: "drift_detection_framework",
  displayName: "The Drift Detection Framework",
  entitlementSlug: "playbook.drift-detection-framework.access",
  stripePriceId: "price_1TVbgpQFpelVFMXJIm9gc8rL",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/drift-detection-framework",
  intakeRoute: "/playbooks/the-drift-detection-framework",
  successRoute: "/playbooks/the-drift-detection-framework/run",
  customerAccessRoute: "/playbooks/the-drift-detection-framework/run",
  adminRoute: "/admin/artifacts",
  readinessStatus: "sellable",
});

// ── Personal Decision Audit ───────────────────────────────────────────────────

export const PERSONAL_DECISION_AUDIT_CONTRACT = contract({
  productCode: "personal_decision_audit",
  displayName: "Personal Decision Audit",
  entitlementSlug: "personal-decision-audit",
  stripePriceId: "price_1TVbW8QFpelVFMXJzLrIQJu1",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/personal-decision-audit",
  intakeRoute: "/diagnostics/purpose-alignment",
  successRoute: "/diagnostics/purpose-alignment",
  customerAccessRoute: "/diagnostics/purpose-alignment",
  adminRoute: "/admin/artifacts",
  fulfilmentType: "interactive_instrument",
  artifactModel: null,
  deliveryModel: "entitlement_on_payment",
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: "product_artifact",
  readinessStatus: "sellable",
  proofRunCompleted: true,
  hardFailures: [],
  warnings: [],
  notes: null,
});

// ── Bundle ────────────────────────────────────────────────────────────────────

export const OPERATOR_DECISION_PACK_CONTRACT = contract({
  productCode: "operator_decision_pack",
  displayName: "Operator Decision Pack",
  entitlementSlug: "operator-decision-pack",
  stripePriceId: "price_1TP1idQFpelVFMXJG77Vj5bE",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/operator-decision-pack",
  intakeRoute: "/decision-instruments/operator-decision-pack",
  successRoute: "/decision-instruments/operator-decision-pack/start",
  customerAccessRoute: "/decision-instruments",
  adminRoute: "/admin/billing",
  fulfilmentType: "bundle_grant",
  artifactModel: null,
  deliveryModel: "bundle_entitlement",
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: null,
  readinessStatus: "proof_ready",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [
    "Bundle entitlement resolution not verified end-to-end: confirm each included product grants independently",
    "No bundle-level admin view: check /admin/billing for entitlement grant history",
  ],
  notes: "Includes: decision_exposure_instrument, mandate_clarity_framework, intervention_path_selector",
});

// ── Executive Reporting ───────────────────────────────────────────────────────

export const EXECUTIVE_REPORTING_CONTRACT = contract({
  productCode: "executive_reporting",
  displayName: "Executive Reporting",
  entitlementSlug: "assessment.executive_reporting",
  stripePriceId: "price_1TXtNlQFpelVFMXJtn73BFTl",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/executive-reporting",
  intakeRoute: "/diagnostics/executive-reporting",
  successRoute: "/diagnostics/executive-reporting/run",
  customerAccessRoute: "/diagnostics/executive-reporting/run",
  adminRoute: "/admin/reporting/executive",
  fulfilmentType: "executive_report_artifact",
  artifactModel: "ExecutiveReportingRun",
  deliveryModel: "ai_generation_and_send",
  dashboardVisibility: true,
  caseStudyEligible: true,
  feedbackSurface: "/admin/reporting/executive",
  estateSpineSourceType: "executive_report",
  readinessStatus: "proof_ready",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [
    "AI generation pipeline not verified end-to-end in production",
    "No automated delivery confirmation to customer after report is generated",
  ],
  notes: "ExecutiveReportingRun model exists. Admin route at /admin/reporting/executive.",
});

// ── Strategy Room ─────────────────────────────────────────────────────────────

export const STRATEGY_ROOM_CONTRACT = contract({
  productCode: "strategy_room",
  displayName: "Strategy Room — Entry",
  entitlementSlug: "strategy-room.entry",
  stripePriceId: "price_1TPODlQFpelVFMXJY3Mo0ayo",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/strategy-room",
  intakeRoute: "/strategy-room",
  successRoute: "/strategy-room",
  customerAccessRoute: "/strategy-room",
  adminRoute: "/admin/operations",
  fulfilmentType: "scheduled_session",
  artifactModel: null,
  deliveryModel: "session_scheduling",
  dashboardVisibility: false,
  caseStudyEligible: true,
  feedbackSurface: null,
  estateSpineSourceType: null,
  readinessStatus: "proof_ready",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [
    "No structured scheduling system: session booking is manual/ad-hoc",
    "No automated confirmation to customer after payment confirming session time",
    "No admin queue for incoming Strategy Room bookings",
  ],
  notes: "Session with Abraham. Fulfilment is manual. Stripe payment confirmed, access route exists.",
});

export const STRATEGY_ROOM_EXTENDED_CONTRACT = contract({
  productCode: "strategy_room_extended",
  displayName: "Strategy Room — Active / Multi-Decision",
  entitlementSlug: "strategy-room-extended",
  stripePriceId: "price_1TP26NQFpelVFMXJgMpsREew",
  commercialStatus: "paid",
  checkoutRoute: "/api/checkout/strategy-room-extended",
  intakeRoute: "/strategy-room",
  successRoute: "/strategy-room",
  customerAccessRoute: "/strategy-room",
  adminRoute: "/admin/operations",
  fulfilmentType: "scheduled_session",
  artifactModel: null,
  deliveryModel: "session_scheduling",
  dashboardVisibility: false,
  caseStudyEligible: true,
  feedbackSurface: null,
  estateSpineSourceType: null,
  readinessStatus: "proof_ready",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [
    "No structured scheduling system: session booking is manual/ad-hoc",
    "No admin queue for incoming Strategy Room bookings",
  ],
  notes: "Extended multi-decision variant. Same manual fulfilment as strategy_room.",
});

// ── Free / Not-Applicable ─────────────────────────────────────────────────────

const FREE_NA = {
  checkoutRoute: null,
  adminRoute: null,
  artifactModel: null,
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: null,
  readinessStatus: "not_applicable" as ReadinessStatus,
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [],
  notes: null,
};

export const FAST_DIAGNOSTIC_CONTRACT = contract({
  ...FREE_NA,
  productCode: "fast_diagnostic",
  displayName: "Fast Diagnostic",
  entitlementSlug: "fast-diagnostic",
  stripePriceId: null,
  commercialStatus: "free_controlled",
  intakeRoute: "/diagnostics/fast",
  successRoute: "/diagnostics/fast",
  customerAccessRoute: "/diagnostics/fast",
  fulfilmentType: "free_controlled",
  deliveryModel: "immediate_access",
});

export const TEAM_ASSESSMENT_CONTRACT = contract({
  ...FREE_NA,
  productCode: "team_assessment",
  displayName: "Team Assessment",
  entitlementSlug: "team-assessment",
  stripePriceId: null,
  commercialStatus: "free_controlled",
  intakeRoute: "/diagnostics/team-assessment",
  successRoute: "/diagnostics/team-assessment",
  customerAccessRoute: "/diagnostics/team-assessment",
  fulfilmentType: "corridor_stage",
  deliveryModel: "immediate_access",
});

export const ENTERPRISE_ASSESSMENT_CONTRACT = contract({
  ...FREE_NA,
  productCode: "enterprise_assessment",
  displayName: "Enterprise Assessment",
  entitlementSlug: "enterprise-assessment",
  stripePriceId: null,
  commercialStatus: "free_controlled",
  intakeRoute: "/diagnostics/enterprise-assessment",
  successRoute: "/diagnostics/enterprise-assessment",
  customerAccessRoute: "/diagnostics/enterprise-assessment",
  fulfilmentType: "corridor_stage",
  deliveryModel: "immediate_access",
});

export const BOARDROOM_MODE_CONTRACT = contract({
  ...FREE_NA,
  productCode: "boardroom_mode",
  displayName: "Boardroom Mode",
  entitlementSlug: "boardroom-mode",
  stripePriceId: null,
  commercialStatus: "evidence_gated",
  intakeRoute: "/boardroom-mode",
  successRoute: "/boardroom-mode",
  customerAccessRoute: "/boardroom-mode",
  fulfilmentType: "evidence_gated",
  deliveryModel: "evidence_gate_review",
  notes: "Requires prior Executive Reporting or governed case record. No Stripe checkout.",
});

export const CASE_DOSSIER_TARIFF_SHOCK_CONTRACT = contract({
  ...FREE_NA,
  productCode: "case_dossier_tariff_shock",
  displayName: "Case Dossier — Tariff Shock",
  entitlementSlug: "case-dossier-tariff-shock",
  stripePriceId: null,
  commercialStatus: "free_controlled",
  intakeRoute: "/evidence/tariff-shock-growth-break",
  successRoute: "/evidence/tariff-shock-growth-break",
  customerAccessRoute: "/evidence/tariff-shock-growth-break",
  fulfilmentType: "free_asset",
  deliveryModel: "immediate_access",
});

export const CASE_DOSSIER_TEAM_ALIGNMENT_CONTRACT = contract({
  ...FREE_NA,
  productCode: "case_dossier_team_alignment",
  displayName: "Case Dossier — Team Alignment",
  entitlementSlug: "case-dossier-team-alignment-illusion",
  stripePriceId: null,
  commercialStatus: "free_controlled",
  intakeRoute: "/evidence/team-alignment-illusion",
  successRoute: "/evidence/team-alignment-illusion",
  customerAccessRoute: "/evidence/team-alignment-illusion",
  fulfilmentType: "free_asset",
  deliveryModel: "immediate_access",
});

export const CASE_DOSSIER_ESCALATION_DENIED_CONTRACT = contract({
  ...FREE_NA,
  productCode: "case_dossier_escalation_denied",
  displayName: "Case Dossier — Escalation Denied",
  entitlementSlug: "case-dossier-escalation-denied",
  stripePriceId: null,
  commercialStatus: "free_controlled",
  intakeRoute: "/evidence/escalation-denied-case",
  successRoute: "/evidence/escalation-denied-case",
  customerAccessRoute: "/evidence/escalation-denied-case",
  fulfilmentType: "free_asset",
  deliveryModel: "immediate_access",
});

// ── Inactive / Contracted ────────────────────────────────────────────────────

const INACTIVE_NA = {
  ...FREE_NA,
  commercialStatus: "inactive" as const,
  stripePriceId: null,
  checkoutRoute: null,
  intakeRoute: null,
  successRoute: null,
  customerAccessRoute: null,
  adminRoute: null,
  fulfilmentType: "free_controlled" as FulfilmentType,
  deliveryModel: "immediate_access" as DeliveryModel,
};

export const RETAINER_CORE_CONTRACT = contract({
  ...INACTIVE_NA,
  productCode: "retainer_core",
  displayName: "Decision Authority Retainer — Core",
  entitlementSlug: "retainer_core",
  commercialStatus: "contracted",
  fulfilmentType: "retainer_cycle",
  deliveryModel: "contracted_onboarding",
  notes: "Contracted monthly. No self-serve checkout. Inactive until Stripe price confirmed.",
});

export const RETAINER_OPERATIONAL_CONTRACT = contract({
  ...INACTIVE_NA,
  productCode: "retainer_operational",
  displayName: "Decision Authority Retainer — Operational",
  entitlementSlug: "retainer_operational",
  commercialStatus: "contracted",
  fulfilmentType: "retainer_cycle",
  deliveryModel: "contracted_onboarding",
  notes: "Contracted monthly. Inactive until Stripe price confirmed.",
});

export const RETAINER_INSTITUTIONAL_CONTRACT = contract({
  ...INACTIVE_NA,
  productCode: "retainer_institutional",
  displayName: "Decision Authority Retainer — Institutional",
  entitlementSlug: "retainer_institutional",
  commercialStatus: "contracted",
  fulfilmentType: "retainer_cycle",
  deliveryModel: "contracted_onboarding",
  notes: "Contracted monthly. Inactive until Stripe price confirmed.",
});

// ── Professional Subscriptions ───────────────────────────────────────────────

export const PROFESSIONAL_CONTRACT = contract({
  productCode: "professional",
  displayName: "Professional",
  entitlementSlug: "tier.professional",
  stripePriceId: "price_1TXsvkQFpelVFMXJ4OSKRCiR",
  commercialStatus: "paid",
  checkoutRoute: "/api/billing/checkout",
  intakeRoute: "/pricing",
  successRoute: "/decision-centre",
  customerAccessRoute: "/decision-centre",
  adminRoute: "/admin/billing",
  fulfilmentType: "retainer_cycle",
  artifactModel: null,
  deliveryModel: "entitlement_on_payment",
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: null,
  readinessStatus: "proof_ready",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [
    "No admin queue for incoming Professional subscriptions — entitlements granted by webhook but not surfaced in estate spine",
    "Subscription renewal and cancellation (customer.subscription.updated/deleted) handled in webhook but not visible in any admin view",
    "No cycle-end notification to customer before expiry",
  ],
  notes: "Monthly subscription (£59/mo). Access to /decision-centre. Entitlement created by billing webhook on checkout.session.completed.",
});

export const PROFESSIONAL_ANNUAL_CONTRACT = contract({
  productCode: "professional_annual",
  displayName: "Professional Annual",
  entitlementSlug: "tier.professional",
  stripePriceId: "price_1TXsyXQFpelVFMXJp9Ey5FiB",
  commercialStatus: "paid",
  checkoutRoute: "/api/billing/checkout",
  intakeRoute: "/pricing",
  successRoute: "/decision-centre",
  customerAccessRoute: "/decision-centre",
  adminRoute: "/admin/billing",
  fulfilmentType: "retainer_cycle",
  artifactModel: null,
  deliveryModel: "entitlement_on_payment",
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: null,
  readinessStatus: "proof_ready",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [
    "Annual billing shares entitlementSlug with monthly — both grant tier.professional. Verify renewal path handles annual cadence correctly.",
    "No admin queue for incoming Professional Annual subscriptions",
  ],
  notes: "Annual subscription (£590/yr). Same entitlement slug as monthly Professional. Shares access path.",
});

// ── GMI Intelligence Reports ──────────────────────────────────────────────────

export const GMI_Q1_2026_CONTRACT = contract({
  productCode: "gmi_q1_2026",
  displayName: "Global Market Intelligence Report — Q1 2026",
  entitlementSlug: "global-market-intelligence-report-q1-2026",
  stripePriceId: "price_1TP1rRQFpelVFMXJWaFMOpJQ",
  commercialStatus: "paid",
  checkoutRoute: "/api/billing/checkout",
  intakeRoute: "/artifacts/global-market-intelligence-report-q1-2026",
  successRoute: "/artifacts/global-market-intelligence-report-q1-2026",
  customerAccessRoute: "/artifacts/global-market-intelligence-report-q1-2026",
  adminRoute: "/admin/intelligence/gmi-control-plane",
  fulfilmentType: "executive_report_artifact",
  artifactModel: "ProductArtifact",
  deliveryModel: "entitlement_on_payment",
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: "product_artifact",
  readinessStatus: "proof_ready",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [
    "Current published edition until Q2 completes final data lock and owner release authority.",
    "No automated post-purchase delivery email for GMI access confirmation",
  ],
  notes: "Current published Q1 2026 edition. Has active Stripe price. Report delivered as entitlement-gated artifact route until Q2 supersession is authorised.",
});

export const GMI_Q2_2026_CONTRACT = contract({
  productCode: "gmi_q2_2026",
  displayName: "Global Market Intelligence Report — Q2 2026",
  entitlementSlug: "global-market-intelligence-report-q2-2026",
  stripePriceId: null,
  commercialStatus: "inactive",
  checkoutRoute: null,
  intakeRoute: "/artifacts/global-market-intelligence-report-q2-2026",
  successRoute: "/artifacts/global-market-intelligence-report-q2-2026",
  customerAccessRoute: "/artifacts/global-market-intelligence-report-q2-2026",
  adminRoute: "/admin/intelligence/gmi-control-plane",
  fulfilmentType: "executive_report_artifact",
  artifactModel: "ProductArtifact",
  deliveryModel: "evidence_gate_review",
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: "product_artifact",
  readinessStatus: "not_applicable",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [
    "Market-ready release candidate — final post-8-July data lock and owner release authority pending.",
    "No self-serve checkout, manual billing, or Stripe binding is active before release authority.",
  ],
  notes: "Q2 2026 release candidate. Structurally market-ready; not commercially active. Stripe Product ID and Price ID remain null.",
});

export const GMI_Q3_2026_CONTRACT = contract({
  productCode: "gmi_q3_2026",
  displayName: "Global Market Intelligence Report — Q3 2026",
  entitlementSlug: "global-market-intelligence-report-q3-2026",
  stripePriceId: null,
  commercialStatus: "inactive",
  checkoutRoute: null,
  intakeRoute: null,
  successRoute: null,
  customerAccessRoute: null,
  adminRoute: "/admin/intelligence/gmi-control-plane",
  fulfilmentType: "executive_report_artifact",
  artifactModel: "ProductArtifact",
  deliveryModel: "entitlement_on_payment",
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: null,
  readinessStatus: "not_applicable",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [],
  notes: "Draft edition — not yet released. Blocked from checkout. Change registry status to active or manual_billing when ready.",
});

// ── Additional Inactive / Contracted ─────────────────────────────────────────

export const ENTERPRISE_CONTRACT = contract({
  ...{
    checkoutRoute: null,
    adminRoute: null,
    artifactModel: null,
    dashboardVisibility: false,
    caseStudyEligible: false,
    feedbackSurface: null,
    estateSpineSourceType: null,
    readinessStatus: "not_applicable" as ReadinessStatus,
    proofRunCompleted: false,
    hardFailures: [],
    warnings: [],
    notes: null,
  },
  productCode: "enterprise",
  displayName: "Enterprise",
  entitlementSlug: "tier.enterprise",
  stripePriceId: null,
  commercialStatus: "contracted",
  intakeRoute: "/contact",
  successRoute: "/contact",
  customerAccessRoute: "/decision-centre",
  adminRoute: "/admin/billing",
  fulfilmentType: "retainer_cycle",
  deliveryModel: "contracted_onboarding",
  notes: "Annual custom plan. No self-serve checkout. Contracted externally. Access provisioned manually.",
});

export const ADDITIONAL_COLLABORATOR_CONTRACT = contract({
  productCode: "additional_collaborator",
  displayName: "Additional Collaborator",
  entitlementSlug: "seat.additional",
  stripePriceId: null,
  commercialStatus: "manual_billing",
  checkoutRoute: null,
  intakeRoute: "/pricing",
  successRoute: "/decision-centre",
  customerAccessRoute: "/decision-centre",
  adminRoute: "/admin/billing",
  fulfilmentType: "retainer_cycle",
  artifactModel: null,
  deliveryModel: "contracted_onboarding",
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: null,
  readinessStatus: "not_applicable",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [],
  notes: "Additional collaborator seat. Manual billing — no self-serve checkout. Provisioned through account support.",
});

export const OPERATOR_ESSENTIALS_PACK_CONTRACT = contract({
  productCode: "operator_essentials_pack",
  displayName: "Operator Essentials",
  entitlementSlug: "operator-essentials-pack",
  stripePriceId: "price_1TVaioQFpelVFMXJe2jvAB0C",
  commercialStatus: "inactive",
  checkoutRoute: null,
  intakeRoute: null,
  successRoute: null,
  customerAccessRoute: null,
  adminRoute: null,
  fulfilmentType: "bundle_grant",
  artifactModel: null,
  deliveryModel: "bundle_entitlement",
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: null,
  readinessStatus: "not_applicable",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [],
  notes: "Inactive — bundle entitlement resolution not verified. Checkout blocked. Includes: decision_exposure_instrument, escalation_readiness_scorecard, structural_failure_diagnostic_canvas, execution_risk_index. Enable after confirming each included product delivers independently.",
});

export const COMMAND_PACK_CONTRACT = contract({
  productCode: "command_pack",
  displayName: "Command Pack",
  entitlementSlug: "command-pack",
  stripePriceId: "price_1TVak1QFpelVFMXJekck5w1o",
  commercialStatus: "inactive",
  checkoutRoute: null,
  intakeRoute: null,
  successRoute: null,
  customerAccessRoute: null,
  adminRoute: null,
  fulfilmentType: "bundle_grant",
  artifactModel: null,
  deliveryModel: "bundle_entitlement",
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: null,
  readinessStatus: "not_applicable",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [],
  notes: "Inactive — bundle entitlement resolution not verified. Checkout blocked. Includes: decision_exposure_instrument, escalation_readiness_scorecard, structural_failure_diagnostic_canvas, execution_risk_index, mandate_clarity_framework, team_alignment_gap_map.",
});

export const GOVERNANCE_SUITE_CONTRACT = contract({
  productCode: "governance_suite",
  displayName: "Governance Suite",
  entitlementSlug: "governance-suite",
  stripePriceId: "price_1TVallQFpelVFMXJZdNH3bOh",
  commercialStatus: "inactive",
  checkoutRoute: null,
  intakeRoute: null,
  successRoute: null,
  customerAccessRoute: null,
  adminRoute: null,
  fulfilmentType: "bundle_grant",
  artifactModel: null,
  deliveryModel: "bundle_entitlement",
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: null,
  readinessStatus: "not_applicable",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [],
  notes: "Inactive — bundle entitlement resolution not verified. Checkout blocked. Includes: decision_exposure_instrument, escalation_readiness_scorecard, structural_failure_diagnostic_canvas, execution_risk_index, team_alignment_gap_map, mandate_clarity_framework, governance_drift_detector, strategic_priority_stack_builder, intervention_path_selector, board_brief_builder.",
});

export const INNER_CIRCLE_CONTRACT = contract({
  productCode: "inner_circle",
  displayName: "Inner Circle",
  entitlementSlug: "inner-circle",
  stripePriceId: "price_1TP20xQFpelVFMXJwBO0Kz1h",
  commercialStatus: "inactive",
  checkoutRoute: null,
  intakeRoute: null,
  successRoute: null,
  customerAccessRoute: null,
  adminRoute: null,
  fulfilmentType: "retainer_cycle",
  artifactModel: null,
  deliveryModel: "entitlement_on_payment",
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: null,
  readinessStatus: "not_applicable",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [],
  notes: "Inactive monthly membership. No active checkout.",
});

export const DIAGNOSTIC_REPORT_BASIC_CONTRACT = contract({
  productCode: "diagnostic_report_basic",
  displayName: "Diagnostic Report — Basic",
  entitlementSlug: "diagnostic-report-basic",
  stripePriceId: "price_1TP1ufQFpelVFMXJ4NqwIXjv",
  commercialStatus: "inactive",
  checkoutRoute: null,
  intakeRoute: null,
  successRoute: null,
  customerAccessRoute: null,
  adminRoute: null,
  fulfilmentType: "executive_report_artifact",
  artifactModel: "ProductArtifact",
  deliveryModel: "ai_generation_and_send",
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: null,
  readinessStatus: "not_applicable",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [],
  notes: "Inactive. Superseded by executive_reporting. Stripe product ID absent.",
});

export const DIAGNOSTIC_REPORT_PRO_CONTRACT = contract({
  productCode: "diagnostic_report_pro",
  displayName: "Diagnostic Report — Pro",
  entitlementSlug: "diagnostic-report-pro",
  stripePriceId: "price_1TP1w5QFpelVFMXJvIQUVqgz",
  commercialStatus: "inactive",
  checkoutRoute: null,
  intakeRoute: null,
  successRoute: null,
  customerAccessRoute: null,
  adminRoute: null,
  fulfilmentType: "executive_report_artifact",
  artifactModel: "ProductArtifact",
  deliveryModel: "ai_generation_and_send",
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: null,
  readinessStatus: "not_applicable",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [],
  notes: "Inactive. Superseded by executive_reporting.",
});

export const EXECUTIVE_REPORTING_PRIORITY_CONTRACT = contract({
  productCode: "executive_reporting_priority",
  displayName: "Executive Reporting — Advanced",
  entitlementSlug: "executive-reporting-priority",
  stripePriceId: "price_1TXtNlQFpelVFMXJtn73BFTl",
  commercialStatus: "inactive",
  checkoutRoute: null,
  intakeRoute: null,
  successRoute: null,
  customerAccessRoute: null,
  adminRoute: null,
  fulfilmentType: "executive_report_artifact",
  artifactModel: "ExecutiveReportingRun",
  deliveryModel: "ai_generation_and_send",
  dashboardVisibility: false,
  caseStudyEligible: false,
  feedbackSurface: null,
  estateSpineSourceType: null,
  readinessStatus: "not_applicable",
  proofRunCompleted: false,
  hardFailures: [],
  warnings: [],
  notes: "Inactive — duplicate of executive_reporting at same price. Use executive_reporting as canonical. Shares same Stripe price ID.",
});

// ── Registry ──────────────────────────────────────────────────────────────────

/**
 * PRODUCT_FULFILMENT_CONTRACTS — canonical list of all products with contracts.
 *
 * Add a new entry here before enabling checkout for any new product.
 * The build gate (scripts/check-product-fulfilment-readiness.mjs) reads this list.
 */
export const PRODUCT_FULFILMENT_CONTRACTS: ProductFulfilmentContract[] = [
  // Human-reviewed
  BOARDROOM_BRIEF_CONTRACT,

  // Interactive instruments
  PERSONAL_DECISION_AUDIT_CONTRACT,
  DECISION_EXPOSURE_INSTRUMENT_CONTRACT,
  MANDATE_CLARITY_FRAMEWORK_CONTRACT,
  INTERVENTION_PATH_SELECTOR_CONTRACT,
  ESCALATION_READINESS_SCORECARD_CONTRACT,
  STRUCTURAL_FAILURE_DIAGNOSTIC_CANVAS_CONTRACT,
  EXECUTION_RISK_INDEX_CONTRACT,
  TEAM_ALIGNMENT_GAP_MAP_CONTRACT,
  GOVERNANCE_DRIFT_DETECTOR_CONTRACT,
  STRATEGIC_PRIORITY_STACK_BUILDER_CONTRACT,
  BOARD_BRIEF_BUILDER_CONTRACT,

  // Governed methodology runs
  EXECUTION_INTEGRITY_PROTOCOL_CONTRACT,
  ALIGNMENT_AUDIT_PLAYBOOK_CONTRACT,
  DRIFT_DETECTION_FRAMEWORK_CONTRACT,

  // Bundle
  OPERATOR_DECISION_PACK_CONTRACT,

  // Reporting + execution
  EXECUTIVE_REPORTING_CONTRACT,
  STRATEGY_ROOM_CONTRACT,
  STRATEGY_ROOM_EXTENDED_CONTRACT,

  // Free / corridor
  FAST_DIAGNOSTIC_CONTRACT,
  TEAM_ASSESSMENT_CONTRACT,
  ENTERPRISE_ASSESSMENT_CONTRACT,
  BOARDROOM_MODE_CONTRACT,
  CASE_DOSSIER_TARIFF_SHOCK_CONTRACT,
  CASE_DOSSIER_TEAM_ALIGNMENT_CONTRACT,
  CASE_DOSSIER_ESCALATION_DENIED_CONTRACT,

  // Professional subscriptions
  PROFESSIONAL_CONTRACT,
  PROFESSIONAL_ANNUAL_CONTRACT,

  // GMI intelligence reports
  GMI_Q1_2026_CONTRACT,
  GMI_Q2_2026_CONTRACT,
  GMI_Q3_2026_CONTRACT,

  // Contracted / inactive
  RETAINER_CORE_CONTRACT,
  RETAINER_OPERATIONAL_CONTRACT,
  RETAINER_INSTITUTIONAL_CONTRACT,

  // Enterprise + additional seat
  ENTERPRISE_CONTRACT,
  ADDITIONAL_COLLABORATOR_CONTRACT,

  // Inactive bundles
  OPERATOR_ESSENTIALS_PACK_CONTRACT,
  COMMAND_PACK_CONTRACT,
  GOVERNANCE_SUITE_CONTRACT,
  INNER_CIRCLE_CONTRACT,

  // Inactive reporting products
  DIAGNOSTIC_REPORT_BASIC_CONTRACT,
  DIAGNOSTIC_REPORT_PRO_CONTRACT,
  EXECUTIVE_REPORTING_PRIORITY_CONTRACT,
];

/** Quick lookup by productCode */
export function getContractByProductCode(
  code: string,
): ProductFulfilmentContract | undefined {
  return PRODUCT_FULFILMENT_CONTRACTS.find((c) => c.productCode === code);
}
