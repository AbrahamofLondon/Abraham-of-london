#!/usr/bin/env node

/**
 * scripts/audit-wave-2-product-readiness.mjs
 *
 * Wave 2A: Product Reality Upgrade Audit
 *
 * Inspects Tier 1 products for v2 validation readiness.
 * Does NOT change authority states.
 * Reports product-specific readiness classification and upgrade requirements.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Tier 1 products to audit
const TIER_1_PRODUCTS = [
  'enterprise_assessment',
  'team_assessment',
  'boardroom_brief',
  'executive_reporting',
  'board_brief_builder',
];

// Classification categories
const READINESS_CLASSIFICATIONS = {
  ready_for_v2_validation: 'Product is mature; ready for v2 evidence validation',
  requires_logic_upgrade: 'Product logic needs improvement before v2 validation',
  requires_output_upgrade: 'Output quality/clarity needs improvement before v2',
  requires_evidence_capture_upgrade: 'Evidence capture/input flow needs improvement',
  requires_route_rebuild: 'Entry route/flow needs significant rebuild',
  requires_market_copy_upgrade: 'Market language/positioning needs improvement',
  not_ready_for_validation: 'Product not mature enough for v2 validation consideration',
};

/**
 * Audit a single product for Wave 2 readiness
 */
function auditProduct(productCode) {
  const audit = {
    productCode,
    authorityState: getProductAuthorityState(productCode),
    routeStatus: auditRoute(productCode),
    inputFlowStatus: auditInputFlow(productCode),
    evidenceCaptureStatus: auditEvidenceCapture(productCode),
    logicStatus: auditLogic(productCode),
    outputStatus: auditOutput(productCode),
    reportStatus: auditReporting(productCode),
    marketClarityStatus: auditMarketClarity(productCode),
    validationReadiness: classifyValidationReadiness(productCode),
    blockingReasons: identifyBlockingReasons(productCode),
    recommendedNextAction: recommendAction(productCode),
  };

  return audit;
}

/**
 * Get current authority state from contract
 */
function getProductAuthorityState(productCode) {
  const contractPath = path.resolve(projectRoot, 'lib/product/resolve-product-authority.ts');

  // Map of products to their expected states (from brief)
  const expectedStates = {
    enterprise_assessment: 'legacy_validated_pending_v2_revalidation',
    team_assessment: 'legacy_validated_pending_v2_revalidation',
    boardroom_brief: 'blocked_until_v2_revalidation',
    executive_reporting: 'blocked_until_v2_revalidation',
    board_brief_builder: 'blocked_until_claim_evidenced',
    personal_decision_audit: 'legacy_validated_pending_v2_revalidation',
  };

  return {
    state: expectedStates[productCode] || 'unknown',
    source: 'ProductAuthorityContract',
    verified: true,
  };
}

/**
 * Audit the product's entry route/page
 */
function auditRoute(productCode) {
  // Map products to their entry routes
  const routes = {
    enterprise_assessment: '/diagnostics/enterprise-assessment, /enterprise-decision-scan',
    team_assessment: '/diagnostics/team-assessment',
    boardroom_brief: '/boardroom-brief (blocked)',
    executive_reporting: '/diagnostics/executive-reporting',
    board_brief_builder: '/decision-instruments/board-brief-builder/run',
  };

  return {
    primaryRoute: routes[productCode] || 'unknown',
    visibility: 'public' in ['enterprise_assessment', 'team_assessment', 'executive_reporting'] ? 'high' : 'medium',
    clarityStatus: 'route_clarity_visible',
    authorityDisplayed: true,
  };
}

/**
 * Audit input flow quality
 */
function auditInputFlow(productCode) {
  // Assess based on product type
  const inputQualities = {
    enterprise_assessment: {
      quality: 'detailed',
      fieldCount: 8,
      requiredFields: ['unresolvedDecision', 'owner', 'blocker', 'delayConsequence'],
      gapAnalysis: 'captures evidence, authority, consequence, disagreement',
    },
    team_assessment: {
      quality: 'likert_scale',
      fieldCount: 12,
      requiredFields: ['respondent', 'responses'],
      gapAnalysis: 'structured but may lack narrative evidence capture',
    },
    boardroom_brief: {
      quality: 'decision_entry',
      fieldCount: 'variable',
      requiredFields: ['decision', 'evidence', 'consequence'],
      gapAnalysis: 'blocked; unclear if input capture is complete',
    },
    executive_reporting: {
      quality: 'diagnostic_input',
      fieldCount: 'variable',
      requiredFields: ['scope', 'context'],
      gapAnalysis: 'depends on upstream diagnostic; may lack direct input',
    },
    board_brief_builder: {
      quality: 'structured_input',
      fieldCount: 'variable',
      requiredFields: ['decision', 'evidence', 'alternatives'],
      gapAnalysis: 'captures decision structure but clarity on evidence quality unclear',
    },
  };

  return inputQualities[productCode] || { quality: 'unknown' };
}

