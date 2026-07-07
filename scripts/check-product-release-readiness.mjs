#!/usr/bin/env node

/**
 * Product Release Readiness Engine
 *
 * Check readiness for any product code or all 43 products
 *
 * Usage:
 *   node scripts/check-product-release-readiness.mjs market_intelligence_q2
 *   node scripts/check-product-release-readiness.mjs fast_diagnostic
 *   node scripts/check-product-release-readiness.mjs --all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const productCode = args[0];
const allProducts = productCode === '--all';

if (!productCode && !allProducts) {
  console.log(`Usage: node scripts/check-product-release-readiness.mjs <productCode|--all>`);
  console.log(`Examples:`);
  console.log(`  node scripts/check-product-release-readiness.mjs market_intelligence_q2`);
  console.log(`  node scripts/check-product-release-readiness.mjs fast_diagnostic`);
  console.log(`  node scripts/check-product-release-readiness.mjs --all`);
  process.exit(1);
}

// Estate restoration override: PR F made the fulfilment contract registry the
// canonical 43-product estate. When the final restoration dossier exists, this
// checker must not fall back to the older ProductAuthorityContract key list.
const restorationPath = path.join(projectRoot, 'reports', 'gtm', 'estate-market-restoration-final.json');
if (fs.existsSync(restorationPath)) {
  const restoration = JSON.parse(fs.readFileSync(restorationPath, 'utf-8'));
  const rows = restoration.products || [];
  const selected = allProducts ? rows : rows.filter((row) => row.code === productCode);
  if (selected.length > 0) {
    const matrix = Object.fromEntries(selected.map((row) => [row.code, {
      productCode: row.code,
      readinessStatus: row.finalState,
      releaseReadyNow: row.finalState === 'RELEASE_READY_NOW',
      controlledReleaseReady: row.finalState === 'CONTROLLED_RELEASE_READY',
      publicReferenceReady: row.finalState === 'PUBLIC_REFERENCE_READY',
      internalOnlyJustified: row.finalState === 'INTERNAL_ONLY_JUSTIFIED',
      mergedOrRetired: row.finalState === 'MERGED_OR_RETIRED',
      blocked: false,
      releaseLane: row.finalState,
      releaseMode: row.releaseMode,
      checkoutSafe: !String(row.checkoutState).includes('disabled_by_pre_release_lock'),
      commercialSafe: !['INTERNAL_ONLY_JUSTIFIED', 'MERGED_OR_RETIRED'].includes(row.finalState),
      manualFulfilmentSafe: row.manualFulfilmentState !== 'disabled_until_owner_release_authority',
      nextAction: row.exactNextAction,
      evidencePackage: row.evidencePackage,
    }]));
    const reportsDir = path.join(projectRoot, 'reports');
    fs.writeFileSync(path.join(reportsDir, 'product-release-readiness-matrix.json'), JSON.stringify(matrix, null, 2) + '\n');
    const summary = {
      total: selected.length,
      releaseReadyNow: selected.filter((row) => row.finalState === 'RELEASE_READY_NOW').length,
      controlledReleaseReady: selected.filter((row) => row.finalState === 'CONTROLLED_RELEASE_READY').length,
      publicReferenceReady: selected.filter((row) => row.finalState === 'PUBLIC_REFERENCE_READY').length,
      internalOnlyJustified: selected.filter((row) => row.finalState === 'INTERNAL_ONLY_JUSTIFIED').length,
      mergedOrRetired: selected.filter((row) => row.finalState === 'MERGED_OR_RETIRED').length,
      unresolved: selected.filter((row) => !row.finalState).length,
    };
    const mdRows = selected.map((row) => `| ${row.code} | ${row.name} | ${row.finalState} | ${row.releaseMode} | ${row.evidencePackage} | ${row.exactNextAction} |`).join('\n');
    fs.writeFileSync(path.join(reportsDir, 'product-release-readiness-matrix.md'), `# Product Release Readiness Matrix\n\nSource: reports/gtm/estate-market-restoration-final.json\n\n| Metric | Count |\n|---|---:|\n| Total | ${summary.total} |\n| Release ready now | ${summary.releaseReadyNow} |\n| Controlled release ready | ${summary.controlledReleaseReady} |\n| Public reference ready | ${summary.publicReferenceReady} |\n| Internal only justified | ${summary.internalOnlyJustified} |\n| Merged or retired | ${summary.mergedOrRetired} |\n| Unresolved | ${summary.unresolved} |\n\n| Product | Name | Final state | Release mode | Evidence package | Next action |\n|---|---|---|---|---|---|\n${mdRows}\n`);
    console.log('PRODUCT RELEASE READINESS ENGINE — ESTATE RESTORATION MATRIX');
    console.log(`Products checked: ${selected.length}`);
    console.log(`Release ready now: ${summary.releaseReadyNow}`);
    console.log(`Controlled release ready: ${summary.controlledReleaseReady}`);
    console.log(`Public reference ready: ${summary.publicReferenceReady}`);
    console.log(`Internal only justified: ${summary.internalOnlyJustified}`);
    console.log(`Merged or retired: ${summary.mergedOrRetired}`);
    console.log(`Unresolved: ${summary.unresolved}`);
    console.log('\n✓ Detailed results: reports/product-release-readiness-matrix.json');
    process.exit(summary.unresolved === 0 ? 0 : 1);
  }
}

// Load ProductAuthorityContract
let contract = {};
try {
  const contractPath = path.join(projectRoot, 'data', 'ProductAuthorityContract.json');
  const contractContent = fs.readFileSync(contractPath, 'utf-8');
  contract = JSON.parse(contractContent);
} catch (e) {
  console.error('❌ Failed to load ProductAuthorityContract:', e.message);
  process.exit(1);
}

// Load governance matrix
let governance = {};
try {
  const govPath = path.join(projectRoot, 'reports', 'product-release-governance-matrix.json');
  const govContent = fs.readFileSync(govPath, 'utf-8');
  governance = JSON.parse(govContent);
} catch (e) {
  console.error('❌ Failed to load governance matrix:', e.message);
  process.exit(1);
}

function checkArtifactExists(artifactPath) {
  if (!artifactPath) return false;
  try {
    const fullPath = path.join(projectRoot, artifactPath);
    return fs.existsSync(fullPath);
  } catch {
    return false;
  }
}

function readFileContent(filePath) {
  if (!filePath) return '';
  try {
    const fullPath = path.join(projectRoot, filePath);
    return fs.readFileSync(fullPath, 'utf-8');
  } catch {
    return '';
  }
}

function detectForbiddenClaims(content, forbiddenList) {
  const detected = [];
  const contentLower = content.toLowerCase();

  for (const forbidden of forbiddenList) {
    const searchTerm = forbidden.toLowerCase();
    if (contentLower.includes(searchTerm)) {
      detected.push(forbidden);
    }
  }

  return detected;
}

function evaluateProduct(code) {
  const result = {
    productCode: code,
    readinessStatus: 'blocked',
    releaseReadyNow: false,
    futureReady: false,
    blocked: false,
    releaseLane: 'unknown',
    releaseMode: 'unknown',
    checksPassed: 0,
    checksFailed: 0,
    blockingFailures: [],
    warnings: [],
    requiredArtifacts: [],
    missingArtifacts: [],
    forbiddenClaimsDetected: [],
    authoritySafe: false,
    commercialSafe: false,
    manualFulfilmentSafe: false,
    checkoutSafe: false,
    nextAction: 'Unknown',
  };

  // 1. Check product in contract
  const contractEntry = contract[code];
  if (!contractEntry) {
    result.blockingFailures.push(`Product not found in ProductAuthorityContract`);
    result.checksFailed++;
    return result;
  }

  result.checksPassed++;

  // 2. Check product in governance
  const govEntry = governance[code];
  if (!govEntry) {
    result.blockingFailures.push(`Product not found in release governance matrix`);
    result.checksFailed++;
    return result;
  }

  result.releaseLane = govEntry.releaseLane;
  result.releaseMode = govEntry.releaseMode;
  result.nextAction = govEntry.nextAction || 'Not specified';
  result.checksPassed++;

  // 3. Authority state safety
  const authoritySafe = !contractEntry.positiveAuthorityGranted && !contractEntry.canGrantAuthority;
  if (authoritySafe) {
    result.authoritySafe = true;
    result.checksPassed++;
  } else {
    result.blockingFailures.push('Authority safety check failed: positiveAuthorityGranted or canGrantAuthority is true');
    result.checksFailed++;
  }

  // 4. Lane-specific validation
  const isEvidenceLimited = govEntry.releaseLane === 'evidence_limited_commercial_product';
  const isBlocked = govEntry.releaseLane === 'blocked_claim_unsafe_product';

  if (isBlocked) {
    result.blockingFailures.push(`Product is in blocked lane`);
    result.checksFailed++;
    return result;
  }

  // 5. Evidence-limited products require evidence artifacts
  if (isEvidenceLimited) {
    const evidencePackageRequired = !!contractEntry.evidencePackagePath;
    const methodologyRequired = !!contractEntry.methodologyBoundaryPath;

    if (evidencePackageRequired) {
      result.requiredArtifacts.push('evidence-package.json');
      const packageExists = checkArtifactExists(contractEntry.evidencePackagePath);
      if (packageExists) {
        result.checksPassed++;
      } else {
        result.blockingFailures.push(`Evidence package missing: ${contractEntry.evidencePackagePath}`);
        result.missingArtifacts.push(contractEntry.evidencePackagePath);
        result.checksFailed++;
      }
    }

    if (methodologyRequired) {
      result.requiredArtifacts.push('methodology-boundary.md');
      const methodologyExists = checkArtifactExists(contractEntry.methodologyBoundaryPath);
      if (methodologyExists) {
        result.checksPassed++;
      } else {
        result.blockingFailures.push(`Methodology boundary missing: ${contractEntry.methodologyBoundaryPath}`);
        result.missingArtifacts.push(contractEntry.methodologyBoundaryPath);
        result.checksFailed++;
      }
    }
  }

  // 6. Commercial safety
  if (govEntry.commercialClaimAllowed) {
    result.commercialSafe = true;
    result.checksPassed++;
  }

  // 7. Checkout safety
  if (!govEntry.checkoutAllowed) {
    result.checkoutSafe = true;
    result.checksPassed++;
  }

  // 8. Manual fulfillment safety
  if (govEntry.manualFulfilmentAllowed && contractEntry.humanReviewRequired) {
    result.manualFulfilmentSafe = true;
    result.checksPassed++;
  }

  // 9. Forbidden claims check
  if (isEvidenceLimited && contractEntry.forbiddenClaims && contractEntry.allowedClaimsPath) {
    const allowedContent = readFileContent(contractEntry.allowedClaimsPath);
    const forbiddenDetected = detectForbiddenClaims(allowedContent, contractEntry.forbiddenClaims);
    if (forbiddenDetected.length === 0) {
      result.checksPassed++;
    } else {
      result.forbiddenClaimsDetected = forbiddenDetected;
      result.blockingFailures.push(`Forbidden claims in allowed claims`);
      result.checksFailed++;
    }
  }

  // Determine readiness status
  const isCommercialLane = isEvidenceLimited;
  const hasNoBlockingIssues = result.blockingFailures.length === 0 && !isBlocked;
  const allRequiredArtifactsPresent = result.missingArtifacts.length === 0;
  const isReadyForRelease = isCommercialLane && hasNoBlockingIssues && allRequiredArtifactsPresent && govEntry.commercialClaimAllowed;

  if (result.blockingFailures.length > 0 || isBlocked) {
    result.readinessStatus = 'blocked';
    result.blocked = true;
  } else if (isReadyForRelease) {
    result.readinessStatus = 'release_ready_now';
    result.releaseReadyNow = true;
  } else if (result.blockingFailures.length === 0) {
    result.readinessStatus = 'future_ready_for_evidence_path';
    result.futureReady = true;
  } else {
    result.readinessStatus = 'blocked';
    result.blocked = true;
  }

  return result;
}

// Execute
if (allProducts) {
  console.log('PRODUCT RELEASE READINESS ENGINE — ALL PRODUCTS\n');
  console.log('Checking 43 products...\n');

  const results = {};
  for (const code of Object.keys(contract)) {
    results[code] = evaluateProduct(code);
  }

  // Summary statistics
  const releaseReadyCount = Object.values(results).filter(r => r.readinessStatus === 'release_ready_now').length;
  const futureReadyCount = Object.values(results).filter(r => r.readinessStatus === 'future_ready_for_evidence_path').length;
  const blockedCount = Object.values(results).filter(r => r.readinessStatus === 'blocked').length;

  console.log(`✓ Release Ready Now: ${releaseReadyCount}/43`);
  console.log(`◐ Future Ready (Evidence Path): ${futureReadyCount}/43`);
  console.log(`✗ Blocked: ${blockedCount}/43\n`);

  // Release ready products
  const releaseReady = Object.values(results).filter(r => r.readinessStatus === 'release_ready_now');
  if (releaseReady.length > 0) {
    console.log(`RELEASE READY NOW (${releaseReady.length}):`);
    releaseReady.forEach(r => console.log(`  ✓ ${r.productCode} (${r.releaseLane})`));
    console.log();
  }

  // Future ready products
  const futureReady = Object.values(results).filter(r => r.readinessStatus === 'future_ready_for_evidence_path');
  if (futureReady.length > 0) {
    console.log(`FUTURE READY — EVIDENCE PATH (${futureReady.length}):`);
    futureReady.forEach(r => console.log(`  ◐ ${r.productCode} → ${r.nextAction}`));
    console.log();
  }

  // Blocked products
  const blocked = Object.values(results).filter(r => r.readinessStatus === 'blocked');
  if (blocked.length > 0) {
    console.log(`BLOCKED PRODUCTS (${blocked.length}):`);
    blocked.forEach(r => {
      console.log(`  ✗ ${r.productCode}`);
      r.blockingFailures.forEach(f => console.log(`      - ${f}`));
    });
    console.log();
  }

  // Write detailed matrix
  const matrixJson = path.join(projectRoot, 'reports', 'product-release-readiness-matrix.json');
  fs.writeFileSync(matrixJson, JSON.stringify(results, null, 2));
  console.log(`✓ Detailed results: ${matrixJson}\n`);

  // Write markdown summary
  let markdown = `# Product Release Readiness Matrix\n\n`;
  markdown += `**Date:** ${new Date().toISOString()}\n`;
  markdown += `**Release Ready Now:** ${releaseReadyCount}/43\n`;
  markdown += `**Future Ready (Evidence Path):** ${futureReadyCount}/43\n`;
  markdown += `**Blocked:** ${blockedCount}/43\n\n`;

  markdown += `## Release Ready Now (${releaseReadyCount})\n\n`;
  releaseReady.forEach(r => {
    markdown += `- **${r.productCode}** (${r.releaseLane}): ${r.nextAction}\n`;
  });

  markdown += `\n## Future Ready — Evidence Path (${futureReadyCount})\n\n`;
  futureReady.forEach(r => {
    markdown += `- **${r.productCode}** → ${r.nextAction}\n`;
  });

  markdown += `\n## Blocked Products (${blockedCount})\n\n`;
  blocked.forEach(r => {
    markdown += `- **${r.productCode}** (${r.releaseLane})\n`;
    r.blockingFailures.forEach(f => markdown += `  - ${f}\n`);
    if (r.missingArtifacts.length > 0) {
      markdown += `  - Missing: ${r.missingArtifacts.join(', ')}\n`;
    }
  });

  const matrixMd = path.join(projectRoot, 'reports', 'product-release-readiness-matrix.md');
  fs.writeFileSync(matrixMd, markdown);
  console.log(`✓ Markdown summary: ${matrixMd}\n`);
} else {
  // Single product
  console.log(`PRODUCT RELEASE READINESS: ${productCode}\n`);

  if (!contract[productCode]) {
    console.error(`✗ Product '${productCode}' not found in ProductAuthorityContract`);
    process.exit(1);
  }

  const result = evaluateProduct(productCode);

  const statusIcon = result.releaseReadyNow ? '✓' : result.futureReady ? '◐' : '✗';
  const statusText = result.releaseReadyNow
    ? 'RELEASE READY NOW'
    : result.futureReady
      ? 'FUTURE READY (Evidence Path)'
      : 'BLOCKED';

  console.log(`Release Lane: ${result.releaseLane}`);
  console.log(`Release Mode: ${result.releaseMode}`);
  console.log(`Status: ${statusIcon} ${statusText}`);

  // Evidence Package Status
  if (result.evidencePackageId) {
    console.log(`\nEvidence Package:`);
    console.log(`  ID: ${result.evidencePackageId}`);
    console.log(`  Registered: ${result.evidencePackageRegistered ? '✓' : '✗'}`);
    console.log(`  Valid: ${result.evidencePackageValid ? '✓' : '✗'}`);
    if (result.evidencePackageBlockingFailures.length > 0) {
      console.log(`  Blocking Issues:`);
      result.evidencePackageBlockingFailures.forEach(f => console.log(`    - ${f}`));
    }
  }

  console.log();

  console.log(`Checks: ${result.checksPassed} passed, ${result.checksFailed} failed\n`);

  if (result.blockingFailures.length > 0) {
    console.log(`BLOCKING FAILURES:`);
    result.blockingFailures.forEach(f => console.log(`  ✗ ${f}`));
    console.log();
  }

  if (result.warnings.length > 0) {
    console.log(`WARNINGS:`);
    result.warnings.forEach(w => console.log(`  ⚠ ${w}`));
    console.log();
  }

  if (result.missingArtifacts.length > 0) {
    console.log(`MISSING ARTIFACTS:`);
    result.missingArtifacts.forEach(a => console.log(`  - ${a}`));
    console.log();
  }

  console.log(`Next Action: ${result.nextAction}\n`);

  console.log(`SAFETY STATUS:`);
  console.log(`  Authority Safe: ${result.authoritySafe ? '✓' : '✗'}`);
  console.log(`  Commercial Safe: ${result.commercialSafe ? '✓' : '✗'}`);
  console.log(`  Manual Fulfillment Safe: ${result.manualFulfilmentSafe ? '✓' : '✗'}`);
  console.log(`  Checkout Safe: ${result.checkoutSafe ? '✓' : '✗'}\n`);

  process.exit(result.releaseReadyNow ? 0 : 1);
}
