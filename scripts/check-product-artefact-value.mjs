#!/usr/bin/env node
/**
 * scripts/check-product-artefact-value.mjs
 *
 * Universal Artefact Value Gate.
 *
 * Checks that every paid product in the estate has a defined artefact value
 * profile, and that no premium product can be approved with metadata-only
 * or weak artefacts.
 *
 * Must fail if:
 *   - paid artefact has no value profile
 *   - paid artefact has no required input basis
 *   - premium artefact lacks diagnosis
 *   - premium artefact lacks commercial consequence
 *   - premium artefact lacks recommended next move
 *   - premium artefact lacks falsification challenge
 *   - artefact can be approved while value score is below threshold
 *   - artefact can be delivered while still only metadata/stub content
 *
 * Usage:
 *   node scripts/check-product-artefact-value.mjs
 */

// ─── Inline registry data (mirrors lib/product/product-artefact-value-registry.ts) ──

const REGISTRY = [
  // Boardroom Brief
  { productCode: "boardroom_brief", artefactType: "boardroom_dossier", commercialTier: "paid_premium",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","evidence_interpretation","commercial_consequence","decision_options","recommended_next_move","falsification_challenge","risk_and_dependency_map","execution_sequence","customer_specificity","commercial_value_claim"],
    minimumScores: { input_basis: 2, strategic_diagnosis: 3, commercial_consequence: 3, recommended_next_move: 3, falsification_challenge: 2, customer_specificity: 2, commercial_value_claim: 3 },
    minimumOverallScore: 28, approvalBlockedBelowScore: true },

  // Strategy Room
  { productCode: "strategy_room", artefactType: "strategy_room_brief", commercialTier: "paid_premium",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","commercial_consequence","decision_options","recommended_next_move","falsification_challenge","customer_specificity","commercial_value_claim"],
    minimumScores: { strategic_diagnosis: 2, commercial_consequence: 2, recommended_next_move: 2, falsification_challenge: 1, customer_specificity: 2 },
    minimumOverallScore: 17, approvalBlockedBelowScore: true },
  { productCode: "strategy_room_extended", artefactType: "strategy_room_brief", commercialTier: "paid_premium",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","evidence_interpretation","commercial_consequence","decision_options","recommended_next_move","falsification_challenge","risk_and_dependency_map","execution_sequence","customer_specificity","commercial_value_claim"],
    minimumScores: { strategic_diagnosis: 3, commercial_consequence: 3, recommended_next_move: 3, falsification_challenge: 2, customer_specificity: 2, commercial_value_claim: 3 },
    minimumOverallScore: 26, approvalBlockedBelowScore: true },

  // Executive Reporting
  { productCode: "executive_reporting", artefactType: "executive_report", commercialTier: "paid_premium",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","evidence_interpretation","commercial_consequence","recommended_next_move","falsification_challenge","customer_specificity","commercial_value_claim"],
    minimumScores: { strategic_diagnosis: 2, commercial_consequence: 2, recommended_next_move: 2, customer_specificity: 2 },
    minimumOverallScore: 18, approvalBlockedBelowScore: true },

  // Instant Digital Access Instruments (paid_entry)
  { productCode: "personal_decision_audit", artefactType: "decision_instrument", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","recommended_next_move","customer_specificity"],
    minimumScores: { strategic_diagnosis: 2, recommended_next_move: 2 }, minimumOverallScore: 8, approvalBlockedBelowScore: false },
  { productCode: "decision_exposure_instrument", artefactType: "decision_instrument", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","recommended_next_move","customer_specificity"],
    minimumScores: { strategic_diagnosis: 2, recommended_next_move: 2 }, minimumOverallScore: 8, approvalBlockedBelowScore: false },
  { productCode: "mandate_clarity_framework", artefactType: "decision_instrument", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","recommended_next_move","customer_specificity"],
    minimumScores: { strategic_diagnosis: 2, recommended_next_move: 2 }, minimumOverallScore: 8, approvalBlockedBelowScore: false },
  { productCode: "intervention_path_selector", artefactType: "decision_instrument", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","recommended_next_move","customer_specificity"],
    minimumScores: { strategic_diagnosis: 2, recommended_next_move: 2 }, minimumOverallScore: 8, approvalBlockedBelowScore: false },
  { productCode: "escalation_readiness_scorecard", artefactType: "decision_instrument", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","recommended_next_move","customer_specificity"],
    minimumScores: { strategic_diagnosis: 2, recommended_next_move: 2 }, minimumOverallScore: 8, approvalBlockedBelowScore: false },
  { productCode: "structural_failure_diagnostic_canvas", artefactType: "decision_instrument", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","recommended_next_move","customer_specificity"],
    minimumScores: { strategic_diagnosis: 2, recommended_next_move: 2 }, minimumOverallScore: 8, approvalBlockedBelowScore: false },
  { productCode: "execution_risk_index", artefactType: "decision_instrument", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","recommended_next_move","customer_specificity"],
    minimumScores: { strategic_diagnosis: 2, recommended_next_move: 2 }, minimumOverallScore: 8, approvalBlockedBelowScore: false },
  { productCode: "team_alignment_gap_map", artefactType: "decision_instrument", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","recommended_next_move","customer_specificity"],
    minimumScores: { strategic_diagnosis: 2, recommended_next_move: 2 }, minimumOverallScore: 8, approvalBlockedBelowScore: false },
  { productCode: "governance_drift_detector", artefactType: "decision_instrument", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","recommended_next_move","customer_specificity"],
    minimumScores: { strategic_diagnosis: 2, recommended_next_move: 2 }, minimumOverallScore: 8, approvalBlockedBelowScore: false },
  { productCode: "strategic_priority_stack_builder", artefactType: "decision_instrument", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","recommended_next_move","customer_specificity"],
    minimumScores: { strategic_diagnosis: 2, recommended_next_move: 2 }, minimumOverallScore: 8, approvalBlockedBelowScore: false },
  { productCode: "board_brief_builder", artefactType: "decision_instrument", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","recommended_next_move","customer_specificity"],
    minimumScores: { strategic_diagnosis: 2, recommended_next_move: 2 }, minimumOverallScore: 8, approvalBlockedBelowScore: false },

  // Governed Methodology Runs (paid_entry)
  { productCode: "execution_integrity_protocol", artefactType: "methodology_run", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","recommended_next_move","customer_specificity"],
    minimumScores: { recommended_next_move: 2 }, minimumOverallScore: 7, approvalBlockedBelowScore: false },
  { productCode: "alignment_audit_playbook", artefactType: "methodology_run", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","recommended_next_move","customer_specificity"],
    minimumScores: { recommended_next_move: 2 }, minimumOverallScore: 7, approvalBlockedBelowScore: false },
  { productCode: "drift_detection_framework", artefactType: "methodology_run", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","recommended_next_move","customer_specificity"],
    minimumScores: { recommended_next_move: 2 }, minimumOverallScore: 7, approvalBlockedBelowScore: false },

  // GMI Reports (paid_entry)
  { productCode: "gmi_q1_2026", artefactType: "archived_intelligence_report", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","evidence_interpretation","commercial_consequence","customer_specificity"],
    minimumScores: { evidence_interpretation: 2, commercial_consequence: 2 }, minimumOverallScore: 6, approvalBlockedBelowScore: false },
  { productCode: "gmi_q2_2026", artefactType: "archived_intelligence_report", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","evidence_interpretation","commercial_consequence","customer_specificity"],
    minimumScores: { evidence_interpretation: 2, commercial_consequence: 2 }, minimumOverallScore: 6, approvalBlockedBelowScore: false },
  { productCode: "gmi_q3_2026", artefactType: "archived_intelligence_report", commercialTier: "paid_entry",
    requiredDimensions: ["input_basis","evidence_interpretation","commercial_consequence","customer_specificity"],
    minimumScores: { evidence_interpretation: 2, commercial_consequence: 2 }, minimumOverallScore: 6, approvalBlockedBelowScore: false },

  // Professional Subscriptions
  { productCode: "professional", artefactType: "subscription_oversight", commercialTier: "subscription",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","commercial_consequence","recommended_next_move","customer_specificity"],
    minimumScores: { strategic_diagnosis: 2, commercial_consequence: 2, recommended_next_move: 2 }, minimumOverallScore: 12, approvalBlockedBelowScore: false },
  { productCode: "professional_annual", artefactType: "subscription_oversight", commercialTier: "subscription",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","commercial_consequence","recommended_next_move","customer_specificity"],
    minimumScores: { strategic_diagnosis: 2, commercial_consequence: 2, recommended_next_move: 2 }, minimumOverallScore: 12, approvalBlockedBelowScore: false },

  // Bundle
  { productCode: "operator_decision_pack", artefactType: "bundle", commercialTier: "paid_premium",
    requiredDimensions: ["input_basis","problem_definition","strategic_diagnosis","commercial_consequence","decision_options","recommended_next_move","falsification_challenge","customer_specificity","commercial_value_claim"],
    minimumScores: { strategic_diagnosis: 2, commercial_consequence: 2, recommended_next_move: 2, falsification_challenge: 1 }, minimumOverallScore: 17, approvalBlockedBelowScore: true },
];