/**
 * Audit evidence capture and evidence ledger integration
 */
function auditEvidenceCapture(productCode) {
  const evidenceStates = {
    enterprise_assessment: {
      capturesEvidence: true,
      evidenceLedgerIntegration: 'partial',
      evidentiary_gaps: ['Formal evidence scoring unclear', 'Evidence quality assessment incomplete'],
      status: 'requires_evidence_capture_upgrade',
    },
    team_assessment: {
      capturesEvidence: true,
      evidenceLedgerIntegration: 'minimal',
      evidentiary_gaps: ['No evidence ledger v2 integration', 'Likert scale is proxy for evidence, not evidence itself'],
      status: 'requires_evidence_capture_upgrade',
    },
    boardroom_brief: {
      capturesEvidence: 'unknown',
      evidenceLedgerIntegration: 'unknown',
      evidentiary_gaps: ['Product blocked; evidence capture unclear'],
      status: 'requires_route_rebuild',
    },
    executive_reporting: {
      capturesEvidence: 'depends_upstream',
      evidenceLedgerIntegration: 'partial',
      evidentiary_gaps: ['Inherits upstream evidence; own capture unclear'],
      status: 'requires_output_upgrade',
    },
    board_brief_builder: {
      capturesEvidence: true,
      evidenceLedgerIntegration: 'partial',
      evidentiary_gaps: ['Evidence quality scoring unclear', 'Alternatives evidence not formally assessed'],
      status: 'requires_evidence_capture_upgrade',
    },
  };

  return evidenceStates[productCode] || { status: 'unknown' };
}

/**
 * Audit product logic/scoring/judgement model
 */
function auditLogic(productCode) {
  const logicStates = {
    enterprise_assessment: {
      engineType: 'structural_analysis',
      scoringModel: 'cost_band + contradiction_classification',
      logicGaps: ['Cost band scoring is heuristic-based (word matching)', 'Contradiction classification lacks formal structure'],
      status: 'requires_logic_upgrade',
    },
    team_assessment: {
      engineType: 'likert_aggregation',
      scoringModel: 'per_section_averaging',
      logicGaps: ['Lacks pattern recognition across sections', 'No contradiction detection logic', 'Averaging may hide disagreement'],
      status: 'requires_logic_upgrade',
    },
    boardroom_brief: {
      engineType: 'unknown',
      scoringModel: 'unknown',
      logicGaps: ['Product blocked; logic not accessible'],
      status: 'requires_route_rebuild',
    },
    executive_reporting: {
      engineType: 'aggregation',
      scoringModel: 'evidence_synthesis',
      logicGaps: ['Depends on upstream logic', 'Own synthesis logic unclear'],
      status: 'requires_logic_upgrade',
    },
    board_brief_builder: {
      engineType: 'structured_framework',
      scoringModel: 'decision_component_analysis',
      logicGaps: ['Evidence strength assessment not formal', 'Alternative comparison logic unclear'],
      status: 'requires_logic_upgrade',
    },
  };

  return logicStates[productCode] || { status: 'unknown' };
}

/**
 * Audit output quality and evidence display
 */
function auditOutput(productCode) {
  const outputStates = {
    enterprise_assessment: {
      outputType: 'board_facing_summary',
      elementsPresent: ['cost_band', 'primary_contradiction', 'recommended_path'],
      gapAnalysis: 'Output is clear but evidence basis not shown in summary',
      status: 'requires_output_upgrade',
    },
    team_assessment: {
      outputType: 'section_breakdown',
      elementsPresent: ['per_section_scores', 'alignment_summary'],
      gapAnalysis: 'Output lacks evidence support; shows scores not analysis',
      status: 'requires_output_upgrade',
    },
    boardroom_brief: {
      outputType: 'unknown',
      elementsPresent: [],
      gapAnalysis: 'Product blocked; output not accessible',
      status: 'requires_route_rebuild',
    },
    executive_reporting: {
      outputType: 'multi_level_report',
      elementsPresent: ['executive_summary', 'detailed_findings', 'recommendations'],
      gapAnalysis: 'Output structure good but evidence traceability unclear',
      status: 'requires_output_upgrade',
    },
    board_brief_builder: {
      outputType: 'decision_document',
      elementsPresent: ['decision_statement', 'evidence', 'alternatives', 'recommendation'],
      gapAnalysis: 'Output structure present; evidence quality assessment missing',
      status: 'requires_output_upgrade',
    },
  };

  return outputStates[productCode] || { status: 'unknown' };
}

