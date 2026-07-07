/**
 * lib/product/product-fulfilment-assurance.ts
 *
 * Phase 2 fulfilment assurance layer.
 *
 * Extends every product contract with operational governance fields:
 * - ProductDeliveryClass — canonical delivery model
 * - ProductDeliveryClassPolicy — automation level + required signals
 * - HumanReviewJustification — why human review is required (or not)
 * - QualityControls — visibility, intervention, safety flags
 * - RecoveryPolicy — stall detection + escalation rules
 *
 * This file is the assurance layer only. The base contract registry
 * lives in lib/product/product-fulfilment-contract.ts.
 *
 * HUMAN REVIEW DOCTRINE:
 * Human review must be justified. "We haven't automated it yet" is not
 * a justification. Automation should handle logistics; humans handle judgment.
 */

// ── Delivery Class ─────────────────────────────────────────────────────────────

export type ProductDeliveryClass =
  | "instant_digital_access"       // Payment → entitlement → tool/route immediately accessible
  | "generated_digital_artifact"   // Payment → generation triggered → artifact accessible on completion
  | "manual_review_required"       // Payment → order queued → human produces + delivers artifact
  | "scheduled_human_service"      // Payment → booking required → service delivered at scheduled time
  | "subscription_retainer_cycle"  // Payment → recurring access granted + maintained
  | "archived_digital_reference"   // Historical product; still purchasable; marked as archive
  | "inactive_not_sellable"        // Product not currently on sale; no delivery path required
  | "internal_only";               // Not customer-facing

export type AutomationLevel =
  | "fully_automated"              // No human touch required in the delivery path
  | "automation_with_review"       // System automates logistics; human reviews judgment layer
  | "manual_required"              // Delivery requires human action (justified)
  | "not_applicable";              // Not a sellable product

export type HumanReviewReason =
  | "bespoke_strategy_judgment"            // Product makes client-specific recommendations requiring human insight
  | "legal_or_reputational_risk"           // Delivery carries legal or reputational exposure
  | "client_specific_context_required"     // Context that cannot be inferred from intake data
  | "quality_assurance_before_release"     // Output must pass QA before reaching the customer
  | "enterprise_scope_confirmation"        // Scope must be agreed before work begins
  | "operator_intervention_required"       // System failure or edge case needs human recovery
  | "not_required";                        // No human review needed

// ── Sub-types ──────────────────────────────────────────────────────────────────

export type HumanReviewJustification = {
  required: boolean;
  reason: HumanReviewReason;
  canBeAutomatedLater: boolean;
  automationBlocker?: string;
  humanRole?: string;              // What specifically the human does
};

export type QualityControls = {
  requiresProofRun: boolean;
  proofRunStatus: "not_required" | "pending" | "passed" | "failed";
  customerExpectationClear: boolean;   // Does the customer know what they're getting + when?
  adminCanIntervene: boolean;          // Can an operator see + act on this product's state?
  failureVisibleToCustomer: boolean;   // Does the customer see a failure state?
  failureVisibleToAdmin: boolean;      // Does the admin see a failure state?
  duplicateOrderSafe: boolean;         // Is a duplicate purchase safe (idempotent)?
  refundOrRecoveryPathDefined: boolean; // Is there a defined refund or recovery path?
};

export type RecoveryPolicy = {
  stalledAfterHours?: number;          // Hours after which fulfilment is considered stalled
  escalateToAdmin: boolean;            // Should admin be alerted on stall?
  customerMessageOnFailure: boolean;   // Does the customer receive a message on failure?
  retrySupported: boolean;             // Can the delivery be retried without a new order?
  refundReviewRequired: boolean;       // Should a stall trigger refund review?
};

export type FulfilmentStatus =
  | "not_applicable"
  | "not_started"
  | "payment_confirmed"
  | "entitlement_created"
  | "awaiting_customer_input"
  | "awaiting_operator_review"
  | "in_progress"
  | "generated"
  | "delivered"
  | "failed"
  | "blocked"
  | "refunded"
  | "cancelled";

export type SubscriptionFulfilmentState =
  | "active"
  | "pending_onboarding"
  | "onboarding_completed"
  | "renewal_due"
  | "payment_failed"
  | "cancelled"
  | "requires_operator_review";

// ── Main assurance record type ─────────────────────────────────────────────────

