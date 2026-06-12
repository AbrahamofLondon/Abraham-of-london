/**
 * lib/product/universal-fulfilment-state.ts
 *
 * Universal Fulfilment State Spine.
 *
 * Every product's delivery state maps to this canonical spine.
 * No product may claim a fulfilment state that does not exist in this spine.
 * No transition may occur without passing the evidence gate.
 *
 * This is the single source of truth for what "fulfilled" means across the estate.
 */

// ─── Universal Fulfilment States ──────────────────────────────────────────────

export type UniversalFulfilmentState =
  | "payment_confirmed"
  | "entitlement_created"
  | "intake_required"
  | "intake_received"
  | "internal_records_created"
  | "draft_created"
  | "admin_preview_ready"
  | "awaiting_operator_review"
  | "approved_for_delivery"
  | "customer_access_created"
  | "customer_notified"
  | "delivered"
  | "blocked"
  | "failed"
  | "refunded"
  | "cancelled";

// ─── Delivery Classes ─────────────────────────────────────────────────────────

export type DeliveryClass =
  | "instant_digital_access"
  | "generated_digital_artifact"
  | "manual_review_required"
  | "scheduled_human_service"
  | "subscription_retainer_cycle"
  | "archived_digital_reference"
  | "bundle_grant"
  | "inactive_not_sellable"
  | "internal_only";

// ─── State Labels ─────────────────────────────────────────────────────────────

