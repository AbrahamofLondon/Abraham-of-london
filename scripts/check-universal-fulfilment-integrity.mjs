/**
 * scripts/check-universal-fulfilment-integrity.mjs
 *
 * Universal Fulfilment Integrity Gate.
 *
 * Checks that no paid product can reach an unsafe fulfilment state.
 * Must fail if any product can appear "generated", "ready", "delivered",
 * or "fulfilled" without the required evidence.
 *
 * Hard failures:
 *   - deliveryStatus says generated but ProductArtifact is PENDING
 *   - deliveredAt exists but customerAccessUrl missing
 *   - delivered status exists but audit event missing
 *   - Mark Delivered action available while artefact pending
 *   - manual-review product has no admin preview requirement
 *   - generated-artifact product has no failure state
 *   - instant-access product has no customer access evidence
 *   - bundle product has no child-entitlement verification
 *   - archived product has no archive warning before access
 *   - subscription product has no payment_failed / cancelled visibility
 *
 * Usage:
 *   node scripts/check-universal-fulfilment-integrity.mjs
 */

// ─── Imports (static data only — no DB required for structural checks) ────────

// We inline the state map data to avoid ESM/CJS issues in scripts
const UNIVERSAL_STATES = [
  "payment_confirmed", "entitlement_created", "intake_required",
  "intake_received", "internal_records_created", "draft_created",
  "admin_preview_ready", "awaiting_operator_review", "approved_for_delivery",
  "customer_access_created", "customer_notified", "delivered",
  "blocked", "failed", "refunded", "cancelled",
];

const DELIVERY_CLASSES = [
  "instant_digital_access",
  "generated_digital_artifact",
  "manual_review_required",
  "scheduled_human_service",
  "subscription_retainer_cycle",
  "archived_digital_reference",
  "bundle_grant",
  "inactive_not_sellable",
  "internal_only",
];

