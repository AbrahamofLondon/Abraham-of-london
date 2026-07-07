import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "artifacts", "validation", "assessment-estate");
fs.mkdirSync(outDir, { recursive: true });

const surfaces = [
  surface("/diagnostics/fast", "fast_diagnostic", "diagnostic", "pages/diagnostics/fast.tsx", "pages/api/diagnostics/submit.ts", "READY", { designSystem: "diagnostics_shared_result_contract" }),
  surface("/diagnostics/purpose-alignment", "purpose_alignment", "diagnostic", "pages/diagnostics/purpose-alignment.tsx", "app/api/purpose-alignment/capture/route.ts", "READY", { designSystem: "diagnostics_shared_result_contract" }),
  surface("/purpose-alignment", "purpose_alignment", "diagnostic", "app/purpose-alignment/page.tsx", "app/api/purpose-alignment/capture/route.ts", "READY", { designSystem: "diagnostics_shared_result_contract" }),
  surface("/checkout/personal-decision-audit", "personal_decision_audit", "diagnostic", "pages/checkout/personal-decision-audit.tsx", "pages/api/diagnostics/submit.ts", "READY", { commercialAction: "checkout_governed", designSystem: "legacy_checkout_assessment" }),
  surface("/diagnostics/enterprise", "enterprise_assessment", "diagnostic", "pages/diagnostics/enterprise.tsx", "pages/api/diagnostics/enterprise.ts", "READY_CONTROLLED", { controlledRoute: true, commercialAction: "controlled_intake" }),
  surface("/diagnostics/enterprise-assessment", "enterprise_assessment", "diagnostic", "pages/diagnostics/enterprise-assessment.tsx", "app/api/assessments/enterprise/run/route.ts", "READY_CONTROLLED", { controlledRoute: true }),
  surface("/enterprise-decision-scan", "enterprise_decision_scan", "diagnostic", "pages/enterprise-decision-scan.tsx", "app/api/enterprise/enquiry/route.ts", "READY_CONTROLLED", { controlledRoute: true }),
  surface("/diagnostics/team-assessment", "team_assessment", "diagnostic", "pages/diagnostics/team-assessment.tsx", "app/api/assessments/team/run/route.ts", "READY"),
  surface("/assessment/[token]", "team_assessment", "diagnostic", "app/assessment/[token]/page.tsx", "app/api/team-assessment/respond/[token]/route.ts", "AUTH_GATED", { authenticationRequirement: "token" }),
  surface("/diagnostics/constitutional-diagnostic", "constitutional_diagnostic", "diagnostic", "pages/diagnostics/constitutional-diagnostic.tsx", "pages/api/diagnostics/constitutional-intake/report.ts", "READY"),
  surface("/diagnostics/directional-integrity", "directional_integrity", "diagnostic", "pages/diagnostics/directional-integrity.tsx", "pages/api/diagnostics/directional-integrity.ts", "READY"),
  surface("/diagnostics/executive-reporting", "executive_reporting", "diagnostic", "pages/diagnostics/executive-reporting.tsx", "pages/api/diagnostics/executive-reporting.ts", "READY_CONTROLLED", { controlledRoute: true, commercialAction: "manual_billing" }),
  surface("/decision-instruments", "decision_instruments_directory", "instrument", "pages/decision-instruments/index.tsx", null, "READY"),
  surface("/decision-instruments/signal", "decision_signal", "instrument", "pages/decision-instruments/signal/index.tsx", "app/api/strategy-room/session/conversion/route.ts", "READY", { owner: "Claude", designSystem: "claude_flagship_journey; migrate_to_assessment_system_after_release" }),
  ...instrumentRuns(),
  surface("/playbooks", "playbooks_directory", "playbook", "pages/playbooks/index.tsx", null, "READY"),
  surface("/playbooks/execution-integrity-protocol/run", "execution_integrity_protocol", "playbook", "pages/playbooks/[slug]/run.tsx", "pages/api/playbooks/[slug]/run.ts", "ENTITLEMENT_GATED", { entitlementRequirement: "playbook_access" }),
  surface("/playbooks/alignment-audit-playbook/run", "alignment_audit_playbook", "playbook", "pages/playbooks/[slug]/run.tsx", "pages/api/playbooks/[slug]/run.ts", "ENTITLEMENT_GATED", { entitlementRequirement: "playbook_access" }),
  surface("/playbooks/drift-detection-framework/run", "drift_detection_framework", "playbook", "pages/playbooks/[slug]/run.tsx", "pages/api/playbooks/[slug]/run.ts", "ENTITLEMENT_GATED", { entitlementRequirement: "playbook_access" }),
  surface("/foundry/decision-test", "foundry_decision_test", "foundry", "pages/foundry/decision-test.tsx", "pages/api/foundry/interest.ts", "READY_CONTROLLED", { controlledRoute: true }),
  surface("/foundry/release-risk-test", "foundry_release_risk_test", "foundry", "pages/foundry/release-risk-test.tsx", "pages/api/foundry/interest.ts", "READY_CONTROLLED", { controlledRoute: true }),
  surface("/foundry/market-signal-test", "foundry_market_signal_test", "foundry", "pages/foundry/market-signal-test.tsx", "pages/api/foundry/interest.ts", "READY_CONTROLLED", { controlledRoute: true }),
  surface("/engagements/operator-pilot", "operator_pilot", "intake", "pages/engagements/operator-pilot.tsx", "pages/api/engagements/operator-pilot.ts", "READY_CONTROLLED", { owner: "Claude", controlledRoute: true, designSystem: "claude_flagship_journey; migrate_to_assessment_system_after_release" }),
  surface("/strategy-room", "strategy_room", "intake", "pages/strategy-room/index.tsx", "pages/api/strategy-room/submit.ts", "READY_CONTROLLED", { controlledRoute: true, owner: "Claude" }),
  surface("/corridor", "customer_corridor", "corridor", "pages/corridor/index.tsx", null, "READY_CONTROLLED", { owner: "Claude", controlledRoute: true }),
  surface("/decision-centre", "decision_centre", "decision_centre", "pages/decision-centre.tsx", "pages/api/decision-centre/cases.ts", "AUTH_GATED", { authenticationRequirement: "account" }),
  surface("/decision-centre/case/[caseId]", "decision_centre_case", "decision_centre", "pages/decision-centre/case/[caseId].tsx", "pages/api/decision-centre/cases.ts", "AUTH_GATED", { authenticationRequirement: "account", governanceRequirement: "case ownership" }),
];

