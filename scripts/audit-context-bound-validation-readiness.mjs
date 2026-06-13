#!/usr/bin/env node

/**
 * Audit Context-Bound Validation Readiness
 *
 * Classifies products as either:
 * - isolated_product_validation (can be tested independently)
 * - context_bound_ladder_validation (requires upstream context)
 *
 * Determines which products need full-flow validation vs isolated testing.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const TIER_1_PRODUCTS = [
  { code: 'executive_reporting', isLadderTerminal: true, upstreamDeps: ['constitutional-diagnostic', 'decision-kernel', 'evidence-graph-builder'] },
  { code: 'enterprise_assessment', isLadderTerminal: false, upstreamDeps: [] },
  { code: 'team_assessment', isLadderTerminal: false, upstreamDeps: [] },
  { code: 'board_brief_builder', isLadderTerminal: false, upstreamDeps: [] },
  { code: 'boardroom_brief', isLadderTerminal: false, upstreamDeps: [] },
];

function log(msg) {
  console.log(`[AUDIT] ${msg}`);
}

function classifyProduct(product) {
  const { code, isLadderTerminal, upstreamDeps } = product;

  const classification = {
    productCode: code,
    validationMode: isLadderTerminal
      ? 'context_bound_ladder_validation'
      : 'isolated_product_validation',
    isLadderTerminal,
    canValidateInIsolation: !isLadderTerminal && upstreamDeps.length === 0,
    canGrantAuthorityFromSyntheticContext: !isLadderTerminal || upstreamDeps.length === 0,
    contextDependencies: upstreamDeps,
    contextDependencyStatus: isLadderTerminal ? 'unmapped' : 'not_applicable',
    authorityGrantEligible: isLadderTerminal
      ? 'blocked_until_full_flow_complete'
      : 'eligible_from_isolated_validation',
    blockingReasons: isLadderTerminal
      ? [
        'Product is ladder-terminal node',
        'Requires upstream context for valid execution',
        'Isolated testing cannot establish authority',
        'Full ladder flow validation required',
      ]
      : [],
    validationPath: isLadderTerminal
      ? ['upstream_diagnostics', 'decision_object', 'evidence_graph', 'executive_reporting']
      : [code],
  };

  return classification;
}

async function main() {
  log('='.repeat(60));
  log('Context-Bound Validation Readiness Audit');
  log('='.repeat(60));

  const results = {
    auditDate: new Date().toISOString(),
    productsAudited: TIER_1_PRODUCTS.length,
    classifications: [],
    summary: {
      isolated_validation_count: 0,
      context_bound_count: 0,
      full_flow_required: [],
    },
  };

  log(`\nAuditing ${TIER_1_PRODUCTS.length} Tier 1 products...\n`);

  for (const product of TIER_1_PRODUCTS) {
    const classification = classifyProduct(product);
    results.classifications.push(classification);

    const mode = classification.validationMode;
    const status = classification.canValidateInIsolation ? '✓ ISOLATED' : '⚠ LADDER-DEPENDENT';

    log(`${product.code.padEnd(25)} → ${mode.padEnd(35)} ${status}`);

    if (mode === 'context_bound_ladder_validation') {
      results.summary.context_bound_count++;
      results.summary.full_flow_required.push(product.code);
    } else {
      results.summary.isolated_validation_count++;
    }
  }

  log(`\n${'='.repeat(60)}`);
  log(`Summary:`);
  log(`  Isolated Validation: ${results.summary.isolated_validation_count}`);
  log(`  Context-Bound (Full-Flow): ${results.summary.context_bound_count}`);
  log(`  Products Requiring Full-Flow: ${results.summary.full_flow_required.join(', ')}`);
  log(`${'='.repeat(60)}\n`);

  // Write JSON report
  const reportPath = path.resolve(projectRoot, 'reports/context-bound-validation-readiness.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log(`Report written to: ${reportPath}`);

  // Write Markdown report
  let mdReport = `# Context-Bound Validation Readiness Audit\n\n`;
  mdReport += `**Date:** ${results.auditDate}\n\n`;
  mdReport += `## Summary\n\n`;
  mdReport += `| Classification | Count | Products |\n`;
  mdReport += `|---|---|---|\n`;
  mdReport += `| Isolated Validation | ${results.summary.isolated_validation_count} | ${
    results.classifications
      .filter((c) => c.canValidateInIsolation)
      .map((c) => c.productCode)
      .join(', ') || 'none'
  } |\n`;
  mdReport += `| Context-Bound (Full-Flow Required) | ${results.summary.context_bound_count} | ${results.summary.full_flow_required.join(', ')} |\n\n`;

  mdReport += `## Detailed Classifications\n\n`;

  for (const classification of results.classifications) {
    mdReport += `### ${classification.productCode}\n\n`;
    mdReport += `**Validation Mode:** ${classification.validationMode}\n\n`;
    mdReport += `**Can Validate in Isolation:** ${classification.canValidateInIsolation ? 'YES' : 'NO'}\n\n`;
    mdReport += `**Can Grant Authority from Synthetic Context:** ${classification.canGrantAuthorityFromSyntheticContext ? 'YES' : 'NO'}\n\n`;

    if (classification.contextDependencies.length > 0) {
      mdReport += `**Upstream Dependencies:**\n`;
      mdReport += classification.contextDependencies.map((d) => `- ${d}`).join('\n');
      mdReport += `\n\n`;
    }

    if (classification.blockingReasons.length > 0) {
      mdReport += `**Blocking Reasons:**\n`;
      mdReport += classification.blockingReasons.map((r) => `- ${r}`).join('\n');
      mdReport += `\n\n`;
    }

    mdReport += `**Authority Grant Eligible:** ${classification.authorityGrantEligible}\n\n`;
  }

  const mdPath = path.resolve(projectRoot, 'reports/context-bound-validation-readiness.md');
  fs.writeFileSync(mdPath, mdReport);
  log(`Markdown report written to: ${mdPath}\n`);

  log(`✓ Audit Complete`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});