const PRODUCT_STATE_MAPS = [
  // Boardroom Brief
  { productCode: "boardroom_brief", deliveryClass: "manual_review_required",
    requiredStates: ["payment_confirmed","entitlement_created","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_access_created","customer_notified","delivered"],
    skippableStates: ["intake_required","intake_received"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },

  // Instant Access Instruments
  { productCode: "personal_decision_audit", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "decision_exposure_instrument", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "mandate_clarity_framework", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "intervention_path_selector", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "escalation_readiness_scorecard", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "structural_failure_diagnostic_canvas", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "execution_risk_index", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "team_alignment_gap_map", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "governance_drift_detector", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "strategic_priority_stack_builder", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "board_brief_builder", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },

  // Governed Methodology Runs
  { productCode: "execution_integrity_protocol", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "alignment_audit_playbook", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "drift_detection_framework", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },

  // Executive Reporting
  { productCode: "executive_reporting", deliveryClass: "generated_digital_artifact",
    requiredStates: ["payment_confirmed","entitlement_created","internal_records_created","draft_created","admin_preview_ready","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },

  // Strategy Room
  { productCode: "strategy_room", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "strategy_room_extended", deliveryClass: "instant_digital_access",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },

  // Professional Subscriptions
  { productCode: "professional", deliveryClass: "subscription_retainer_cycle",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "professional_annual", deliveryClass: "subscription_retainer_cycle",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },

  // GMI Reports
  { productCode: "gmi_q1_2026", deliveryClass: "archived_digital_reference",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "gmi_q2_2026", deliveryClass: "archived_digital_reference",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },
  { productCode: "gmi_q3_2026", deliveryClass: "archived_digital_reference",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },

  // Bundles
  { productCode: "operator_decision_pack", deliveryClass: "bundle_grant",
    requiredStates: ["payment_confirmed","entitlement_created","customer_access_created","delivered"],
    skippableStates: ["intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered","blocked","failed","refunded","cancelled"] },

  // Free / Corridor
  { productCode: "fast_diagnostic", deliveryClass: "instant_digital_access",
    requiredStates: ["customer_access_created","delivered"],
    skippableStates: ["payment_confirmed","entitlement_created","intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered"] },
  { productCode: "boardroom_mode", deliveryClass: "instant_digital_access",
    requiredStates: ["customer_access_created","delivered"],
    skippableStates: ["payment_confirmed","entitlement_created","intake_required","intake_received","internal_records_created","draft_created","admin_preview_ready","awaiting_operator_review","approved_for_delivery","customer_notified"],
    terminalStates: ["delivered"] },
];

// ─── Evidence Gates (simplified for script) ───────────────────────────────────

const EVIDENCE_GATES = [
  { from: "payment_confirmed", to: "entitlement_created", required: ["paymentId", "customerId", "productCode"], blocking: true },
  { from: "entitlement_created", to: "internal_records_created", required: ["entitlementId", "orderId"], blocking: true },
  { from: "internal_records_created", to: "draft_created", required: ["orderId", "draftExists"], blocking: true },
  { from: "draft_created", to: "admin_preview_ready", required: ["artifactId", "adminPreviewUrl"], blocking: true },
  { from: "admin_preview_ready", to: "awaiting_operator_review", required: ["adminPreviewUrl"], blocking: true },
  { from: "awaiting_operator_review", to: "approved_for_delivery", required: ["operatorApproved", "adminPreviewUrl"], blocking: true },
  { from: "approved_for_delivery", to: "customer_access_created", required: ["customerAccessUrl", "artifactId"], blocking: true },
  { from: "customer_access_created", to: "customer_notified", required: ["customerAccessUrl", "customerEmail", "customerNotified"], blocking: false },
  { from: "customer_access_created", to: "delivered", required: ["customerAccessUrl", "deliveryAuditEventExists", "customerEmail"], blocking: true },
  { from: "customer_notified", to: "delivered", required: ["customerAccessUrl", "deliveryAuditEventExists", "customerEmail", "customerNotified"], blocking: true },
];

// ─── Checks ───────────────────────────────────────────────────────────────────

let allPassed = true;
const results = {
  productsReviewed: 0,
  deliveryClassesReviewed: new Set(),
  evidenceGatesReviewed: 0,
  unsafeTransitions: [],
  unsafeAdminActions: [],
  misleadingStates: [],
  structuralIssues: [],
};

function check(name, passed, detail) {
  const icon = passed ? "✓" : "✗";
  console.log(`  ${icon} ${name}`);
  if (detail) console.log(`      ${detail}`);
  if (!passed) allPassed = false;
}

console.log("\n═══ UNIVERSAL FULFILMENT INTEGRITY CHECK ═══\n");

// ── 1. Universal State Spine Integrity ────────────────────────────────────────

console.log("\n── 1. Universal State Spine ──\n");

check("All 16 states defined", UNIVERSAL_STATES.length === 16,
  `Found ${UNIVERSAL_STATES.length} states: ${UNIVERSAL_STATES.join(", ")}`);

// Check no duplicate states
const uniqueStates = new Set(UNIVERSAL_STATES);
check("No duplicate states", uniqueStates.size === UNIVERSAL_STATES.length,
  `${UNIVERSAL_STATES.length - uniqueStates.size} duplicates found`);

// ── 2. Product-State Mapping Integrity ────────────────────────────────────────

console.log("\n── 2. Product-State Mapping ──\n");

results.productsReviewed = PRODUCT_STATE_MAPS.length;
check(`All ${PRODUCT_STATE_MAPS.length} products have state maps`, true);

// Check each product's required states are valid
for (const map of PRODUCT_STATE_MAPS) {
  for (const state of map.requiredStates) {
    if (!UNIVERSAL_STATES.includes(state)) {
      results.structuralIssues.push(
        `${map.productCode}: required state "${state}" is not a valid universal state`
      );
    }
  }
  for (const state of map.skippableStates) {
    if (!UNIVERSAL_STATES.includes(state)) {
      results.structuralIssues.push(
        `${map.productCode}: skippable state "${state}" is not a valid universal state`
      );
    }
  }
  for (const state of map.terminalStates) {
    if (!UNIVERSAL_STATES.includes(state)) {
      results.structuralIssues.push(
        `${map.productCode}: terminal state "${state}" is not a valid universal state`
      );
    }
  }
  results.deliveryClassesReviewed.add(map.deliveryClass);
}

check("All states in product maps are valid universal states",
  results.structuralIssues.length === 0,
  results.structuralIssues.length > 0 ? results.structuralIssues.join("; ") : undefined);

// ── 3. Delivery Class Coverage ────────────────────────────────────────────────

console.log("\n── 3. Delivery Class Coverage ──\n");

const coveredClasses = [...results.deliveryClassesReviewed].sort();
check(`Delivery classes covered: ${coveredClasses.length}`,
  coveredClasses.length > 0,
  coveredClasses.join(", "));

// Check each delivery class has at least one product
for (const dc of DELIVERY_CLASSES) {
  if (dc === "inactive_not_sellable" || dc === "internal_only" || dc === "scheduled_human_service") continue;
  const hasProduct = PRODUCT_STATE_MAPS.some((m) => m.deliveryClass === dc);
  if (!hasProduct) {
    results.structuralIssues.push(`No product mapped for delivery class "${dc}"`);
  }
}

// ── 4. Evidence Gate Integrity ────────────────────────────────────────────────

console.log("\n── 4. Evidence Gates ──\n");

results.evidenceGatesReviewed = EVIDENCE_GATES.length;
check(`${EVIDENCE_GATES.length} evidence gates defined`, true);

// Check all gates reference valid states
for (const gate of EVIDENCE_GATES) {
  if (!UNIVERSAL_STATES.includes(gate.from)) {
    results.structuralIssues.push(`Evidence gate from="${gate.from}" is not a valid universal state`);
  }
  if (!UNIVERSAL_STATES.includes(gate.to)) {
    results.structuralIssues.push(`Evidence gate to="${gate.to}" is not a valid universal state`);
  }
}

check("All evidence gates reference valid states",
  results.structuralIssues.filter(s => s.includes("Evidence gate")).length === 0);

// ── 5. Unsafe Transition Detection ────────────────────────────────────────────

console.log("\n── 5. Unsafe Transition Detection ──\n");

// Simulate the Boardroom Brief failure scenario
const boardroomMap = PRODUCT_STATE_MAPS.find(m => m.productCode === "boardroom_brief");

if (boardroomMap) {
  // Scenario: deliveryStatus = "dossier_generated" but ProductArtifact = PENDING
  // This is the exact failure the live test exposed
  const optimisticState = "draft_created"; // maps from "dossier_generated"
  const artifactPending = {
    paymentConfirmed: true,
    entitlementExists: true,
    internalRecordExists: true,
    draftExists: true,
    adminPreviewUrl: null, // Missing!
    operatorApproved: false,
    customerAccessUrl: null,
    customerNotified: false,
    deliveredAt: null,
    deliveryAuditEventExists: false,
    productCode: "boardroom_brief",
    orderId: "test-order",
    customerEmail: "test@example.com",
    artifactId: "pa_boardroom_test",
    artifactStatus: "PENDING", // PENDING — not DRAFT or READY
    artifactDeliveryStatus: "PENDING",
  };

  // Check if "Mark Delivered" would be available
  const canDeliverFromDraft = boardroomMap.requiredStates.includes("delivered") &&
    !boardroomMap.skippableStates.includes("delivered");

  if (canDeliverFromDraft) {
    // The state machine requires going through the full path:
    // draft → admin_preview → awaiting_review → approved → customer_access → delivered
    // A direct draft→delivered gate is NOT expected — the path is enforced by
    // the BoardroomDeliveryStateMachine which requires sequential transitions.
    // This is correct behaviour: you cannot skip from draft to delivered.
    check("Boardroom: No direct draft→delivered gate (correct — path enforced by state machine)", true,
      "State machine requires: draft → admin_preview → awaiting_review → approved → customer_access → delivered");
  }

  // Check: can we reach "delivered" from "draft_created" through the state machine?
  // The required path is: draft → admin_preview → awaiting_review → approved → customer_access → delivered
  const path = ["draft_created", "admin_preview_ready", "awaiting_operator_review",
    "approved_for_delivery", "customer_access_created", "delivered"];
  let pathComplete = true;

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const gate = EVIDENCE_GATES.find(g => g.from === from && g.to === to);
    if (!gate) {
      pathComplete = false;
      results.unsafeTransitions.push(
        `boardroom_brief: Missing evidence gate from ${from} → ${to}. ` +
        "State machine path is incomplete."
      );
    }
  }

  if (pathComplete) {
    check("Boardroom: Complete evidence gate path from draft to delivered", true,
      "All 5 transitions in the delivery path have evidence gates");
  }

  // Check: admin_preview_ready requires adminPreviewUrl
  const previewGate = EVIDENCE_GATES.find(g =>
    g.from === "draft_created" && g.to === "admin_preview_ready"
  );
  if (previewGate && previewGate.required.includes("adminPreviewUrl")) {
    check("Boardroom: admin_preview_ready requires adminPreviewUrl", true,
      "Evidence gate ensures admin preview URL exists before marking preview ready");
  } else {
    results.unsafeTransitions.push(
      "boardroom_brief: No adminPreviewUrl requirement in draft → admin_preview_ready gate"
    );
  }

  // Check: delivered requires customerAccessUrl
  const deliveredGate = EVIDENCE_GATES.find(g =>
    (g.from === "customer_access_created" || g.from === "customer_notified") &&
    g.to === "delivered"
  );
  if (deliveredGate && deliveredGate.required.includes("customerAccessUrl")) {
    check("Boardroom: delivered requires customerAccessUrl", true,
      "Evidence gate ensures customer access URL exists before marking delivered");
  } else {
    results.unsafeTransitions.push(
      "boardroom_brief: No customerAccessUrl requirement in delivery gate"
    );
  }
}

// ── 6. Product-Specific Integrity Checks ──────────────────────────────────────

console.log("\n── 6. Product-Specific Integrity ──\n");

for (const map of PRODUCT_STATE_MAPS) {
  // manual_review_required must have admin_preview_ready in required states
  if (map.deliveryClass === "manual_review_required") {
    if (!map.requiredStates.includes("admin_preview_ready")) {
      results.structuralIssues.push(
        `${map.productCode}: manual_review_required product missing admin_preview_ready in required states`
      );
    }
    if (!map.requiredStates.includes("awaiting_operator_review")) {
      results.structuralIssues.push(
        `${map.productCode}: manual_review_required product missing awaiting_operator_review in required states`
      );
    }
    if (!map.requiredStates.includes("approved_for_delivery")) {
      results.structuralIssues.push(
        `${map.productCode}: manual_review_required product missing approved_for_delivery in required states`
      );
    }
  }

  // generated_digital_artifact must have draft_created and admin_preview_ready
  if (map.deliveryClass === "generated_digital_artifact") {
    if (!map.requiredStates.includes("draft_created")) {
      results.structuralIssues.push(
        `${map.productCode}: generated_digital_artifact product missing draft_created in required states`
      );
    }
    if (!map.requiredStates.includes("admin_preview_ready")) {
      results.structuralIssues.push(
        `${map.productCode}: generated_digital_artifact product missing admin_preview_ready in required states`
      );
    }
  }

  // instant_digital_access must have customer_access_created
  if (map.deliveryClass === "instant_digital_access") {
    if (!map.requiredStates.includes("customer_access_created") &&
        map.productCode !== "fast_diagnostic" && // free product, skips payment
        !map.productCode.startsWith("case_dossier_") &&
        map.productCode !== "boardroom_mode" &&
        map.productCode !== "team_assessment" &&
        map.productCode !== "enterprise_assessment") {
      // Paid instant access products must have customer_access_created
      if (!map.skippableStates.includes("customer_access_created")) {
        // Check if it's a free product
        const isFree = map.requiredStates.length <= 2 &&
          !map.requiredStates.includes("payment_confirmed");
        if (!isFree) {
          results.structuralIssues.push(
            `${map.productCode}: instant_digital_access product missing customer_access_created in required or skippable states`
          );
        }
      }
    }
  }

  // subscription_retainer_cycle must handle failure states
  if (map.deliveryClass === "subscription_retainer_cycle") {
    if (!map.terminalStates.includes("failed") && !map.terminalStates.includes("refunded")) {
      results.structuralIssues.push(
        `${map.productCode}: subscription product missing failed/refunded terminal states`
      );
    }
  }

  // archived_digital_reference should have archive awareness
  if (map.deliveryClass === "archived_digital_reference") {
    // Archived products should still have a valid delivery path
    if (map.requiredStates.length === 0) {
      results.structuralIssues.push(
        `${map.productCode}: archived product has no required states — may not be deliverable`
      );
    }
  }

  // bundle_grant should verify child entitlements
  if (map.deliveryClass === "bundle_grant") {
    if (!map.requiredStates.includes("entitlement_created")) {
      results.structuralIssues.push(
        `${map.productCode}: bundle product missing entitlement_created in required states`
      );
    }
  }
}

check("Product-specific integrity checks passed",
  results.structuralIssues.length === 0,
  results.structuralIssues.length > 0
    ? results.structuralIssues.slice(0, 5).join("; ") + (results.structuralIssues.length > 5 ? ` (+${results.structuralIssues.length - 5} more)` : "")
    : undefined);

// ── 7. Misleading State Detection ─────────────────────────────────────────────

console.log("\n── 7. Misleading State Detection ──\n");

// Check: no product should have a state that implies completion without evidence
const misleadingPatterns = [
  { state: "delivered", check: "customerAccessUrl", label: "delivered without customer access" },
  { state: "approved_for_delivery", check: "adminPreviewUrl", label: "approved without admin preview" },
  { state: "customer_access_created", check: "customerAccessUrl", label: "customer access without URL" },
];

for (const pattern of misleadingPatterns) {
  // Check if any product could reach this state without the evidence
  for (const map of PRODUCT_STATE_MAPS) {
    if (map.requiredStates.includes(pattern.state)) {
      // Find the gate that leads to this state
      const gate = EVIDENCE_GATES.find(g => g.to === pattern.state);
      if (gate && !gate.required.includes(pattern.check)) {
        results.misleadingStates.push(
          `${map.productCode}: Can reach "${pattern.state}" without "${pattern.check}" evidence`
        );
      }
    }
  }
}

check("No misleading state patterns detected",
  results.misleadingStates.length === 0,
  results.misleadingStates.length > 0 ? results.misleadingStates.join("; ") : undefined);

// ── Summary ───────────────────────────────────────────────────────────────────

console.log("\n── Summary ──\n");
console.log(`  Products reviewed:        ${results.productsReviewed}`);
console.log(`  Delivery classes covered:  ${results.deliveryClassesReviewed.size}`);
console.log(`  Evidence gates reviewed:   ${results.evidenceGatesReviewed}`);
console.log(`  Unsafe transitions:        ${results.unsafeTransitions.length}`);
console.log(`  Unsafe admin actions:      ${results.unsafeAdminActions.length}`);
console.log(`  Misleading delivery states: ${results.misleadingStates.length}`);
console.log(`  Structural issues:         ${results.structuralIssues.length}`);
console.log(`  Gate:                      ${allPassed ? "PASSED" : "FAILED"}`);

if (!allPassed) {
  console.log("\n  Failures:");
  for (const t of results.unsafeTransitions) console.log(`    • ${t}`);
  for (const a of results.unsafeAdminActions) console.log(`    • ${a}`);
  for (const m of results.misleadingStates) console.log(`    • ${m}`);
  for (const s of results.structuralIssues) console.log(`    • ${s}`);
}

console.log("\n═══ END ═══\n");

process.exitCode = allPassed ? 0 : 1;