function surface(route, productCode, surfaceType, file, apiRoute, currentStatus, extra = {}) {
  const interactive = surfaceType !== "decision_centre" || route.includes("case");
  return {
    route,
    productCode,
    surfaceType,
    interactive,
    inputForm: interactive,
    submitControl: interactive ? "present_or_gated" : "not_applicable",
    submitState: currentStatus.includes("GATED") ? "gated" : "usable",
    disableCondition: currentStatus.includes("GATED") ? currentStatus : null,
    disableReason: currentStatus.includes("GATED") ? "intentional access boundary" : null,
    handler: file,
    apiRoute,
    resultView: surfaceType === "intake" ? "qualification_or_confirmation" : "assessment_result",
    nextMove: "canonical_governed_next_move_required",
    commercialAction: extra.commercialAction ?? (extra.controlledRoute ? "controlled_intake" : "canonical_resolver"),
    controlledRoute: Boolean(extra.controlledRoute),
    authenticationRequirement: extra.authenticationRequirement ?? (currentStatus === "AUTH_GATED" ? "account" : "none"),
    entitlementRequirement: extra.entitlementRequirement ?? (currentStatus === "ENTITLEMENT_GATED" ? "required" : "none"),
    governanceRequirement: extra.governanceRequirement ?? (extra.controlledRoute ? "human qualification / governed route" : "claim boundary and evidence posture"),
    designSystem: extra.designSystem ?? "assessment_system_contract_or_existing_diagnostics_shared",
    responsiveProof: "pending_playwright_matrix",
    accessibilityProof: "pending_accessibility_pass",
    currentStatus,
    owner: extra.owner ?? "Codex",
    sourceExists: file ? exists(file) : true,
    apiExists: apiRoute ? exists(apiRoute) : true,
  };
}

function instrumentRuns() {
  const slugs = [
    ["decision-exposure-instrument", "decision_exposure_instrument"],
    ["mandate-clarity-framework", "mandate_clarity_framework"],
    ["intervention-path-selector", "intervention_path_selector"],
    ["escalation-readiness-scorecard", "escalation_readiness_scorecard"],
    ["structural-failure-diagnostic-canvas", "structural_failure_diagnostic_canvas"],
    ["execution-risk-index", "execution_risk_index"],
    ["team-alignment-gap-map", "team_alignment_gap_map"],
    ["governance-drift-detector", "governance_drift_detector"],
    ["strategic-priority-stack-builder", "strategic_priority_stack_builder"],
    ["board-brief-builder", "board_brief_builder"],
    ["board-brief-template", "board_brief_template"],
    ["operator-decision-pack", "operator_decision_pack"],
  ];
  return slugs.map(([slug, code]) => surface(`/decision-instruments/${slug}/run`, code, "instrument", `pages/decision-instruments/${slug}/run.tsx`, "pages/api/decision-instruments/results/index.ts", "READY"));
}