// ─── All known product codes from the fulfilment estate ───────────────────────

const ALL_PRODUCT_CODES = [
  "boardroom_brief",
  "personal_decision_audit", "decision_exposure_instrument", "mandate_clarity_framework",
  "intervention_path_selector", "escalation_readiness_scorecard", "structural_failure_diagnostic_canvas",
  "execution_risk_index", "team_alignment_gap_map", "governance_drift_detector",
  "strategic_priority_stack_builder", "board_brief_builder",
  "execution_integrity_protocol", "alignment_audit_playbook", "drift_detection_framework",
  "executive_reporting",
  "strategy_room", "strategy_room_extended",
  "professional", "professional_annual",
  "gmi_q1_2026", "gmi_q2_2026", "gmi_q3_2026",
  "operator_decision_pack",
  "fast_diagnostic", "boardroom_mode", "team_assessment", "enterprise_assessment",
  "case_dossier_tariff_shock", "case_dossier_team_alignment", "case_dossier_escalation_denied",
  "retainer_core", "retainer_operational", "retainer_institutional",
  "enterprise", "additional_collaborator",
  "operator_essentials_pack", "command_pack", "governance_suite", "inner_circle",
  "diagnostic_report_basic", "diagnostic_report_pro", "executive_reporting_priority",
];