export type ProductFulfilmentAssurance = {
  productCode: string;
  deliveryClass: ProductDeliveryClass;
  automationLevel: AutomationLevel;
  customerSignals: {
    immediateAfterPayment: string;   // What the customer sees right after payment
    onFulfilmentComplete: string;    // What the customer sees when fully delivered
    onFailure: string;               // What the customer sees on failure
    accessConfirmationExists: boolean;
    nextStepInstructionsExist: boolean;
  };
  adminSignals: {
    adminRoute: string | null;       // Where admin can see this product's orders
    visibleAfterPayment: boolean;    // Is the order visible in admin immediately after payment?
    statusUpdatesVisible: boolean;   // Can admin track status changes?
    failureVisibleToAdmin: boolean;
    canAdminRetrigger: boolean;      // Can admin retry failed delivery?
  };
  humanReviewJustification: HumanReviewJustification;
  qualityControls: QualityControls;
  recoveryPolicy: RecoveryPolicy;
  automationGaps: string[];          // Automation that could be built but hasn't been
  notes: string | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function assurance(a: ProductFulfilmentAssurance): ProductFulfilmentAssurance {
  return a;
}

// Default policy blocks per delivery class

const INSTANT_ACCESS_DEFAULTS: Omit<ProductFulfilmentAssurance, "productCode" | "automationGaps" | "notes"> = {
  deliveryClass: "instant_digital_access",
  automationLevel: "fully_automated",
  customerSignals: {
    immediateAfterPayment: "Entitlement granted — product access opens on page load",
    onFulfilmentComplete: "Tool accessible at instrument run route",
    onFailure: "⚠️ No explicit failure state shown to customer — relies on entitlement check returning false",
    accessConfirmationExists: true,
    nextStepInstructionsExist: true,
  },
  adminSignals: {
    adminRoute: "/admin/artifacts",
    visibleAfterPayment: false,
    statusUpdatesVisible: false,
    failureVisibleToAdmin: false,
    canAdminRetrigger: false,
  },
  humanReviewJustification: {
    required: false,
    reason: "not_required",
    canBeAutomatedLater: false,
  },
  qualityControls: {
    requiresProofRun: false,
    proofRunStatus: "not_required",
    customerExpectationClear: true,
    adminCanIntervene: false,
    failureVisibleToCustomer: false,
    failureVisibleToAdmin: false,
    duplicateOrderSafe: true,
    refundOrRecoveryPathDefined: false,
  },
  recoveryPolicy: {
    stalledAfterHours: 1,
    escalateToAdmin: false,
    customerMessageOnFailure: false,
    retrySupported: true,
    refundReviewRequired: false,
  },
};

const INACTIVE_DEFAULTS: Omit<ProductFulfilmentAssurance, "productCode" | "notes"> = {
  deliveryClass: "inactive_not_sellable",
  automationLevel: "not_applicable",
  customerSignals: {
    immediateAfterPayment: "N/A — product not on sale",
    onFulfilmentComplete: "N/A",
    onFailure: "N/A",
    accessConfirmationExists: false,
    nextStepInstructionsExist: false,
  },
  adminSignals: {
    adminRoute: null,
    visibleAfterPayment: false,
    statusUpdatesVisible: false,
    failureVisibleToAdmin: false,
    canAdminRetrigger: false,
  },
  humanReviewJustification: {
    required: false,
    reason: "not_required",
    canBeAutomatedLater: false,
  },
  qualityControls: {
    requiresProofRun: false,
    proofRunStatus: "not_required",
    customerExpectationClear: false,
    adminCanIntervene: false,
    failureVisibleToCustomer: false,
    failureVisibleToAdmin: false,
    duplicateOrderSafe: true,
    refundOrRecoveryPathDefined: false,
  },
  recoveryPolicy: {
    escalateToAdmin: false,
    customerMessageOnFailure: false,
    retrySupported: false,
    refundReviewRequired: false,
  },
  automationGaps: [],
};

// ── Assurance records ─────────────────────────────────────────────────────────

// ── boardroom_brief ───────────────────────────────────────────────────────────

export const BOARDROOM_BRIEF_ASSURANCE = assurance({
  productCode: "boardroom_brief",
  deliveryClass: "manual_review_required",
  automationLevel: "automation_with_review",
  customerSignals: {
    immediateAfterPayment: "Confirmation page at /boardroom-brief/confirmation — 'What happens next' section with email confirmation and SLA.",
    onFulfilmentComplete: "Customer notified via email when dossier is delivered. Access to dossier via entitlement-gated route.",
    onFailure: "No automated failure state shown. If 48h SLA breached, customer has no visibility — relies on manual outreach.",
    accessConfirmationExists: true,
    nextStepInstructionsExist: true,
  },
  adminSignals: {
    adminRoute: "/admin/boardroom/orders",
    visibleAfterPayment: true,
    statusUpdatesVisible: true,
    failureVisibleToAdmin: true,
    canAdminRetrigger: false,
  },
  humanReviewJustification: {
    required: true,
    reason: "bespoke_strategy_judgment",
    canBeAutomatedLater: false,
    automationBlocker: "Dossier is a bespoke strategic analysis requiring Abraham's judgment on the specific decision context. No AI generation can replace this.",
    humanRole: "Abraham reviews the intake, produces the dossier, attaches it, and marks status dossier_generated → delivered in /admin/boardroom/orders.",
  },
  qualityControls: {
    requiresProofRun: true,
    proofRunStatus: "pending",
    customerExpectationClear: true,
    adminCanIntervene: true,
    failureVisibleToCustomer: false,
    failureVisibleToAdmin: true,
    duplicateOrderSafe: true,
    refundOrRecoveryPathDefined: false,
  },
  recoveryPolicy: {
    stalledAfterHours: 48,
    escalateToAdmin: true,
    customerMessageOnFailure: false,
    retrySupported: false,
    refundReviewRequired: true,
  },
  automationGaps: [
    "SLA breach alert: no automated notification to admin when order exceeds 48h without status change",
    "Customer SLA notification: customer receives no automated reminder or update after 24h without delivery",
    "Dossier delivery: manual attachment required — could be automated with PDF upload + entitlement grant",
    "Failure signal to customer: no automated 'overdue' or 'issue' message to customer",
  ],
  notes: "Most critical product. One live order in queue. Must complete proof run before sellable flip.",
});

// ── Interactive instruments (shared pattern) ──────────────────────────────────

const INSTRUMENT_AUTOMATION_GAPS = [
  "No post-delivery email confirmation to customer",
  "No feedback surface for post-delivery NPS or quality signal",
  "Admin access log not surfaced in any admin view — operator cannot verify delivery on request",
];

export const PERSONAL_DECISION_AUDIT_ASSURANCE = assurance({
  ...INSTANT_ACCESS_DEFAULTS,
  productCode: "personal_decision_audit",
  automationGaps: INSTRUMENT_AUTOMATION_GAPS,
  notes: "Entitlement gates /diagnostics/purpose-alignment. Delivery is immediate.",
});

export const DECISION_EXPOSURE_INSTRUMENT_ASSURANCE = assurance({ ...INSTANT_ACCESS_DEFAULTS, productCode: "decision_exposure_instrument", automationGaps: INSTRUMENT_AUTOMATION_GAPS, notes: null });
export const MANDATE_CLARITY_FRAMEWORK_ASSURANCE = assurance({ ...INSTANT_ACCESS_DEFAULTS, productCode: "mandate_clarity_framework", automationGaps: INSTRUMENT_AUTOMATION_GAPS, notes: null });
export const INTERVENTION_PATH_SELECTOR_ASSURANCE = assurance({ ...INSTANT_ACCESS_DEFAULTS, productCode: "intervention_path_selector", automationGaps: INSTRUMENT_AUTOMATION_GAPS, notes: null });
export const ESCALATION_READINESS_SCORECARD_ASSURANCE = assurance({ ...INSTANT_ACCESS_DEFAULTS, productCode: "escalation_readiness_scorecard", automationGaps: INSTRUMENT_AUTOMATION_GAPS, notes: null });
export const STRUCTURAL_FAILURE_DIAGNOSTIC_CANVAS_ASSURANCE = assurance({ ...INSTANT_ACCESS_DEFAULTS, productCode: "structural_failure_diagnostic_canvas", automationGaps: INSTRUMENT_AUTOMATION_GAPS, notes: null });
export const EXECUTION_RISK_INDEX_ASSURANCE = assurance({ ...INSTANT_ACCESS_DEFAULTS, productCode: "execution_risk_index", automationGaps: INSTRUMENT_AUTOMATION_GAPS, notes: null });
export const TEAM_ALIGNMENT_GAP_MAP_ASSURANCE = assurance({ ...INSTANT_ACCESS_DEFAULTS, productCode: "team_alignment_gap_map", automationGaps: INSTRUMENT_AUTOMATION_GAPS, notes: null });
export const GOVERNANCE_DRIFT_DETECTOR_ASSURANCE = assurance({ ...INSTANT_ACCESS_DEFAULTS, productCode: "governance_drift_detector", automationGaps: INSTRUMENT_AUTOMATION_GAPS, notes: null });
export const STRATEGIC_PRIORITY_STACK_BUILDER_ASSURANCE = assurance({ ...INSTANT_ACCESS_DEFAULTS, productCode: "strategic_priority_stack_builder", automationGaps: INSTRUMENT_AUTOMATION_GAPS, notes: null });
export const BOARD_BRIEF_BUILDER_ASSURANCE = assurance({ ...INSTANT_ACCESS_DEFAULTS, productCode: "board_brief_builder", automationGaps: INSTRUMENT_AUTOMATION_GAPS, notes: null });

// ── Governed methodology runs ─────────────────────────────────────────────────

export const EXECUTION_INTEGRITY_PROTOCOL_ASSURANCE = assurance({ ...INSTANT_ACCESS_DEFAULTS, productCode: "execution_integrity_protocol", automationGaps: INSTRUMENT_AUTOMATION_GAPS, notes: "Governed methodology run — entitlement gates /playbooks/execution-integrity-protocol/run." });
export const ALIGNMENT_AUDIT_PLAYBOOK_ASSURANCE = assurance({ ...INSTANT_ACCESS_DEFAULTS, productCode: "alignment_audit_playbook", automationGaps: INSTRUMENT_AUTOMATION_GAPS, notes: null });
export const DRIFT_DETECTION_FRAMEWORK_ASSURANCE = assurance({ ...INSTANT_ACCESS_DEFAULTS, productCode: "drift_detection_framework", automationGaps: INSTRUMENT_AUTOMATION_GAPS, notes: null });

// ── Bundles ───────────────────────────────────────────────────────────────────

export const OPERATOR_DECISION_PACK_ASSURANCE = assurance({
  productCode: "operator_decision_pack",
  deliveryClass: "instant_digital_access",
  automationLevel: "fully_automated",
  customerSignals: {
    immediateAfterPayment: "Bundle entitlement granted — access to 3 instruments should open immediately.",
    onFulfilmentComplete: "All 3 instruments accessible: Decision Exposure, Mandate Clarity, Intervention Path Selector.",
    onFailure: "No explicit failure state if only some entitlements grant. Customer may access some but not all instruments.",
    accessConfirmationExists: true,
    nextStepInstructionsExist: true,
  },
  adminSignals: {
    adminRoute: "/admin/billing",
    visibleAfterPayment: false,
    statusUpdatesVisible: false,
    failureVisibleToAdmin: false,
    canAdminRetrigger: false,
  },
  humanReviewJustification: {
    required: false,
    reason: "not_required",
    canBeAutomatedLater: false,
  },
  qualityControls: {
    requiresProofRun: true,
    proofRunStatus: "pending",
    customerExpectationClear: true,
    adminCanIntervene: false,
    failureVisibleToCustomer: false,
    failureVisibleToAdmin: false,
    duplicateOrderSafe: true,
    refundOrRecoveryPathDefined: false,
  },
  recoveryPolicy: {
    stalledAfterHours: 1,
    escalateToAdmin: false,
    customerMessageOnFailure: false,
    retrySupported: true,
    refundReviewRequired: false,
  },
  automationGaps: [
    "Partial grant detection: if only 1 of 3 entitlements grants, no alert fires",
    "Bundle delivery confirmation email missing",
    "Admin has no view of which bundle entitlements were granted vs missed",
  ],
  notes: "Proof run required to confirm all 3 constituent products grant on single payment.",
});

export const OPERATOR_ESSENTIALS_PACK_ASSURANCE = assurance({ ...INACTIVE_DEFAULTS, productCode: "operator_essentials_pack", notes: "Inactive." });
export const COMMAND_PACK_ASSURANCE = assurance({ ...INACTIVE_DEFAULTS, productCode: "command_pack", notes: "Inactive." });
export const GOVERNANCE_SUITE_ASSURANCE = assurance({ ...INACTIVE_DEFAULTS, productCode: "governance_suite", notes: "Inactive." });

// ── Executive Reporting ───────────────────────────────────────────────────────

export const EXECUTIVE_REPORTING_ASSURANCE = assurance({
  productCode: "executive_reporting",
  deliveryClass: "generated_digital_artifact",
  automationLevel: "automation_with_review",
  customerSignals: {
    immediateAfterPayment: "Entitlement grants access to /diagnostics/executive-reporting/run. Customer sees generation state (pending/generating/complete).",
    onFulfilmentComplete: "Report accessible at /diagnostics/executive-reporting/run. No delivery email confirmed.",
    onFailure: "⚠️ Failed generation state is not confirmed as visible to customer. May show blank or stale state.",
    accessConfirmationExists: true,
    nextStepInstructionsExist: false,
  },
  adminSignals: {
    adminRoute: "/admin/reporting/executive",
    visibleAfterPayment: true,
    statusUpdatesVisible: true,
    failureVisibleToAdmin: false,
    canAdminRetrigger: false,
  },
  humanReviewJustification: {
    required: false,
    reason: "quality_assurance_before_release",
    canBeAutomatedLater: true,
    automationBlocker: "QA review of AI-generated content before customer delivery is desirable but not structurally required.",
    humanRole: "Operator can review report in /admin/reporting/executive before flagging as reviewed.",
  },
  qualityControls: {
    requiresProofRun: true,
    proofRunStatus: "pending",
    customerExpectationClear: false,
    adminCanIntervene: true,
    failureVisibleToCustomer: false,
    failureVisibleToAdmin: false,
    duplicateOrderSafe: true,
    refundOrRecoveryPathDefined: false,
  },
  recoveryPolicy: {
    stalledAfterHours: 2,
    escalateToAdmin: true,
    customerMessageOnFailure: false,
    retrySupported: false,
    refundReviewRequired: true,
  },
  automationGaps: [
    "Failed generation state not visible to customer — must show 'Report generation failed. Our team has been notified.'",
    "No admin alert on generation failure",
    "No retry mechanism for failed generation runs",
    "No post-delivery email to customer with report link",
    "Admin cannot retrigger generation from /admin/reporting/executive",
  ],
  notes: "ExecutiveReportingRun model exists. AI generation pipeline needs end-to-end proof run.",
});

// ── Strategy Room ─────────────────────────────────────────────────────────────
// Strategy Room is instant_digital_access (entitlement unlocks the execution tool immediately).
// The human counsel element (CounselStatusPanel) is supplementary, not the primary delivery.
// Risk is lower than classified in Phase 1 — customer is NOT stranded after payment.

export const STRATEGY_ROOM_ASSURANCE = assurance({
  productCode: "strategy_room",
  deliveryClass: "instant_digital_access",
  automationLevel: "automation_with_review",
  customerSignals: {
    immediateAfterPayment: "Entitlement grants access to /strategy-room (execution chamber). Cookie-based access smoothing also active.",
    onFulfilmentComplete: "Strategy Room execution chamber opens. Customer can run strategies and access counsel status.",
    onFailure: "No explicit failure state. If entitlement fails, customer sees gate (locked state) with no explanation.",
    accessConfirmationExists: true,
    nextStepInstructionsExist: false,
  },
  adminSignals: {
    adminRoute: "/admin/operations",
    visibleAfterPayment: false,
    statusUpdatesVisible: false,
    failureVisibleToAdmin: false,
    canAdminRetrigger: false,
  },
  humanReviewJustification: {
    required: true,
    reason: "bespoke_strategy_judgment",
    canBeAutomatedLater: false,
    automationBlocker: "Counsel review component requires Abraham's strategic judgment. Cannot be automated.",
    humanRole: "Abraham reviews counsel trigger, provides strategic direction through CounselStatusPanel.",
  },
  qualityControls: {
    requiresProofRun: true,
    proofRunStatus: "pending",
    customerExpectationClear: false,
    adminCanIntervene: false,
    failureVisibleToCustomer: false,
    failureVisibleToAdmin: false,
    duplicateOrderSafe: true,
    refundOrRecoveryPathDefined: false,
  },
  recoveryPolicy: {
    stalledAfterHours: 24,
    escalateToAdmin: true,
    customerMessageOnFailure: false,
    retrySupported: true,
    refundReviewRequired: true,
  },
  automationGaps: [
    "No post-purchase orientation email explaining the Strategy Room execution chamber",
    "Locked state (entitlement failure) shows no explanation to customer",
    "Counsel status changes are not notified to customer",
    "No admin queue for Strategy Room entrants — operator cannot see who has paid and is active",
    "Stalled counsel (customer waiting for review) has no escalation trigger",
  ],
  notes: "Reclassified: instant_digital_access not scheduled_session. Tool access is immediate on payment. Human counsel is supplementary.",
});

export const STRATEGY_ROOM_EXTENDED_ASSURANCE = assurance({
  ...STRATEGY_ROOM_ASSURANCE,
  productCode: "strategy_room_extended",
  notes: "Same delivery model as strategy_room. Extended multi-decision variant.",
});

// ── Professional Subscriptions ────────────────────────────────────────────────

export const PROFESSIONAL_ASSURANCE = assurance({
  productCode: "professional",
  deliveryClass: "subscription_retainer_cycle",
  automationLevel: "automation_with_review",
  customerSignals: {
    immediateAfterPayment: "Subscription entitlement granted. Customer lands at /decision-centre with Professional tier access active.",
    onFulfilmentComplete: "Decision Centre accessible with full Professional features (unlimited cases, Return Brief, client-safe export).",
    onFailure: "If subscription lapses or payment fails, customer loses access at next gate check. No proactive notification confirmed.",
    accessConfirmationExists: true,
    nextStepInstructionsExist: false,
  },
  adminSignals: {
    adminRoute: "/admin/billing",
    visibleAfterPayment: false,
    statusUpdatesVisible: false,
    failureVisibleToAdmin: false,
    canAdminRetrigger: false,
  },
  humanReviewJustification: {
    required: false,
    reason: "not_required",
    canBeAutomatedLater: false,
  },
  qualityControls: {
    requiresProofRun: true,
    proofRunStatus: "pending",
    customerExpectationClear: true,
    adminCanIntervene: false,
    failureVisibleToCustomer: false,
    failureVisibleToAdmin: false,
    duplicateOrderSafe: false,
    refundOrRecoveryPathDefined: false,
  },
  recoveryPolicy: {
    stalledAfterHours: 72,
    escalateToAdmin: false,
    customerMessageOnFailure: false,
    retrySupported: false,
    refundReviewRequired: false,
  },
  automationGaps: [
    "No subscription admin queue: operator cannot see active subscribers at a glance",
    "Payment failure (customer.subscription.updated with status: past_due) not surfaced in admin",
    "Cancellation (customer.subscription.deleted) not surfaced in admin",
    "No onboarding email to new Professional subscribers explaining what is now unlocked",
    "No renewal reminder to customer before billing cycle",
    "No admin alert when subscriber count changes significantly",
  ],
  notes: "Live paid subscription. Priority 2 proof run. Webhook handles entitlement but subscriber lifecycle is invisible to admin.",
});

export const PROFESSIONAL_ANNUAL_ASSURANCE = assurance({
  ...PROFESSIONAL_ASSURANCE,
  productCode: "professional_annual",
  notes: "Annual variant. Shares entitlementSlug tier.professional with monthly. Annual renewal verification required.",
});

// ── GMI Reports ───────────────────────────────────────────────────────────────

export const GMI_Q1_2026_ASSURANCE = assurance({
  productCode: "gmi_q1_2026",
  deliveryClass: "archived_digital_reference",
  automationLevel: "fully_automated",
  customerSignals: {
    immediateAfterPayment: "Entitlement granted. Customer redirected to /artifacts/global-market-intelligence-report-q1-2026.",
    onFulfilmentComplete: "Report accessible at artifact route. Customer can read Q1 2026 content.",
    onFailure: "No failure state shown if entitlement fails. Gate simply blocks access.",
    accessConfirmationExists: true,
    nextStepInstructionsExist: false,
  },
  adminSignals: {
    adminRoute: "/admin/intelligence/gmi-control-plane",
    visibleAfterPayment: false,
    statusUpdatesVisible: false,
    failureVisibleToAdmin: false,
    canAdminRetrigger: false,
  },
  humanReviewJustification: {
    required: false,
    reason: "not_required",
    canBeAutomatedLater: false,
  },
  qualityControls: {
    requiresProofRun: true,
    proofRunStatus: "pending",
    customerExpectationClear: false,
    adminCanIntervene: false,
    failureVisibleToCustomer: false,
    failureVisibleToAdmin: false,
    duplicateOrderSafe: true,
    refundOrRecoveryPathDefined: false,
  },
  recoveryPolicy: {
    stalledAfterHours: 1,
    escalateToAdmin: false,
    customerMessageOnFailure: false,
    retrySupported: true,
    refundReviewRequired: false,
  },
  automationGaps: [
    "No archive warning on product page: customer must know this is Q1 2026, not current",
    "No post-purchase email with access link",
    "No 'this is archived' banner on the artifact route itself",
  ],
  notes: "Archived edition. Still purchasable. REQUIRED: archive warning must be explicit on both the checkout entry and the artifact page.",
});

export const GMI_Q2_2026_ASSURANCE = assurance({
  productCode: "gmi_q2_2026",
  deliveryClass: "inactive_not_sellable",
  automationLevel: "not_applicable",
  customerSignals: {
    immediateAfterPayment: "N/A — manual_billing, no self-serve checkout",
    onFulfilmentComplete: "Manual: access granted by operator after billing confirmed",
    onFailure: "N/A",
    accessConfirmationExists: false,
    nextStepInstructionsExist: false,
  },
  adminSignals: {
    adminRoute: "/admin/intelligence/gmi-control-plane",
    visibleAfterPayment: false,
    statusUpdatesVisible: false,
    failureVisibleToAdmin: false,
    canAdminRetrigger: false,
  },
  humanReviewJustification: { required: false, reason: "not_required", canBeAutomatedLater: true, automationBlocker: "Requires Stripe IDs to be added to GMI registry before self-serve checkout can be enabled." },
  qualityControls: { requiresProofRun: false, proofRunStatus: "not_required", customerExpectationClear: false, adminCanIntervene: true, failureVisibleToCustomer: false, failureVisibleToAdmin: false, duplicateOrderSafe: true, refundOrRecoveryPathDefined: false },
  recoveryPolicy: { escalateToAdmin: false, customerMessageOnFailure: false, retrySupported: false, refundReviewRequired: false },
  automationGaps: ["Self-serve checkout not enabled — requires Stripe IDs in gmi-edition-registry.ts"],
  notes: "Current edition. manual_billing — no checkout until Stripe IDs added.",
});

export const GMI_Q3_2026_ASSURANCE = assurance({ ...INACTIVE_DEFAULTS, productCode: "gmi_q3_2026", notes: "Draft — not released." });

// ── Free / corridor ───────────────────────────────────────────────────────────

const FREE_ASSET_DEFAULTS: Omit<ProductFulfilmentAssurance, "productCode" | "notes"> = {
  deliveryClass: "instant_digital_access",
  automationLevel: "fully_automated",
  customerSignals: {
    immediateAfterPayment: "N/A — free product. No payment required.",
    onFulfilmentComplete: "Route immediately accessible.",
    onFailure: "N/A",
    accessConfirmationExists: false,
    nextStepInstructionsExist: false,
  },
  adminSignals: {
    adminRoute: null,
    visibleAfterPayment: false,
    statusUpdatesVisible: false,
    failureVisibleToAdmin: false,
    canAdminRetrigger: false,
  },
  humanReviewJustification: { required: false, reason: "not_required", canBeAutomatedLater: false },
  qualityControls: { requiresProofRun: false, proofRunStatus: "not_required", customerExpectationClear: true, adminCanIntervene: false, failureVisibleToCustomer: false, failureVisibleToAdmin: false, duplicateOrderSafe: true, refundOrRecoveryPathDefined: false },
  recoveryPolicy: { escalateToAdmin: false, customerMessageOnFailure: false, retrySupported: true, refundReviewRequired: false },
  automationGaps: [],
};

export const FAST_DIAGNOSTIC_ASSURANCE = assurance({ ...FREE_ASSET_DEFAULTS, productCode: "fast_diagnostic", notes: "Free entry diagnostic. No fulfilment risk." });
export const TEAM_ASSESSMENT_ASSURANCE = assurance({ ...FREE_ASSET_DEFAULTS, productCode: "team_assessment", notes: null });
export const ENTERPRISE_ASSESSMENT_ASSURANCE = assurance({ ...FREE_ASSET_DEFAULTS, productCode: "enterprise_assessment", notes: null });
export const BOARDROOM_MODE_ASSURANCE = assurance({ ...FREE_ASSET_DEFAULTS, productCode: "boardroom_mode", notes: "Evidence-gated. No payment." });
export const CASE_DOSSIER_TARIFF_SHOCK_ASSURANCE = assurance({ ...FREE_ASSET_DEFAULTS, productCode: "case_dossier_tariff_shock", notes: null });
export const CASE_DOSSIER_TEAM_ALIGNMENT_ASSURANCE = assurance({ ...FREE_ASSET_DEFAULTS, productCode: "case_dossier_team_alignment", notes: null });
export const CASE_DOSSIER_ESCALATION_DENIED_ASSURANCE = assurance({ ...FREE_ASSET_DEFAULTS, productCode: "case_dossier_escalation_denied", notes: null });

// ── Contracted / inactive ─────────────────────────────────────────────────────

export const RETAINER_CORE_ASSURANCE = assurance({ ...INACTIVE_DEFAULTS, productCode: "retainer_core", notes: "Contracted — no self-serve checkout." });
export const RETAINER_OPERATIONAL_ASSURANCE = assurance({ ...INACTIVE_DEFAULTS, productCode: "retainer_operational", notes: "Contracted." });
export const RETAINER_INSTITUTIONAL_ASSURANCE = assurance({ ...INACTIVE_DEFAULTS, productCode: "retainer_institutional", notes: "Contracted." });
export const ENTERPRISE_ASSURANCE = assurance({ ...INACTIVE_DEFAULTS, productCode: "enterprise", notes: "Custom contracted. Manual provisioning." });
export const ADDITIONAL_COLLABORATOR_ASSURANCE = assurance({ ...INACTIVE_DEFAULTS, productCode: "additional_collaborator", notes: "Manual billing. No self-serve." });
export const INNER_CIRCLE_ASSURANCE = assurance({ ...INACTIVE_DEFAULTS, productCode: "inner_circle", notes: "Inactive." });
export const DIAGNOSTIC_REPORT_BASIC_ASSURANCE = assurance({ ...INACTIVE_DEFAULTS, productCode: "diagnostic_report_basic", notes: "Inactive — superseded by executive_reporting." });
export const DIAGNOSTIC_REPORT_PRO_ASSURANCE = assurance({ ...INACTIVE_DEFAULTS, productCode: "diagnostic_report_pro", notes: "Inactive." });
export const EXECUTIVE_REPORTING_PRIORITY_ASSURANCE = assurance({ ...INACTIVE_DEFAULTS, productCode: "executive_reporting_priority", notes: "Inactive — duplicate of executive_reporting." });

// ── Constructed manual fulfilment families ───────────────────────────────────

export const REPORTING_MONTHLY_ASSURANCE = assurance({
  productCode: "reporting_monthly",
  deliveryClass: "manual_review_required",
  automationLevel: "automation_with_review",
  customerSignals: {
    immediateAfterPayment: "Manual billing only — no self-serve checkout. Client cycle is created after scope/account confirmation.",
    onFulfilmentComplete: "Monthly report delivery proof is persisted for the exact cycle and archived before the next cycle starts.",
    onFailure: "Generation, validation, review, and delivery failures remain operator-visible and recoverable before delivery is claimed.",
    accessConfirmationExists: true,
    nextStepInstructionsExist: true,
  },
  adminSignals: {
    adminRoute: "/admin/reporting/monthly",
    visibleAfterPayment: true,
    statusUpdatesVisible: true,
    failureVisibleToAdmin: true,
    canAdminRetrigger: true,
  },
  humanReviewJustification: {
    required: true,
    reason: "quality_assurance_before_release",
    canBeAutomatedLater: false,
    humanRole: "Operator validates monthly output, performs human review, approves delivery, and archives the cycle proof.",
  },
  qualityControls: {
    requiresProofRun: false,
    proofRunStatus: "passed",
    customerExpectationClear: true,
    adminCanIntervene: true,
    failureVisibleToCustomer: false,
    failureVisibleToAdmin: true,
    duplicateOrderSafe: true,
    refundOrRecoveryPathDefined: true,
  },
  recoveryPolicy: {
    stalledAfterHours: 24,
    escalateToAdmin: true,
    customerMessageOnFailure: false,
    retrySupported: true,
    refundReviewRequired: true,
  },
  automationGaps: [],
  notes: "Manual-billing recurring fulfilment. not_applicable in the contract is limited to self-serve checkout readiness, not fulfilment obligation.",
});

export const REPORTING_CUSTOM_ASSURANCE = assurance({
  productCode: "reporting_custom",
  deliveryClass: "manual_review_required",
  automationLevel: "automation_with_review",
  customerSignals: {
    immediateAfterPayment: "Manual billing and qualification only — no self-serve checkout. Engagement starts after accepted brief and scope lock.",
    onFulfilmentComplete: "Final delivery proof is bound to engagement ID, accepted brief ID, scope version, output ID, output hash, approval state, channel, and timestamp.",
    onFailure: "Scope, validation, approval, and delivery failures block delivery authority until recovered or amended.",
    accessConfirmationExists: true,
    nextStepInstructionsExist: true,
  },
  adminSignals: {
    adminRoute: "/admin/reporting/custom",
    visibleAfterPayment: true,
    statusUpdatesVisible: true,
    failureVisibleToAdmin: true,
    canAdminRetrigger: true,
  },
  humanReviewJustification: {
    required: true,
    reason: "client_specific_context_required",
    canBeAutomatedLater: false,
    humanRole: "Operator qualifies the inquiry, locks scope, validates output against the accepted brief, manages revisions, and approves final delivery.",
  },
  qualityControls: {
    requiresProofRun: false,
    proofRunStatus: "passed",
    customerExpectationClear: true,
    adminCanIntervene: true,
    failureVisibleToCustomer: false,
    failureVisibleToAdmin: true,
    duplicateOrderSafe: true,
    refundOrRecoveryPathDefined: true,
  },
  recoveryPolicy: {
    stalledAfterHours: 24,
    escalateToAdmin: true,
    customerMessageOnFailure: false,
    retrySupported: true,
    refundReviewRequired: true,
  },
  automationGaps: [],
  notes: "Bespoke engagement fulfilment with scope-versioned validation, approval, revision, amendment, and delivery proof controls.",
});

export const GMI_QUARTERLY_ASSURANCE = assurance({
  productCode: "gmi_quarterly",
  deliveryClass: "manual_review_required",
  automationLevel: "automation_with_review",
  customerSignals: {
    immediateAfterPayment: "No self-serve checkout. Recipient access is only granted after edition-specific release eligibility and owner authority.",
    onFulfilmentComplete: "Edition-specific access/delivery proof is persisted and bound to artifact hash and recipient.",
    onFailure: "Draft, pre-data-lock, unresolved source blocker, missing prior-call review, missing human review, missing owner authority, or artifact-hash drift denies progression.",
    accessConfirmationExists: true,
    nextStepInstructionsExist: true,
  },
  adminSignals: {
    adminRoute: "/admin/intelligence/gmi-control-plane",
    visibleAfterPayment: true,
    statusUpdatesVisible: true,
    failureVisibleToAdmin: true,
    canAdminRetrigger: true,
  },
  humanReviewJustification: {
    required: true,
    reason: "quality_assurance_before_release",
    canBeAutomatedLater: false,
    humanRole: "Editorial reviewer and owner approve edition-specific release only after source blockers, prior calls, data lock, and artifact hash are cleared.",
  },
  qualityControls: {
    requiresProofRun: false,
    proofRunStatus: "passed",
    customerExpectationClear: true,
    adminCanIntervene: true,
    failureVisibleToCustomer: false,
    failureVisibleToAdmin: true,
    duplicateOrderSafe: true,
    refundOrRecoveryPathDefined: true,
  },
  recoveryPolicy: {
    stalledAfterHours: 24,
    escalateToAdmin: true,
    customerMessageOnFailure: false,
    retrySupported: true,
    refundReviewRequired: false,
  },
  automationGaps: [],
  notes: "Permanent controlled-release family; publication authority never infers checkout activation or Stripe identity.",
});
// ── Registry ──────────────────────────────────────────────────────────────────

export const PRODUCT_FULFILMENT_ASSURANCE_REGISTRY: ProductFulfilmentAssurance[] = [
  BOARDROOM_BRIEF_ASSURANCE,
  PERSONAL_DECISION_AUDIT_ASSURANCE,
  DECISION_EXPOSURE_INSTRUMENT_ASSURANCE,
  MANDATE_CLARITY_FRAMEWORK_ASSURANCE,
  INTERVENTION_PATH_SELECTOR_ASSURANCE,
  ESCALATION_READINESS_SCORECARD_ASSURANCE,
  STRUCTURAL_FAILURE_DIAGNOSTIC_CANVAS_ASSURANCE,
  EXECUTION_RISK_INDEX_ASSURANCE,
  TEAM_ALIGNMENT_GAP_MAP_ASSURANCE,
  GOVERNANCE_DRIFT_DETECTOR_ASSURANCE,
  STRATEGIC_PRIORITY_STACK_BUILDER_ASSURANCE,
  BOARD_BRIEF_BUILDER_ASSURANCE,
  EXECUTION_INTEGRITY_PROTOCOL_ASSURANCE,
  ALIGNMENT_AUDIT_PLAYBOOK_ASSURANCE,
  DRIFT_DETECTION_FRAMEWORK_ASSURANCE,
  OPERATOR_DECISION_PACK_ASSURANCE,
  OPERATOR_ESSENTIALS_PACK_ASSURANCE,
  COMMAND_PACK_ASSURANCE,
  GOVERNANCE_SUITE_ASSURANCE,
  EXECUTIVE_REPORTING_ASSURANCE,
  STRATEGY_ROOM_ASSURANCE,
  STRATEGY_ROOM_EXTENDED_ASSURANCE,
  PROFESSIONAL_ASSURANCE,
  PROFESSIONAL_ANNUAL_ASSURANCE,
  GMI_Q1_2026_ASSURANCE,
  GMI_Q2_2026_ASSURANCE,
  GMI_QUARTERLY_ASSURANCE,
  GMI_Q3_2026_ASSURANCE,
  REPORTING_MONTHLY_ASSURANCE,
  REPORTING_CUSTOM_ASSURANCE,
  FAST_DIAGNOSTIC_ASSURANCE,
  TEAM_ASSESSMENT_ASSURANCE,
  ENTERPRISE_ASSESSMENT_ASSURANCE,
  BOARDROOM_MODE_ASSURANCE,
  CASE_DOSSIER_TARIFF_SHOCK_ASSURANCE,
  CASE_DOSSIER_TEAM_ALIGNMENT_ASSURANCE,
  CASE_DOSSIER_ESCALATION_DENIED_ASSURANCE,
  RETAINER_CORE_ASSURANCE,
  RETAINER_OPERATIONAL_ASSURANCE,
  RETAINER_INSTITUTIONAL_ASSURANCE,
  ENTERPRISE_ASSURANCE,
  ADDITIONAL_COLLABORATOR_ASSURANCE,
  INNER_CIRCLE_ASSURANCE,
  DIAGNOSTIC_REPORT_BASIC_ASSURANCE,
  DIAGNOSTIC_REPORT_PRO_ASSURANCE,
  EXECUTIVE_REPORTING_PRIORITY_ASSURANCE,
];

/** Quick lookup by productCode */
export function getAssuranceByProductCode(
  code: string,
): ProductFulfilmentAssurance | undefined {
  return PRODUCT_FULFILMENT_ASSURANCE_REGISTRY.find((a) => a.productCode === code);
}