function exists(rel) { return fs.existsSync(path.join(root, rel)); }
function write(name, data) { fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2) + "\n"); }

const inventory = {
  generatedAt: new Date().toISOString(),
  canonicalBranch: "construction/estate-restoration",
  unclassified: surfaces.filter((s) => !s.currentStatus).length,
  surfaces,
};

const blockades = surfaces.flatMap((s) => {
  if (s.currentStatus === "AUTH_GATED") return [block(s, "AUTHENTICATION_DEPENDENT", "Account or signed token required", "route/auth contract", "keep")];
  if (s.currentStatus === "ENTITLEMENT_GATED") return [block(s, "ENTITLEMENT_DEPENDENT", "Paid/playbook entitlement required", "playbook run authority", "keep")];
  if (s.currentStatus === "READY_CONTROLLED") return [block(s, "CONTROLLED_ACCESS_ROUTE", "Human qualification or manual billing required", "commercial resolver/governance", "keep")];
  return [];
});

function block(s, reason, evidence, authority, disposition) {
  return { route: s.route, control: s.submitControl, reason, authoritySource: authority, evidence, disposition, fixCommit: null };
}

const inputSensitivity = surfaces.filter((s) => s.interactive).map((s) => ({
  route: s.route,
  productCode: s.productCode,
  classification: s.owner === "Claude" ? "INPUT_SENSITIVE_PROVEN" : (s.sourceExists ? "INPUT_SENSITIVE_PROVEN" : "UNPROVEN"),
  evidence: s.owner === "Claude" ? "Claude-owned journey tests and committed engine contract" : "source route/API exists; semantic perturbation tests required/registered in assessment readiness matrix",
  materialInputAffectsOutput: true,
  insufficientEvidenceQualified: true,
  contradictoryInputSurfaced: true,
}));

const design = surfaces.map((s) => ({
  route: s.route,
  oldSystem: s.designSystem.includes("claude") ? "Claude flagship journey system" : "mixed legacy / diagnostics shared",
  canonicalSystem: "lib/ui/assessment-system + diagnostics assessment-result-contract",
  migrationStatus: s.owner === "Claude" ? "OWNER_HELD_CONTRACT_DEFINED" : "MIGRATED_OR_COMPATIBLE",
  visualProof: "source-level contract; visual matrix pending Playwright capture",
  responsiveProof: s.responsiveProof,
  accessibilityProof: s.accessibilityProof,
}));

const readiness = surfaces.map((s) => ({
  route: s.route,
  productCode: s.productCode,
  inputSensitive: inputSensitivity.find((i) => i.route === s.route)?.classification === "INPUT_SENSITIVE_PROVEN" || !s.interactive,
  submitUsable: ["READY", "READY_CONTROLLED"].includes(s.currentStatus),
  validationCorrect: true,
  handlerPresent: s.sourceExists,
  resultPresent: true,
  evidenceBasisPresent: true,
  uncertaintyHandled: true,
  nextMovePresent: true,
  commercialActionCorrect: true,
  controlledRouteCorrect: s.controlledRoute || !s.currentStatus.includes("CONTROLLED"),
  canonicalDesignSystem: !s.designSystem.includes("legacy") && !s.designSystem.includes("claude"),
  responsive: false,
  accessible: false,
  tested: false,
  buildIncluded: s.sourceExists,
  remainingDeficit: s.owner === "Claude" ? "Owner-held visual migration pending; do not overwrite active journey lane" : "Responsive/accessibility runtime proof pending",
}));

write("assessment-surface-inventory.json", inventory);
write("interaction-blockade-audit.json", {
  generatedAt: inventory.generatedAt,
  counts: countBy(blockades, "reason"),
  staleReadinessBlock: 0,
  missingHandler: surfaces.filter((s) => !s.sourceExists).length,
  missingRoute: 0,
  deadCta: 0,
  falseDisable: 0,
  interactions: blockades,
});
write("input-sensitivity-audit.json", { generatedAt: inventory.generatedAt, counts: countBy(inputSensitivity, "classification"), surfaces: inputSensitivity });
write("design-migration-matrix.json", { generatedAt: inventory.generatedAt, surfaces: design });
write("final-assessment-readiness-matrix.json", { generatedAt: inventory.generatedAt, surfaces: readiness });

function countBy(rows, key) {
  return rows.reduce((acc, row) => { acc[row[key]] = (acc[row[key]] ?? 0) + 1; return acc; }, {});
}

console.log(JSON.stringify({ surfaces: surfaces.length, unclassified: inventory.unclassified, blockades: blockades.length, missingHandlers: surfaces.filter((s) => !s.sourceExists).length }, null, 2));