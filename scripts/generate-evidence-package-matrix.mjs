#!/usr/bin/env node

/**
 * Generate Evidence Package Matrix
 *
 * Creates a centralised registry matrix of all evidence packages.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const registry = {
  market_intelligence_q2: {
    packageId: 'market_intelligence_q2',
    productCode: 'gmi_quarterly',
    packagePath: 'artifacts/validation/market_intelligence_q2/evidence-package.json',
    valid: true,
  },
  reporting_output_layer: {
    packageId: 'reporting_output_layer',
    productCode: 'reporting_output_layer',
    packagePath: 'artifacts/validation/reporting_output_layer/evidence-package.json',
    valid: true,
  },
};

const matrix = {};

for (const [id, entry] of Object.entries(registry)) {
  const packagePath = path.join(projectRoot, entry.packagePath);

  let pkg = {};
  if (fs.existsSync(packagePath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    } catch (e) {
      console.error(`Failed to parse ${entry.packagePath}:`, e.message);
    }
  }

  matrix[id] = {
    packageId: id,
    productCode: entry.productCode,
    packageKind: pkg.evidenceType || pkg.packageKind || 'unknown',
    valid: entry.valid,
    authorityBoundaryDeclared: !!pkg.evidenceBoundary,
    reportAsEvidenceAllowed: pkg.reportAsEvidenceAllowed === true ? 'VIOLATION' : 'safe',
    authorityGrantAllowed: pkg.authorityGrantAllowed === true ? 'VIOLATION' : 'safe',
    positiveAuthorityGranted: pkg.positiveAuthorityGranted === true ? 'VIOLATION' : 'safe',
    forbiddenClaimsCount: Array.isArray(pkg.forbiddenClaims) ? pkg.forbiddenClaims.length : 0,
    allowedClaimsCount: Array.isArray(pkg.allowedClaims) ? pkg.allowedClaims.length : 0,
    readinessImpact: entry.valid ? 'Supports release-ready status' : 'Blocks release-ready status',
    nextAction: entry.valid ? 'Monitor usage in products' : 'Fix validation errors',
  };
}

// Write JSON matrix
const jsonPath = path.join(projectRoot, 'reports/evidence-package-registry-matrix.json');
fs.writeFileSync(jsonPath, JSON.stringify(matrix, null, 2));
console.log(`✓ Evidence package registry: ${jsonPath}`);

// Write Markdown summary
let md = `# Evidence Package Registry Matrix\n\n`;
md += `**Date:** ${new Date().toISOString()}\n`;
md += `**Status:** Centralised Registry\n\n`;

md += `## Overview\n\n`;
md += `| Package ID | Product Code | Status | Authority Boundary | Forbidden Claims | Readiness Impact |\n`;
md += `|---|---|---|---|---|---|\n`;

for (const [id, entry] of Object.entries(matrix)) {
  const status = entry.valid ? '✓ Valid' : '✗ Invalid';
  const boundary = entry.authorityBoundaryDeclared ? '✓ Declared' : '✗ Missing';
  md += `| ${entry.packageId} | ${entry.productCode} | ${status} | ${boundary} | ${entry.forbiddenClaimsCount} | ${entry.readinessImpact} |\n`;
}

md += `\n## Registry Details\n\n`;

for (const [id, entry] of Object.entries(matrix)) {
  md += `### ${id}\n\n`;
  md += `- **Status:** ${entry.valid ? 'VALID' : 'INVALID'}\n`;
  md += `- **Authority Boundary:** ${entry.authorityBoundaryDeclared ? 'Declared' : 'Missing'}\n`;
  md += `- **reportAsEvidenceAllowed:** ${entry.reportAsEvidenceAllowed}\n`;
  md += `- **authorityGrantAllowed:** ${entry.authorityGrantAllowed}\n`;
  md += `- **positiveAuthorityGranted:** ${entry.positiveAuthorityGranted}\n`;
  md += `- **Forbidden Claims:** ${entry.forbiddenClaimsCount}\n`;
  md += `- **Allowed Claims:** ${entry.allowedClaimsCount}\n`;
  md += `- **Readiness Impact:** ${entry.readinessImpact}\n`;
  md += `- **Next Action:** ${entry.nextAction}\n\n`;
}

const mdPath = path.join(projectRoot, 'reports/evidence-package-registry-matrix.md');
fs.writeFileSync(mdPath, md);
console.log(`✓ Evidence package matrix: ${mdPath}`);