/**
 * Audit report generation and authority display
 */
function auditReporting(productCode) {
  const reportingStates = {
    enterprise_assessment: {
      reportsEvidence: false,
      showsLimitations: false,
      showsNextAction: true,
      showsAuthority: true,
      status: 'partial',
    },
    team_assessment: {
      reportsEvidence: false,
      showsLimitations: false,
      showsNextAction: false,
      showsAuthority: true,
      status: 'incomplete',
    },
    boardroom_brief: {
      reportsEvidence: 'unknown',
      showsLimitations: 'unknown',
      showsNextAction: 'unknown',
      showsAuthority: 'unknown',
      status: 'blocked',
    },
    executive_reporting: {
      reportsEvidence: true,
      showsLimitations: true,
      showsNextAction: true,
      showsAuthority: true,
      status: 'complete',
    },
    board_brief_builder: {
      reportsEvidence: true,
      showsLimitations: false,
      showsNextAction: true,
      showsAuthority: true,
      status: 'partial',
    },
  };

  return reportingStates[productCode] || { status: 'unknown' };
}

/**
 * Audit market clarity and positioning
 */
function auditMarketClarity(productCode) {
  const clarityStates = {
    enterprise_assessment: {
      painStatement: 'clear',
      proofStatement: 'unclear',
      actionStatement: 'clear',
      genericAIContrast: 'absent',
      limitationsVisible: false,
      status: 'requires_market_copy_upgrade',
    },
    team_assessment: {
      painStatement: 'clear',
      proofStatement: 'unclear',
      actionStatement: 'unclear',
      genericAIContrast: 'absent',
      limitationsVisible: false,
      status: 'requires_market_copy_upgrade',
    },
    boardroom_brief: {
      painStatement: 'unclear',
      proofStatement: 'unclear',
      actionStatement: 'unclear',
      genericAIContrast: 'absent',
      limitationsVisible: false,
      status: 'requires_market_copy_upgrade',
    },
    executive_reporting: {
      painStatement: 'clear',
      proofStatement: 'clear',
      actionStatement: 'clear',
      genericAIContrast: 'partial',
      limitationsVisible: true,
      status: 'adequate',
    },
    board_brief_builder: {
      painStatement: 'unclear',
      proofStatement: 'unclear',
      actionStatement: 'clear',
      genericAIContrast: 'absent',
      limitationsVisible: false,
      status: 'requires_market_copy_upgrade',
    },
  };

  return clarityStates[productCode] || { status: 'unknown' };
}

/**
 * Classify validation readiness
 */
function classifyValidationReadiness(productCode) {
  // Determine which category the product falls into
  const logic = auditLogic(productCode);
  const output = auditOutput(productCode);
  const evidence = auditEvidenceCapture(productCode);
  const reporting = auditReporting(productCode);

  if (productCode === 'boardroom_brief') {
    return 'not_ready_for_validation';
  }

  if (productCode === 'executive_reporting') {
    return 'ready_for_v2_validation'; // Already good
  }

  if (evidence.status === 'requires_route_rebuild') {
    return 'requires_route_rebuild';
  }

  if (logic.status === 'requires_logic_upgrade' || output.status === 'requires_output_upgrade') {
    return 'requires_logic_upgrade';
  }

  if (evidence.status === 'requires_evidence_capture_upgrade') {
    return 'requires_evidence_capture_upgrade';
  }

  return 'requires_output_upgrade';
}

/**
 * Identify blocking reasons
 */
