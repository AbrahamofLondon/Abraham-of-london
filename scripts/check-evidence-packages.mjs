#!/usr/bin/env node

/**
 * Check Evidence Packages
 *
 * Validates all registered evidence packages and reports status.
 *
 * Usage:
 *   node scripts/check-evidence-packages.mjs --all
 *   node scripts/check-evidence-packages.mjs market_intelligence_q2
 *   node scripts/check-evidence-packages.mjs reporting_output_layer
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const packageId = args[0];
const allPackages = packageId === '--all';

if (!packageId) {
  console.log(`Usage: node scripts/check-evidence-packages.mjs <packageId|--all>`);
  console.log(`Examples:`);
  console.log(`  node scripts/check-evidence-packages.mjs market_intelligence_q2`);
  console.log(`  node scripts/check-evidence-packages.mjs reporting_output_layer`);
  console.log(`  node scripts/check-evidence-packages.mjs --all`);
  process.exit(1);
}

// Load registry
let registry = {};
try {
  const registryPath = path.join(projectRoot, 'lib/product/evidence-package-registry.ts');
  const registryContent = fs.readFileSync(registryPath, 'utf-8');

  // Extract registry entries (this is a simplified extraction)
  // In a real implementation, we'd parse the TypeScript or export from a JSON file
  const match = registryContent.match(/export const EVIDENCE_PACKAGE_REGISTRY[^=]*= ({[\s\S]*?});/);
  if (match) {
    // For now, load from artifact paths since we have the files
    registry = {
      market_intelligence_q2: {
        packageId: 'market_intelligence_q2',
        productCode: 'gmi_quarterly',
        packagePath: 'artifacts/validation/market_intelligence_q2/evidence-package.json',
        methodologyBoundaryPath: 'artifacts/validation/market_intelligence_q2/methodology-boundary.md',
        allowedClaimsPath: 'artifacts/validation/market_intelligence_q2/allowed-claims.txt',
        forbiddenClaimsPath: 'artifacts/validation/market_intelligence_q2/forbidden-claims.txt',
      },
      reporting_output_layer: {
        packageId: 'reporting_output_layer',
        productCode: 'reporting_output_layer',
        packagePath: 'artifacts/validation/reporting_output_layer/evidence-package.json',
        methodologyBoundaryPath: 'artifacts/validation/reporting_output_layer/methodology-boundary.md',
        allowedClaimsPath: 'artifacts/validation/reporting_output_layer/allowed-claims.txt',
        forbiddenClaimsPath: 'artifacts/validation/reporting_output_layer/forbidden-claims.txt',
      },
    };
  }
} catch (e) {
  console.error('Failed to load registry:', e.message);
  process.exit(1);
}

function validatePackage(entry) {
  const errors = [];
  const warnings = [];

  // Check package file
  const packagePath = path.join(projectRoot, entry.packagePath);
  if (!fs.existsSync(packagePath)) {
    errors.push(`Package file missing: ${entry.packagePath}`);
    return { valid: false, errors, warnings };
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

    // Check invariants
    if (pkg.reportAsEvidenceAllowed !== false) {
      errors.push('reportAsEvidenceAllowed must be false');
    }
    if (pkg.authorityGrantAllowed !== false) {
      errors.push('authorityGrantAllowed must be false');
    }
    if (pkg.positiveAuthorityGranted !== false) {
      errors.push('positiveAuthorityGranted must be false');
    }

    // Check boundary exists
    if (!pkg.evidenceBoundary) {
      errors.push('Evidence boundary must be defined');
    }

    // Check forbidden claims
    if (!pkg.forbiddenClaims || pkg.forbiddenClaims.length === 0) {
      errors.push('Forbidden claims must be defined');
    }
  } catch (e) {
    errors.push(`Failed to parse package: ${e.message}`);
    return { valid: false, errors, warnings };
  }

  // Check methodology boundary
  if (entry.methodologyBoundaryPath) {
    const methodPath = path.join(projectRoot, entry.methodologyBoundaryPath);
    if (!fs.existsSync(methodPath)) {
      errors.push(`Methodology boundary missing: ${entry.methodologyBoundaryPath}`);
    }
  }

  // Check claims files
  if (entry.allowedClaimsPath) {
    const allowedPath = path.join(projectRoot, entry.allowedClaimsPath);
    if (!fs.existsSync(allowedPath)) {
      errors.push(`Allowed claims file missing: ${entry.allowedClaimsPath}`);
    }
  }

  if (entry.forbiddenClaimsPath) {
    const forbiddenPath = path.join(projectRoot, entry.forbiddenClaimsPath);
    if (!fs.existsSync(forbiddenPath)) {
      errors.push(`Forbidden claims file missing: ${entry.forbiddenClaimsPath}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Validate requested package(s)
if (allPackages) {
  console.log('EVIDENCE PACKAGE VALIDATOR — ALL PACKAGES\n');
  console.log('Validating registered packages...\n');

  let validCount = 0;
  let invalidCount = 0;

  for (const [id, entry] of Object.entries(registry)) {
    const result = validatePackage(entry);
    if (result.valid) {
      console.log(`✓ ${id}`);
      validCount++;
    } else {
      console.log(`✗ ${id}`);
      result.errors.forEach(e => console.log(`    - ${e}`));
      invalidCount++;
    }
  }

  console.log();
  console.log(`Summary: ${validCount} valid, ${invalidCount} invalid\n`);

  process.exit(invalidCount > 0 ? 1 : 0);
} else {
  const entry = registry[packageId];
  if (!entry) {
    console.error(`Package not found in registry: ${packageId}`);
    process.exit(1);
  }

  console.log(`EVIDENCE PACKAGE VALIDATOR: ${packageId}\n`);

  const result = validatePackage(entry);

  console.log(`Status: ${result.valid ? '✓ VALID' : '✗ INVALID'}\n`);

  if (result.errors.length > 0) {
    console.log('ERRORS:');
    result.errors.forEach(e => console.log(`  ✗ ${e}`));
    console.log();
  }

  if (result.warnings.length > 0) {
    console.log('WARNINGS:');
    result.warnings.forEach(w => console.log(`  ⚠ ${w}`));
    console.log();
  }

  process.exit(result.valid ? 0 : 1);
}