export const UNIVERSAL_FULFILMENT_STATE_LABELS: Record<UniversalFulfilmentState, string> = {
  payment_confirmed: "Payment confirmed",
  entitlement_created: "Entitlement created",
  intake_required: "Intake required",
  intake_received: "Intake received",
  internal_records_created: "Internal records created",
  draft_created: "Draft created",
  admin_preview_ready: "Admin preview ready",
  awaiting_operator_review: "Awaiting operator review",
  approved_for_delivery: "Approved for delivery",
  customer_access_created: "Customer access created",
  customer_notified: "Customer notified",
  delivered: "Delivered",
  blocked: "Blocked",
  failed: "Failed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

export const UNIVERSAL_FULFILMENT_STATE_COLORS: Record<UniversalFulfilmentState, string> = {
  payment_confirmed: "#60a5fa",
  entitlement_created: "#60a5fa",
  intake_required: "#fbbf24",
  intake_received: "#fbbf24",
  internal_records_created: "#818cf8",
  draft_created: "#c9a96e",
  admin_preview_ready: "#c9a96e",
  awaiting_operator_review: "#fbbf24",
  approved_for_delivery: "#4ade80",
  customer_access_created: "#4ade80",
  customer_notified: "#4ade80",
  delivered: "#4ade80",
  blocked: "#ef4444",
  failed: "#ef4444",
  refunded: "#f87171",
  cancelled: "#6b7280",
};

// ─── Terminal States ──────────────────────────────────────────────────────────

export const TERMINAL_FULFILMENT_STATES: UniversalFulfilmentState[] = [
  "delivered",
  "blocked",
  "failed",
  "refunded",
  "cancelled",
];

export function isTerminalState(state: UniversalFulfilmentState): boolean {
  return TERMINAL_FULFILMENT_STATES.includes(state);
}

// ─── Product-State Mapping ────────────────────────────────────────────────────

export interface ProductFulfilmentStateMap {
  productCode: string;
  deliveryClass: DeliveryClass;
  /** All states this product MUST pass through (in order) */
  requiredStates: UniversalFulfilmentState[];
  /** States this product may skip (e.g., instant access skips draft/review) */
  skippableStates: UniversalFulfilmentState[];
  /** States from which no further transitions are allowed */
  terminalStates: UniversalFulfilmentState[];
}

// ─── Default Mappings by Delivery Class ───────────────────────────────────────

export const INSTANT_ACCESS_STATE_MAP: Omit<ProductFulfilmentStateMap, "productCode"> = {
  deliveryClass: "instant_digital_access",
  requiredStates: [
    "payment_confirmed",
    "entitlement_created",
    "customer_access_created",
    "delivered",
  ],
  skippableStates: [
    "intake_required",
    "intake_received",
    "internal_records_created",
    "draft_created",
    "admin_preview_ready",
    "awaiting_operator_review",
    "approved_for_delivery",
    "customer_notified",
  ],
  terminalStates: ["delivered", "blocked", "failed", "refunded", "cancelled"],
};

export const GENERATED_ARTIFACT_STATE_MAP: Omit<ProductFulfilmentStateMap, "productCode"> = {
  deliveryClass: "generated_digital_artifact",
  requiredStates: [
    "payment_confirmed",
    "entitlement_created",
    "internal_records_created",
    "draft_created",
    "admin_preview_ready",
    "customer_access_created",
    "delivered",
  ],
  skippableStates: [
    "intake_required",
    "intake_received",
    "awaiting_operator_review",
    "approved_for_delivery",
    "customer_notified",
  ],
  terminalStates: ["delivered", "blocked", "failed", "refunded", "cancelled"],
};

export const MANUAL_REVIEW_STATE_MAP: Omit<ProductFulfilmentStateMap, "productCode"> = {
  deliveryClass: "manual_review_required",
  requiredStates: [
    "payment_confirmed",
    "entitlement_created",
    "internal_records_created",
    "draft_created",
    "admin_preview_ready",
    "awaiting_operator_review",
    "approved_for_delivery",
    "customer_access_created",
    "customer_notified",
    "delivered",
  ],
  skippableStates: [
    "intake_required",
    "intake_received",
  ],
  terminalStates: ["delivered", "blocked", "failed", "refunded", "cancelled"],
};

export const SUBSCRIPTION_STATE_MAP: Omit<ProductFulfilmentStateMap, "productCode"> = {
  deliveryClass: "subscription_retainer_cycle",
  requiredStates: [
    "payment_confirmed",
    "entitlement_created",
    "customer_access_created",
    "delivered",
  ],
  skippableStates: [
    "intake_required",
    "intake_received",
    "internal_records_created",
    "draft_created",
    "admin_preview_ready",
    "awaiting_operator_review",
    "approved_for_delivery",
    "customer_notified",
  ],
  terminalStates: ["delivered", "blocked", "failed", "refunded", "cancelled"],
};

export const ARCHIVED_REFERENCE_STATE_MAP: Omit<ProductFulfilmentStateMap, "productCode"> = {
  deliveryClass: "archived_digital_reference",
  requiredStates: [
    "payment_confirmed",
    "entitlement_created",
    "customer_access_created",
    "delivered",
  ],
  skippableStates: [
    "intake_required",
    "intake_received",
    "internal_records_created",
    "draft_created",
    "admin_preview_ready",
    "awaiting_operator_review",
    "approved_for_delivery",
    "customer_notified",
  ],
  terminalStates: ["delivered", "blocked", "failed", "refunded", "cancelled"],
};

export const BUNDLE_GRANT_STATE_MAP: Omit<ProductFulfilmentStateMap, "productCode"> = {
  deliveryClass: "bundle_grant",
  requiredStates: [
    "payment_confirmed",
    "entitlement_created",
    "customer_access_created",
    "delivered",
  ],
  skippableStates: [
    "intake_required",
    "intake_received",
    "internal_records_created",
    "draft_created",
    "admin_preview_ready",
    "awaiting_operator_review",
    "approved_for_delivery",
    "customer_notified",
  ],
  terminalStates: ["delivered", "blocked", "failed", "refunded", "cancelled"],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const PRODUCT_FULFILMENT_STATE_MAP_REGISTRY: ProductFulfilmentStateMap[] = [
  // ── Boardroom Brief (the reference implementation) ──────────────────────
  {
    productCode: "boardroom_brief",
    ...MANUAL_REVIEW_STATE_MAP,
  },

  // ── Instant Access Instruments ──────────────────────────────────────────
  {
    productCode: "personal_decision_audit",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "decision_exposure_instrument",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "mandate_clarity_framework",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "intervention_path_selector",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "escalation_readiness_scorecard",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "structural_failure_diagnostic_canvas",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "execution_risk_index",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "team_alignment_gap_map",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "governance_drift_detector",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "strategic_priority_stack_builder",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "board_brief_builder",
    ...INSTANT_ACCESS_STATE_MAP,
  },

  // ── Governed Methodology Runs ───────────────────────────────────────────
  {
    productCode: "execution_integrity_protocol",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "alignment_audit_playbook",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "drift_detection_framework",
    ...INSTANT_ACCESS_STATE_MAP,
  },

  // ── Executive Reporting ─────────────────────────────────────────────────
  {
    productCode: "executive_reporting",
    ...GENERATED_ARTIFACT_STATE_MAP,
  },

  // ── Strategy Room ───────────────────────────────────────────────────────
  {
    productCode: "strategy_room",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "strategy_room_extended",
    ...INSTANT_ACCESS_STATE_MAP,
  },

  // ── Professional Subscriptions ──────────────────────────────────────────
  {
    productCode: "professional",
    ...SUBSCRIPTION_STATE_MAP,
  },
  {
    productCode: "professional_annual",
    ...SUBSCRIPTION_STATE_MAP,
  },

  // ── GMI Reports ─────────────────────────────────────────────────────────
  {
    productCode: "gmi_q1_2026",
    ...ARCHIVED_REFERENCE_STATE_MAP,
  },
  {
    productCode: "gmi_q2_2026",
    ...ARCHIVED_REFERENCE_STATE_MAP,
  },
  {
    productCode: "gmi_q3_2026",
    ...ARCHIVED_REFERENCE_STATE_MAP,
  },

  // ── Bundles ─────────────────────────────────────────────────────────────
  {
    productCode: "operator_decision_pack",
    ...BUNDLE_GRANT_STATE_MAP,
  },
  {
    productCode: "operator_essentials_pack",
    deliveryClass: "inactive_not_sellable",
    requiredStates: [],
    skippableStates: [],
    terminalStates: ["cancelled"],
  },
  {
    productCode: "command_pack",
    deliveryClass: "inactive_not_sellable",
    requiredStates: [],
    skippableStates: [],
    terminalStates: ["cancelled"],
  },
  {
    productCode: "governance_suite",
    deliveryClass: "inactive_not_sellable",
    requiredStates: [],
    skippableStates: [],
    terminalStates: ["cancelled"],
  },

  // ── Free / Corridor ─────────────────────────────────────────────────────
  {
    productCode: "fast_diagnostic",
    deliveryClass: "instant_digital_access",
    requiredStates: ["customer_access_created", "delivered"],
    skippableStates: [
      "payment_confirmed", "entitlement_created", "intake_required",
      "intake_received", "internal_records_created", "draft_created",
      "admin_preview_ready", "awaiting_operator_review", "approved_for_delivery",
      "customer_notified",
    ],
    terminalStates: ["delivered"],
  },
  {
    productCode: "team_assessment",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "enterprise_assessment",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "boardroom_mode",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "case_dossier_tariff_shock",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "case_dossier_team_alignment",
    ...INSTANT_ACCESS_STATE_MAP,
  },
  {
    productCode: "case_dossier_escalation_denied",
    ...INSTANT_ACCESS_STATE_MAP,
  },

  // ── Contracted / Inactive ───────────────────────────────────────────────
  {
    productCode: "retainer_core",
    deliveryClass: "inactive_not_sellable",
    requiredStates: [],
    skippableStates: [],
    terminalStates: ["cancelled"],
  },
  {
    productCode: "retainer_operational",
    deliveryClass: "inactive_not_sellable",
    requiredStates: [],
    skippableStates: [],
    terminalStates: ["cancelled"],
  },
  {
    productCode: "retainer_institutional",
    deliveryClass: "inactive_not_sellable",
    requiredStates: [],
    skippableStates: [],
    terminalStates: ["cancelled"],
  },
  {
    productCode: "enterprise",
    deliveryClass: "inactive_not_sellable",
    requiredStates: [],
    skippableStates: [],
    terminalStates: ["cancelled"],
  },
  {
    productCode: "additional_collaborator",
    deliveryClass: "inactive_not_sellable",
    requiredStates: [],
    skippableStates: [],
    terminalStates: ["cancelled"],
  },
  {
    productCode: "inner_circle",
    deliveryClass: "inactive_not_sellable",
    requiredStates: [],
    skippableStates: [],
    terminalStates: ["cancelled"],
  },
  {
    productCode: "diagnostic_report_basic",
    deliveryClass: "inactive_not_sellable",
    requiredStates: [],
    skippableStates: [],
    terminalStates: ["cancelled"],
  },
  {
    productCode: "diagnostic_report_pro",
    deliveryClass: "inactive_not_sellable",
    requiredStates: [],
    skippableStates: [],
    terminalStates: ["cancelled"],
  },
  {
    productCode: "executive_reporting_priority",
    deliveryClass: "inactive_not_sellable",
    requiredStates: [],
    skippableStates: [],
    terminalStates: ["cancelled"],
  },
];

// ─── Lookup ───────────────────────────────────────────────────────────────────

export function getFulfilmentStateMap(
  productCode: string,
): ProductFulfilmentStateMap | undefined {
  return PRODUCT_FULFILMENT_STATE_MAP_REGISTRY.find(
    (m) => m.productCode === productCode,
  );
}

export function getDeliveryClass(productCode: string): DeliveryClass | undefined {
  return getFulfilmentStateMap(productCode)?.deliveryClass;
}

/**
 * Get all unique delivery classes represented in the registry.
 */
export function getAllDeliveryClasses(): DeliveryClass[] {
  const classes = new Set<DeliveryClass>();
  for (const map of PRODUCT_FULFILMENT_STATE_MAP_REGISTRY) {
    classes.add(map.deliveryClass);
  }
  return Array.from(classes);
}

// ─── Fulfilment Transition ────────────────────────────────────────────────────

/**
 * A governed transition between two universal fulfilment states.
 * Evidence requirements and role restrictions are declared explicitly.
 */
export interface FulfilmentTransition {
  from: UniversalFulfilmentState;
  to: UniversalFulfilmentState;
  requiredEvidence: string[];
  allowedRoles: Array<"operator" | "admin" | "system" | "webhook">;
  /** Conditions that block this transition even if evidence is present */
  blockedIfConditions: string[];
}

// ─── Delivery Class State Map ─────────────────────────────────────────────────

/**
 * For each delivery class, which states are required (cannot be skipped)
 * and which are optional.
 */
export interface DeliveryClassStateSpec {
  deliveryClass: DeliveryClass;
  requiredStates: UniversalFulfilmentState[];
  optionalStates: UniversalFulfilmentState[];
}

export const DELIVERY_CLASS_STATE_MAP: Record<DeliveryClass, DeliveryClassStateSpec> = {
  instant_digital_access: {
    deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed", "entitlement_created", "customer_access_created", "delivered"],
    optionalStates: [
      "intake_required", "intake_received", "internal_records_created",
      "draft_created", "admin_preview_ready", "awaiting_operator_review",
      "approved_for_delivery", "customer_notified",
    ],
  },
  generated_digital_artifact: {
    deliveryClass: "generated_digital_artifact",
    requiredStates: [
      "payment_confirmed", "entitlement_created", "internal_records_created",
      "draft_created", "admin_preview_ready", "customer_access_created", "delivered",
    ],
    optionalStates: [
      "intake_required", "intake_received", "awaiting_operator_review",
      "approved_for_delivery", "customer_notified",
    ],
  },
  manual_review_required: {
    deliveryClass: "manual_review_required",
    requiredStates: [
      "payment_confirmed", "entitlement_created", "internal_records_created",
      "draft_created", "admin_preview_ready", "awaiting_operator_review",
      "approved_for_delivery", "customer_access_created", "customer_notified", "delivered",
    ],
    optionalStates: ["intake_required", "intake_received"],
  },
  scheduled_human_service: {
    deliveryClass: "scheduled_human_service",
    requiredStates: ["payment_confirmed", "entitlement_created", "customer_access_created", "delivered"],
    optionalStates: [
      "intake_required", "intake_received", "internal_records_created",
      "draft_created", "admin_preview_ready", "awaiting_operator_review",
      "approved_for_delivery", "customer_notified",
    ],
  },
  subscription_retainer_cycle: {
    deliveryClass: "subscription_retainer_cycle",
    requiredStates: ["payment_confirmed", "entitlement_created", "customer_access_created", "delivered"],
    optionalStates: [
      "intake_required", "intake_received", "internal_records_created",
      "draft_created", "admin_preview_ready", "awaiting_operator_review",
      "approved_for_delivery", "customer_notified",
    ],
  },
  archived_digital_reference: {
    deliveryClass: "archived_digital_reference",
    requiredStates: ["payment_confirmed", "entitlement_created", "customer_access_created", "delivered"],
    optionalStates: [
      "intake_required", "intake_received", "internal_records_created",
      "draft_created", "admin_preview_ready", "awaiting_operator_review",
      "approved_for_delivery", "customer_notified",
    ],
  },
  bundle_grant: {
    deliveryClass: "bundle_grant",
    requiredStates: ["payment_confirmed", "entitlement_created", "customer_access_created", "delivered"],
    optionalStates: [
      "intake_required", "intake_received", "internal_records_created",
      "draft_created", "admin_preview_ready", "awaiting_operator_review",
      "approved_for_delivery", "customer_notified",
    ],
  },
  inactive_not_sellable: {
    deliveryClass: "inactive_not_sellable",
    requiredStates: [],
    optionalStates: [],
  },
  internal_only: {
    deliveryClass: "internal_only",
    requiredStates: [],
    optionalStates: [],
  },
};

/**
 * Get the required states for a delivery class.
 */
export function getRequiredStatesForClass(
  deliveryClass: DeliveryClass,
): UniversalFulfilmentState[] {
  return DELIVERY_CLASS_STATE_MAP[deliveryClass]?.requiredStates ?? [];
}
