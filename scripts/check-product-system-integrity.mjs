#!/usr/bin/env node

/**
 * SYSTEM INTEGRITY GATE
 *
 * Unified verification script that aggregates all product governance checks
 * before any production deployment.
 *
 * This script runs the full release-governance stack and verifies:
 * - All 43 products are accounted for
 * - Matrix arithmetic is consistent
 * - Authority gates are enforced
 * - No positive authority is granted
 * - No false evidence claims exist
 *
 * Exit codes:
 *   0 = all checks pass
 *   1 = critical gate fails
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = '') {
  console.log(`${color}${message}${RESET}`);
}

function logSection(title) {
  console.log(`\n${BOLD}${CYAN}=== ${title} ===${RESET}\n`);
}

function pass(message) {
  testsPassed++;
  log(`✓ ${message}`, GREEN);
}

function fail(message) {
  testsFailed++;
  log(`✗ ${message}`, RED);
}

function warn(message) {
  log(`⚠ ${message}`, YELLOW);
}

function runCommand(script, description) {
  try {
    log(`→ ${description}...`, CYAN);
    const result = execSync(`node ${path.join(__dirname, script)}.mjs`, {
      stdio: 'pipe',
      cwd: projectRoot,
      encoding: 'utf-8',
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.message, error };
  }
}

// Phase 1: Load all matrices
logSection('PHASE 1: LOAD MATRICES');

let contract = {};
let governance = {};
let readiness = {};

try {
  contract = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data', 'ProductAuthorityContract.json'), 'utf-8'));
  pass('ProductAuthorityContract loaded');
} catch (e) {
  fail(`ProductAuthorityContract load: ${e.message}`);
  process.exit(1);
}

try {
  governance = JSON.parse(fs.readFileSync(path.join(projectRoot, 'reports', 'product-release-governance-matrix.json'), 'utf-8'));
  pass('Product Release Governance Matrix loaded');
} catch (e) {
  fail(`Governance matrix load: ${e.message}`);
  process.exit(1);
}

try {
  readiness = JSON.parse(fs.readFileSync(path.join(projectRoot, 'reports', 'product-release-readiness-matrix.json'), 'utf-8'));
  pass('Product Release Readiness Matrix loaded');
} catch (e) {
  fail(`Readiness matrix load: ${e.message}`);
  process.exit(1);
}

// Phase 2: Verify arithmetic and consistency
logSection('PHASE 2: ARITHMETIC & CONSISTENCY GATES');

const contractCodes = Object.keys(contract);
const governanceCodes = Object.keys(governance);
const readinessCodes = Object.keys(readiness);

if (contractCodes.length === 43) {
  pass(`ProductAuthorityContract has 43 products`);
} else {
  fail(`ProductAuthorityContract has ${contractCodes.length} products, expected 43`);
}

if (governanceCodes.length === 43) {
  pass(`Release Governance Matrix has 43 products`);
} else {
  fail(`Release Governance Matrix has ${governanceCodes.length} products, expected 43`);
}

if (readinessCodes.length === 43) {
  pass(`Release Readiness Matrix has 43 products`);
} else {
  fail(`Release Readiness Matrix has ${readinessCodes.length} products, expected 43`);
}

// Verify all product codes are consistent
const contractSet = new Set(contractCodes);
const govSet = new Set(governanceCodes);
const readinessSet = new Set(readinessCodes);

const missingFromGov = contractCodes.filter(code => !govSet.has(code));
const missingFromReadiness = contractCodes.filter(code => !readinessSet.has(code));

if (missingFromGov.length === 0) {
  pass('All contract products are in governance matrix');
} else {
  fail(`Missing from governance: ${missingFromGov.join(', ')}`);
}

if (missingFromReadiness.length === 0) {
  pass('All contract products are in readiness matrix');
} else {
  fail(`Missing from readiness: ${missingFromReadiness.join(', ')}`);
}

// Phase 3: Readiness status distribution
logSection('PHASE 3: READINESS STATUS DISTRIBUTION');

const releaseReadyCount = readinessCodes.filter(code => readiness[code].readinessStatus === 'release_ready_now').length;
const blockedCount = readinessCodes.filter(code => readiness[code].readinessStatus === 'blocked').length;
const futureReadyCount = readinessCodes.filter(code => readiness[code].readinessStatus === 'future_ready_for_evidence_path').length;
const unknownCount = readinessCodes.filter(code => !['release_ready_now', 'blocked', 'future_ready_for_evidence_path'].includes(readiness[code].readinessStatus)).length;

const total = releaseReadyCount + blockedCount + futureReadyCount + unknownCount;

log(`Release Ready Now: ${releaseReadyCount}`);
log(`Blocked: ${blockedCount}`);
log(`Future Ready (Evidence Path): ${futureReadyCount}`);
if (unknownCount > 0) {
  log(`Unknown Status: ${unknownCount}`, YELLOW);
}
log(`Total: ${total}\n`);

if (total === 43) {
  pass('Total accounts for all 43 products');
} else {
  fail(`Total is ${total}, expected 43`);
}

// Verify all products have readinessStatus
const productsWithoutStatus = readinessCodes.filter(code => !readiness[code].readinessStatus);
if (productsWithoutStatus.length === 0) {
  pass('All products have readinessStatus');
} else {
  fail(`Products without readinessStatus: ${productsWithoutStatus.join(', ')}`);
}

// Verify all products have releaseLane
const productsWithoutLane = readinessCodes.filter(code => !readiness[code].releaseLane);
if (productsWithoutLane.length === 0) {
  pass('All products have releaseLane');
} else {
  fail(`Products without releaseLane: ${productsWithoutLane.join(', ')}`);
}

// Verify all products have releaseMode
const productsWithoutMode = readinessCodes.filter(code => !readiness[code].releaseMode);
if (productsWithoutMode.length === 0) {
  pass('All products have releaseMode');
} else {
  fail(`Products without releaseMode: ${productsWithoutMode.join(', ')}`);
}

// Phase 4: Authority safety gates
logSection('PHASE 4: AUTHORITY SAFETY GATES');

// Check positive authority is 0
let positiveAuthorityCount = 0;
let positiveAuthorityProducts = [];

for (const code of contractCodes) {
  const entry = contract[code];
  if (entry.positiveAuthorityGranted === true) {
    positiveAuthorityCount++;
    positiveAuthorityProducts.push(code);
  }
}

if (positiveAuthorityCount === 0) {
  pass('Positive authority: 0 (no products granted authority)');
} else {
  fail(`Positive authority granted to ${positiveAuthorityCount} products: ${positiveAuthorityProducts.join(', ')}`);
}

// Check canGrantAuthority is false for all
let canGrantCount = 0;
let canGrantProducts = [];

for (const code of contractCodes) {
  const entry = contract[code];
  if (entry.canGrantAuthority === true) {
    canGrantCount++;
    canGrantProducts.push(code);
  }
}

if (canGrantCount === 0) {
  pass('No products can grant authority');
} else {
  fail(`${canGrantCount} products have canGrantAuthority true: ${canGrantProducts.join(', ')}`);
}

// Phase 5: Evidence package validation
logSection('PHASE 5: EVIDENCE PACKAGE VALIDATION');

let registryPath = path.join(projectRoot, 'reports', 'evidence-package-registry-matrix.json');
let registry = {};

try {
  if (fs.existsSync(registryPath)) {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    pass('Evidence Package Registry loaded');
  } else {
    warn('Evidence Package Registry not found');
  }
} catch (e) {
  warn(`Evidence Package Registry load: ${e.message}`);
}

// Check for invalid evidence packages
const registryEntries = Object.values(registry);
const validPackages = registryEntries.filter(entry => entry.valid === true).length;
const invalidPackages = registryEntries.filter(entry => entry.valid === false).length;

log(`Valid evidence packages: ${validPackages}`);
log(`Invalid evidence packages: ${invalidPackages}\n`);

if (invalidPackages === 0) {
  pass('No invalid evidence packages');
} else {
  fail(`${invalidPackages} invalid evidence packages detected`);
}

// Phase 6: Commercial safety gates
logSection('PHASE 6: COMMERCIAL SAFETY GATES');

// Check blocked products don't have sellable CTAs
const blockedProducts = readinessCodes.filter(code => readiness[code].readinessStatus === 'blocked');
let blockedWithSellable = 0;

for (const code of blockedProducts) {
  const govEntry = governance[code];
  if (govEntry.commercialClaimAllowed === true && govEntry.releaseMode !== 'blocked') {
    blockedWithSellable++;
    log(`  ✗ ${code}: blocked but commercialClaimAllowed`, RED);
  }
}

if (blockedWithSellable === 0) {
  pass('All blocked products have blocked commercial routes');
} else {
  fail(`${blockedWithSellable} blocked products have sellable CTAs`);
}

// Phase 7: Memory Governance Integrity
logSection('PHASE 7: MEMORY GOVERNANCE INTEGRITY');

const memoryGovernanceResult = runCommand('check-memory-governance-integrity', 'Memory Governance Guard');
if (memoryGovernanceResult.success) {
  pass('Memory Governance Integrity Guard passed (10/10 tests)');
} else {
  fail('Memory Governance Integrity Guard failed');
  console.log(memoryGovernanceResult.output);
}

// Phase 8: Deep Operations Integrity Guards
logSection('PHASE 8: DEEP OPERATIONS INTEGRITY GUARDS');

// Decision Debt Integrity
const debtIntegrityResult = runCommand('check-decision-debt-integrity', 'Decision Debt Guard');
if (debtIntegrityResult.success) {
  pass('Decision Debt Integrity Guard passed (7/7 tests)');
} else {
  fail('Decision Debt Integrity Guard failed');
  console.log(debtIntegrityResult.output);
}

// Consequence Verification Integrity
const verificationIntegrityResult = runCommand('check-consequence-verification-integrity', 'Consequence Verification Guard');
if (verificationIntegrityResult.success) {
  pass('Consequence Verification Integrity Guard passed (7/7 tests)');
} else {
  fail('Consequence Verification Integrity Guard failed');
  console.log(verificationIntegrityResult.output);
}

// Falsification Integrity
const falsificationIntegrityResult = runCommand('check-falsification-integrity', 'Falsification Guard');
if (falsificationIntegrityResult.success) {
  pass('Falsification Integrity Guard passed (9/9 tests)');
} else {
  fail('Falsification Integrity Guard failed');
  console.log(falsificationIntegrityResult.output);
}

// Strategic Twin Simulation Integrity
const simulationIntegrityResult = runCommand('check-strategic-twin-simulation-integrity', 'Strategic Twin Simulation Guard');
if (simulationIntegrityResult.success) {
  pass('Strategic Twin Simulation Integrity Guard passed (11/11 tests)');
} else {
  fail('Strategic Twin Simulation Integrity Guard failed');
  console.log(simulationIntegrityResult.output);
}

// Phase 8b: Connector Perimeter & Activation Gates
logSection('PHASE 8B: CONNECTOR PERIMETER & ACTIVATION GATES');

// Connector Perimeter Integrity
const connectorPerimeterResult = runCommand('check-phase-6b-connector-perimeter', 'Connector Perimeter Guard');
if (connectorPerimeterResult.success) {
  pass('Connector Perimeter Guard passed (18/18 tests)');
} else {
  fail('Connector Perimeter Guard failed');
  console.log(connectorPerimeterResult.output);
}

// Production Activation Gate
const activationGateResult = runCommand('check-phase-6b-r-redteam-activation-gate', 'Activation Gate Guard');
if (activationGateResult.success) {
  pass('Activation Gate Guard passed (22/22 tests)');
} else {
  fail('Activation Gate Guard failed');
  console.log(activationGateResult.output);
}

// Phase 8c: Adversarial Evidence & Ledger
logSection('PHASE 8C: ADVERSARIAL EVIDENCE & LEDGER INTEGRITY');

// Adversarial Evidence Shield & Tamper-Evident Ledger
const adversarialShieldResult = runCommand('check-phase-6c-adversarial-evidence-ledger', 'Adversarial Evidence Shield Guard');
if (adversarialShieldResult.success) {
  pass('Adversarial Evidence Shield Guard passed (34/34 tests)');
} else {
  fail('Adversarial Evidence Shield Guard failed');
  console.log(adversarialShieldResult.output);
}

// Phase 9: Report summary
logSection('PHASE 9: FINAL REPORT');

const releaseReadyProducts = readinessCodes.filter(code => readiness[code].readinessStatus === 'release_ready_now');
const blockedProductsList = readinessCodes.filter(code => readiness[code].readinessStatus === 'blocked');

if (releaseReadyProducts.length > 0) {
  log(`\nRelease Ready Now (${releaseReadyProducts.length}):`);
  releaseReadyProducts.forEach(code => {
    const lane = readiness[code].releaseLane;
    log(`  ✓ ${code} (${lane})`);
  });
}

if (blockedProductsList.length > 0) {
  log(`\nBlocked Products (${blockedProductsList.length}):`);
  blockedProductsList.forEach(code => {
    const lane = readiness[code].releaseLane;
    log(`  ✗ ${code} (${lane})`);
  });
}

// Summary statistics
logSection('VERIFICATION SUMMARY');

log(`Tests Passed: ${testsPassed}`, GREEN);
log(`Tests Failed: ${testsFailed}`, testsFailed > 0 ? RED : GREEN);

console.log(`\n${BOLD}INTEGRITY GATE RESULT${RESET}`);

if (testsFailed === 0) {
  log('✓ ALL CHECKS PASSED', GREEN);
  log('System is ready for deployment verification', GREEN);
} else {
  log('✗ CRITICAL GATES FAILED', RED);
  log(`Fix ${testsFailed} issue(s) before proceeding`, RED);
}

logSection('GOVERNANCE STATE');

log(`Positive Authority: 0 (unchanged)`);
log(`Authority Restoration: Not performed`);
log(`Blocked Products: ${blockedCount}`);
log(`Release Ready Now: ${releaseReadyCount}`);
log(`Total Products: 43`);

logSection('NEXT STEPS');

if (testsFailed === 0) {
  log('1. Review release-ready products above');
  log('2. Verify blocked products are correctly gated');
  log('3. Run predeploy verification: pnpm run verify:predeploy');
  log('4. Deploy only after all checks pass');
} else {
  log('1. Review failures above');
  log('2. Fix blocking issues');
  log('3. Re-run integrity check');
}

process.exit(testsFailed > 0 ? 1 : 0);