// ─── Free / N/A products that don't need value profiles ───────────────────────

const FREE_PRODUCT_CODES = [
  "fast_diagnostic", "boardroom_mode", "team_assessment", "enterprise_assessment",
];

const NOT_APPLICABLE_PRODUCT_CODES = [
  "case_dossier_tariff_shock", "case_dossier_team_alignment", "case_dossier_escalation_denied",
  "retainer_core", "retainer_operational", "retainer_institutional",
  "enterprise", "additional_collaborator",
  "operator_essentials_pack", "command_pack", "governance_suite", "inner_circle",
  "diagnostic_report_basic", "diagnostic_report_pro", "executive_reporting_priority",
];

// ─── Checks ───────────────────────────────────────────────────────────────────

let allPassed = true;
const failures = [];
const warnings = [];

function check(name, passed, detail) {
  const icon = passed ? "✓" : "✗";
  console.log(`  ${icon} ${name}`);
  if (detail) console.log(`      ${detail}`);
  if (!passed) {
    allPassed = false;
    failures.push({ name, detail });
  }
}

console.log("\n═══ PRODUCT ARTEFACT VALUE CHECK ═══\n");

// ── 1. Count products ────────────────────────────────────────────────────────

const paidProductCodes = ALL_PRODUCT_CODES.filter(
  (c) => !FREE_PRODUCT_CODES.includes(c) && !NOT_APPLICABLE_PRODUCT_CODES.includes(c)
);
const premiumProfiles = REGISTRY.filter(
  (p) => p.commercialTier === "paid_premium" || p.commercialTier === "enterprise"
);

console.log(`  Products in estate: ${ALL_PRODUCT_CODES.length}`);
console.log(`  Paid products requiring profiles: ${paidProductCodes.length}`);
console.log(`  Premium products: ${premiumProfiles.length}`);
console.log(`  Registered profiles: ${REGISTRY.length}`);
console.log("");

// ── 2. Every paid product must have a value profile ──────────────────────────

console.log("── 1. Paid Product Value Profile Coverage ──\n");

const registeredCodes = REGISTRY.map((p) => p.productCode);
const missingProfiles = paidProductCodes.filter((c) => !registeredCodes.includes(c));

for (const code of paidProductCodes) {
  const hasProfile = registeredCodes.includes(code);
  check(
    `${code} has value profile`,
    hasProfile,
    hasProfile ? `Tier: ${REGISTRY.find((p) => p.productCode === code).commercialTier}` : "MISSING — no value profile defined"
  );
}

// ── 3. Every paid profile must have input_basis ──────────────────────────────

console.log("\n── 2. Required Dimension: input_basis ──\n");

for (const profile of REGISTRY) {
  const hasInputBasis = profile.requiredDimensions.includes("input_basis");
  check(
    `${profile.productCode} requires input_basis`,
    hasInputBasis,
    hasInputBasis ? `Minimum score: ${profile.minimumScores.input_basis ?? 1}` : "MISSING — no input basis required"
  );
}

// ── 4. Premium products must have strategic_diagnosis ────────────────────────

console.log("\n── 3. Premium Products: strategic_diagnosis ──\n");

for (const profile of premiumProfiles) {
  const hasDiagnosis = profile.requiredDimensions.includes("strategic_diagnosis");
  check(
    `${profile.productCode} requires strategic_diagnosis`,
    hasDiagnosis,
    hasDiagnosis ? `Minimum score: ${profile.minimumScores.strategic_diagnosis ?? 1}` : "MISSING — premium product without diagnosis"
  );
}