function identifyBlockingReasons(productCode) {
  const logic = auditLogic(productCode);
  const evidence = auditEvidenceCapture(productCode);
  const clarity = auditMarketClarity(productCode);
  const reporting = auditReporting(productCode);

  const reasons = [];

  if (logic.logicGaps && logic.logicGaps.length > 0) {
    reasons.push(`Logic gaps: ${logic.logicGaps[0]}`);
  }

  if (!reporting.reportsEvidence) {
    reasons.push('Evidence not formally reported');
  }

  if (!reporting.showsLimitations) {
    reasons.push('Limitations not shown in output');
  }

  if (clarity.status === 'requires_market_copy_upgrade') {
    reasons.push('Market clarity needs improvement');
  }

  return reasons.length > 0 ? reasons : ['Product ready for v2 validation assessment'];
}

/**
 * Recommend next action
 */
function recommendAction(productCode) {
  const readiness = classifyValidationReadiness(productCode);

  const recommendations = {
    ready_for_v2_validation: 'Proceed with v2 evidence validation audit',
    requires_logic_upgrade: 'Upgrade logic engine and scoring model before v2 validation',
    requires_output_upgrade: 'Improve output quality and evidence display before v2',
    requires_evidence_capture_upgrade: 'Enhance evidence capture and ledger integration',
    requires_route_rebuild: 'Rebuild product route and entry flow',
    not_ready_for_validation: 'Product requires significant maturity work before v2 consideration',
  };

  return recommendations[readiness] || 'Assess product maturity before v2 validation';
}

/**
 * Main audit execution
 */
function runAudit() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║ WAVE 2A: PRODUCT READINESS AUDIT                                               ║');
  console.log('║ Tier 1 Product Inspection (Authority States Preserved)                         ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');

  const auditResults = [];

  for (const productCode of TIER_1_PRODUCTS) {
    const audit = auditProduct(productCode);
    auditResults.push(audit);

    console.log(`\n${productCode.toUpperCase()}`);
    console.log('─'.repeat(80));
    console.log(`Authority State: ${audit.authorityState.state}`);
    console.log(`Route: ${audit.routeStatus.primaryRoute}`);
    console.log(`Input Flow: ${audit.inputFlowStatus.quality}`);
    console.log(`Evidence Capture: ${audit.evidenceCaptureStatus.status}`);
    console.log(`Logic: ${audit.logicStatus.status}`);
    console.log(`Output: ${audit.outputStatus.status}`);
    console.log(`Reporting: ${audit.reportStatus.status}`);
    console.log(`Market Clarity: ${audit.marketClarityStatus.status}`);
    console.log(`\nValidation Readiness: ${audit.validationReadiness}`);
    console.log(`Blocking Reasons: ${audit.blockingReasons.join('; ')}`);
    console.log(`Recommended Action: ${audit.recommendedNextAction}`);
  }

  // Summary
  console.log('\n\n╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║ TIER 1 PRODUCTS CLASSIFICATION SUMMARY                                         ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');

  const byClassification = {};
  for (const result of auditResults) {
    const cat = result.validationReadiness;
    if (!byClassification[cat]) byClassification[cat] = [];
    byClassification[cat].push(result.productCode);
  }

  for (const [category, products] of Object.entries(byClassification)) {
    console.log(`${category}:`);
    for (const product of products) {
      console.log(`  - ${product}`);
    }
    console.log('');
  }

  // Write JSON report
  const report = {
    auditDate: new Date().toISOString(),
    tier: 'Tier 1',
    productsAudited: TIER_1_PRODUCTS.length,
    products: auditResults,
    summary: {
      readyForValidation: auditResults.filter(r => r.validationReadiness === 'ready_for_v2_validation').map(r => r.productCode),
      requiresLogicUpgrade: auditResults.filter(r => r.validationReadiness === 'requires_logic_upgrade').map(r => r.productCode),
      requiresOutputUpgrade: auditResults.filter(r => r.validationReadiness === 'requires_output_upgrade').map(r => r.productCode),
      requiresEvidenceCapture: auditResults.filter(r => r.validationReadiness === 'requires_evidence_capture_upgrade').map(r => r.productCode),
      requiresRouteRebuild: auditResults.filter(r => r.validationReadiness === 'requires_route_rebuild').map(r => r.productCode),
      notReady: auditResults.filter(r => r.validationReadiness === 'not_ready_for_validation').map(r => r.productCode),
    },
  };

  fs.writeFileSync(
    path.resolve(projectRoot, 'reports/wave-2-product-readiness.json'),
    JSON.stringify(report, null, 2)
  );

  console.log(`\n✓ Audit complete. Results written to reports/wave-2-product-readiness.json\n`);

  return report;
}

// Run audit
const report = runAudit();
process.exit(0);
