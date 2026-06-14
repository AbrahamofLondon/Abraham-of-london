/**
 * Evidence Package Validator
 *
 * Generic validation for all evidence packages.
 * Ensures consistency and prevents fragmentation across the estate.
 */

import fs from 'fs';
import path from 'path';
import type { RegistryEntry } from './evidence-package-registry';

export interface ValidatorResult {
  packageId: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    artifactExists: boolean;
    contractValid: boolean;
    methodologyExists: boolean;
    claimsListsExist: boolean;
    authorityBoundaryValid: boolean;
    forbiddenClaimsPresent: boolean;
    humanReviewRequired: boolean;
  };
}

/**
 * Validate Evidence Package
 *
 * Comprehensive validation of an evidence package against the registry and filesystem.
 */
export function validateEvidencePackage(
  entry: RegistryEntry,
  projectRoot: string = process.cwd()
): ValidatorResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checks = {
    artifactExists: false,
    contractValid: false,
    methodologyExists: false,
    claimsListsExist: false,
    authorityBoundaryValid: false,
    forbiddenClaimsPresent: false,
    humanReviewRequired: false,
  };

  // 1. Check evidence package file exists
  const packagePath = path.join(projectRoot, entry.packagePath);
  if (!fs.existsSync(packagePath)) {
    errors.push(`Evidence package file missing: ${entry.packagePath}`);
  } else {
    checks.artifactExists = true;

    // Parse and validate package content
    try {
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      // Check hardcoded invariants
      if (packageContent.reportAsEvidenceAllowed !== false) {
        errors.push('reportAsEvidenceAllowed must be false');
      }

      if (packageContent.authorityGrantAllowed !== false) {
        errors.push('authorityGrantAllowed must be false');
      }

      if (packageContent.positiveAuthorityGranted !== false) {
        errors.push('positiveAuthorityGranted must be false');
      }

      checks.contractValid = errors.length === 0;

      // Check human review requirement
      if (packageContent.humanReviewRequired === true) {
        checks.humanReviewRequired = true;
      }

      // Check authority boundary exists
      if (packageContent.evidenceBoundary) {
        checks.authorityBoundaryValid = true;
      } else {
        errors.push('Evidence boundary must be defined in package');
      }

      // Check forbidden claims present
      if (packageContent.forbiddenClaims && packageContent.forbiddenClaims.length > 0) {
        checks.forbiddenClaimsPresent = true;
      } else {
        errors.push('Forbidden claims must be defined');
      }
    } catch (e) {
      errors.push(`Failed to parse evidence package: ${(e as Error).message}`);
    }
  }

  // 2. Check methodology boundary exists
  if (entry.methodologyBoundaryPath) {
    const methodologyPath = path.join(projectRoot, entry.methodologyBoundaryPath);
    if (!fs.existsSync(methodologyPath)) {
      errors.push(`Methodology boundary file missing: ${entry.methodologyBoundaryPath}`);
    } else {
      checks.methodologyExists = true;
    }
  } else {
    warnings.push('No methodology boundary path specified (may be acceptable for some packages)');
  }

  // 3. Check allowed and forbidden claims files exist
  if (entry.allowedClaimsPath && entry.forbiddenClaimsPath) {
    const allowedPath = path.join(projectRoot, entry.allowedClaimsPath);
    const forbiddenPath = path.join(projectRoot, entry.forbiddenClaimsPath);

    if (!fs.existsSync(allowedPath)) {
      errors.push(`Allowed claims file missing: ${entry.allowedClaimsPath}`);
    }

    if (!fs.existsSync(forbiddenPath)) {
      errors.push(`Forbidden claims file missing: ${entry.forbiddenClaimsPath}`);
    }

    if (fs.existsSync(allowedPath) && fs.existsSync(forbiddenPath)) {
      checks.claimsListsExist = true;

      // Check for claims overlap
      try {
        const allowedContent = fs.readFileSync(allowedPath, 'utf-8').toLowerCase();
        const forbiddenContent = fs.readFileSync(forbiddenPath, 'utf-8').toLowerCase();

        // Simple overlap check: look for exact claim matches
        const forbiddenPhrases = forbiddenContent
          .split('\n')
          .filter(line => line.includes('❌') || line.includes('- ❌'));

        for (const phrase of forbiddenPhrases) {
          const cleanPhrase = phrase
            .replace('❌', '')
            .replace('- ', '')
            .trim()
            .toLowerCase();

          if (cleanPhrase && allowedContent.includes(cleanPhrase)) {
            errors.push(`Claim appears in both allowed and forbidden: "${cleanPhrase}"`);
          }
        }
      } catch (e) {
        warnings.push(`Could not fully validate claims overlap: ${(e as Error).message}`);
      }
    }
  } else {
    warnings.push('Claims paths not fully specified');
  }

  // 4. Validation result
  const valid = errors.length === 0;

  return {
    packageId: entry.packageId,
    valid,
    errors,
    warnings,
    checks,
  };
}

/**
 * Validate All Evidence Packages In Registry
 */
export function validateAllEvidencePackages(
  entries: RegistryEntry[],
  projectRoot: string = process.cwd()
): Map<string, ValidatorResult> {
  const results = new Map<string, ValidatorResult>();

  for (const entry of entries) {
    const result = validateEvidencePackage(entry, projectRoot);
    results.set(entry.packageId, result);
  }

  return results;
}

/**
 * Get Validation Summary
 */
export function getValidationSummary(results: Map<string, ValidatorResult>): {
  total: number;
  valid: number;
  invalid: number;
  warnings: number;
} {
  let valid = 0;
  let invalid = 0;
  let warnings = 0;

  for (const result of results.values()) {
    if (result.valid) {
      valid++;
    } else {
      invalid++;
    }
    warnings += result.warnings.length;
  }

  return {
    total: results.size,
    valid,
    invalid,
    warnings,
  };
}

export default validateEvidencePackage;