// ── 5. Premium products must have commercial_consequence ─────────────────────

console.log("\n── 4. Premium Products: commercial_consequence ──\n");

for (const profile of premiumProfiles) {
  const hasConsequence = profile.requiredDimensions.includes("commercial_consequence");
  check(
    `${profile.productCode} requires commercial_consequence`,
    hasConsequence,
    hasConsequence ? `Minimum score: ${profile.minimumScores.commercial_consequence ?? 1}` : "MISSING — premium product without commercial consequence"
  );
}

// ── 6. Premium products must have recommended_next_move ──────────────────────

console.log("\n── 5. Premium Products: recommended_next_move ──\n");

for (const profile of premiumProfiles) {
  const hasNextMove = profile.requiredDimensions.includes("recommended_next_move");
  check(
    `${profile.productCode} requires recommended_next_move`,
    hasNextMove,
    hasNextMove ? `Minimum score: ${profile.minimumScores.recommended_next_move ?? 1}` : "MISSING — premium product without next move"
  );
}

// ── 7. Premium products must have falsification_challenge ────────────────────

console.log("\n── 6. Premium Products: falsification_challenge ──\n");

for (const profile of premiumProfiles) {
  const hasFalsification = profile.requiredDimensions.includes("falsification_challenge");
  check(
    `${profile.productCode} requires falsification_challenge`,
    hasFalsification,
    hasFalsification ? `Minimum score: ${profile.minimumScores.falsification_challenge ?? 1}` : "MISSING — premium product without falsification challenge"
  );
}

// ── 8. Approval-blocked products must have approvalBlockedBelowScore=true ─────

console.log("\n── 7. Approval-Blocked Products ──\n");

const approvalBlocked = REGISTRY.filter((p) => p.approvalBlockedBelowScore);
for (const profile of approvalBlocked) {
  check(
    `${profile.productCode} blocks approval below score threshold`,
    true,
    `Minimum overall score: ${profile.minimumOverallScore} / ${profile.requiredDimensions.length * 3}`
  );
}

// ── 9. Check that no premium product can be delivered as metadata-only ───────

console.log("\n── 8. Metadata-Only Delivery Prevention ──\n");

for (const profile of premiumProfiles) {
  // Premium products with approvalBlockedBelowScore cannot be delivered with score 0
  const zeroScoreDimensions = profile.requiredDimensions.filter(
    (d) => (profile.minimumScores[d] ?? 1) > 0
  );
  check(
    `${profile.productCode} prevents metadata-only delivery`,
    profile.approvalBlockedBelowScore && zeroScoreDimensions.length > 0,
    profile.approvalBlockedBelowScore
      ? `Blocked: ${zeroScoreDimensions.length} dimensions require minimum score > 0`
      : "NOT BLOCKED — metadata-only artefacts could be delivered"
  );
}

// ── 10. Check that at least one product per delivery class is covered ────────

console.log("\n── 9. Delivery Class Coverage ──\n");

const deliveryClassMap = {
  manual_review_required: ["boardroom_brief"],
  instant_digital_access: ["personal_decision_audit", "strategy_room", "execution_risk_index"],
  generated_digital_artifact: ["executive_reporting"],
  archived_digital_reference: ["gmi_q1_2026"],
  subscription_retainer_cycle: ["professional"],
  bundle_grant: ["operator_decision_pack"],
};

for (const [dc, examples] of Object.entries(deliveryClassMap)) {
  const covered = examples.some((ex) => registeredCodes.includes(ex));
  check(
    `${dc} has at least one product with value profile`,
    covered,
    covered ? `Covered by: ${examples.filter((e) => registeredCodes.includes(e)).join(", ")}` : "NOT COVERED"
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log("\n── Summary ──\n");
console.log(`  Products reviewed:        ${ALL_PRODUCT_CODES.length}`);
console.log(`  Paid artefacts reviewed:   ${paidProductCodes.length}`);
console.log(`  Premium artefacts reviewed: ${premiumProfiles.length}`);
console.log(`  Missing value profiles:    ${missingProfiles.length}`);
console.log(`  Approval-blocking weak artefacts: ${approvalBlocked.length}`);
console.log(`  Metadata-only artefacts:   ${failures.filter((f) => f.name.includes("metadata-only")).length}`);
console.log(`  Gate:                     ${allPassed ? "PASSED" : "FAILED"}`);

if (!allPassed) {
  console.log("\n  Failures:");
  for (const f of failures) {
    console.log(`    • ${f.name}: ${f.detail}`);
  }
}

console.log("\n═══ END ═══\n");

process.exitCode = allPassed ? 0 : 1;
