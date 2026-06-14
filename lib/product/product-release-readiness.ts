/**
 * Product Release Readiness Engine
 *
 * Generic evaluation of any product's readiness for commercial release
 * across all release lanes and governance states.
 */

import fs from 'fs';
import path from 'path';

export type ProductReadinessStatus =
  | "release_ready_now"
  | "future_ready_for_evidence_path"
  | "blocked";

export type ProductReleaseReadinessResult = {
  productCode: string;
  productName?: string;
  readinessStatus: ProductReadinessStatus;
  releaseReadyNow: boolean;
  futureReady: boolean;
  blocked: boolean;
  releaseLane: string;
  releaseMode: string;
  checksPassed: number;
  checksFailed: number;
  blockingFailures: string[];
  warnings: string[];
  requiredArtifacts: string[];
  missingArtifacts: string[];
  forbiddenClaimsDetected: string[];
  authoritySafe: boolean;
  commercialSafe: boolean;
  manualFulfilmentSafe: boolean;
  checkoutSafe: boolean;
  nextAction: string;

  // Evidence Package Registry Integration
  evidencePackageRegistered: boolean;
  evidencePackageValid: boolean;
  evidencePackageId?: string;
  evidencePackageBlockingFailures: string[];
};

export type ProductAuthorityContractEntry = {
  productCode: string;
  productName?: string;
  currentAuthorityState: string;
  publicClaimAllowed?: boolean;
  canGrantAuthority?: boolean;
  commercialClaimAllowed?: boolean;
  blockingReasons?: string[];
  nextEvidenceAction?: string;
  targetReleaseLane?: string;
  allowedClaims?: string[];
  forbiddenClaims?: string[];
  evidencePackagePath?: string;
  methodologyBoundaryPath?: string;
  allowedClaimsPath?: string;
  forbiddenClaimsPath?: string;
  commercialClaimBounded?: string;
  manualFulfilmentAllowed?: boolean;
  checkoutAllowed?: boolean;
  requiredBoundaryVariant?: string;
  priorQuarterReviewRequired?: boolean;
  humanReviewRequired?: boolean;
  positiveAuthorityGranted?: boolean;
};

export type ProductReleaseGovernanceEntry = {
  productCode: string;
  productName?: string;
  releaseLane: string;
  releaseMode: string;
  authorityState: string;
  effectiveAuthorityState?: string;
  canGrantAuthority: boolean;
  publicClaimAllowed: boolean;
  commercialClaimAllowed: boolean;
  checkoutAllowed: boolean;
  manualFulfilmentAllowed: boolean;
  requiredBoundaryVariant: string;
  boundaryDescription?: string;
  forbiddenClaims?: string[];
  allowedClaims?: string[];
  nextAction?: string;
};

export class ProductReleaseReadinessEngine {
  private contract: Record<string, ProductAuthorityContractEntry> = {};
  private governance: Record<string, ProductReleaseGovernanceEntry> = {};
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.loadContract();
    this.loadGovernance();
  }

  private loadContract() {
    try {
      const contractPath = path.join(this.projectRoot, 'data', 'ProductAuthorityContract.json');
      const content = fs.readFileSync(contractPath, 'utf-8');
      this.contract = JSON.parse(content);
    } catch (error) {
      console.warn('Failed to load ProductAuthorityContract:', error);
      this.contract = {};
    }
  }

  private loadGovernance() {
    try {
      const govPath = path.join(this.projectRoot, 'reports', 'product-release-governance-matrix.json');
      const content = fs.readFileSync(govPath, 'utf-8');
      this.governance = JSON.parse(content);
    } catch (error) {
      console.warn('Failed to load governance matrix:', error);
      this.governance = {};
    }
  }

  private getEvidencePackageRegistryEntry(productCode: string, packagePath: string): any {
    try {
      const matrixPath = path.join(this.projectRoot, 'reports', 'evidence-package-registry-matrix.json');
      if (!fs.existsSync(matrixPath)) {
        return null;
      }

      const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf-8'));

      // Try to find by package path or product code
      for (const [id, entry] of Object.entries(matrix)) {
        const registryEntry = entry as any;
        if (registryEntry.packagePath === packagePath || registryEntry.productCode === productCode) {
          return {
            packageId: registryEntry.packageId || id,
            validationStatus: registryEntry.valid ? 'valid' : 'invalid',
            validationErrors: registryEntry.validationErrors || [],
          };
        }
      }

      return null;
    } catch (error) {
      console.warn('Failed to load evidence package registry:', error);
      return null;
    }
  }

  private checkArtifactExists(artifactPath: string | undefined): boolean {
    if (!artifactPath) return false;
    try {
      const fullPath = path.join(this.projectRoot, artifactPath);
      return fs.existsSync(fullPath);
    } catch {
      return false;
    }
  }

  private readFileContent(filePath: string | undefined): string {
    if (!filePath) return '';
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      return fs.readFileSync(fullPath, 'utf-8');
    } catch {
      return '';
    }
  }

  private detectForbiddenClaims(content: string, forbiddenList: string[]): string[] {
    const detected: string[] = [];
    const contentLower = content.toLowerCase();

    for (const forbidden of forbiddenList) {
      const searchTerm = forbidden.toLowerCase();
      if (contentLower.includes(searchTerm)) {
        detected.push(forbidden);
      }
    }

    return detected;
  }

  evaluate(productCode: string): ProductReleaseReadinessResult {
    const result: ProductReleaseReadinessResult = {
      productCode,
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
      evidencePackageRegistered: false,
      evidencePackageValid: false,
      evidencePackageBlockingFailures: [],
    };

    // 1. Check product in contract
    const contractEntry = this.contract[productCode];
    if (!contractEntry) {
      result.blockingFailures.push(`Product not found in ProductAuthorityContract`);
      result.checksFailed++;
      return result;
    }

    result.productName = contractEntry.productName || productCode;
    result.checksPassed++;

    // 2. Check product in governance
    const govEntry = this.governance[productCode];
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
    const isValidated = govEntry.releaseLane === 'validated_authority_product';

    if (isBlocked) {
      result.blockingFailures.push(`Product is in blocked lane: ${govEntry.releaseLane}`);
      result.checksFailed++;
      return result;
    }

    // 5. Evidence-limited products require evidence artifacts
    if (isEvidenceLimited) {
      const evidencePackageRequired = !!contractEntry.evidencePackagePath;
      const methodologyRequired = !!contractEntry.methodologyBoundaryPath;

      if (evidencePackageRequired) {
        result.requiredArtifacts.push('evidence-package.json');
        const packageExists = this.checkArtifactExists(contractEntry.evidencePackagePath);
        if (packageExists) {
          result.checksPassed++;
        } else {
          result.blockingFailures.push(`Evidence package missing: ${contractEntry.evidencePackagePath}`);
          result.missingArtifacts.push(contractEntry.evidencePackagePath!);
          result.checksFailed++;
        }
      }

      if (methodologyRequired) {
        result.requiredArtifacts.push('methodology-boundary.md');
        const methodologyExists = this.checkArtifactExists(contractEntry.methodologyBoundaryPath);
        if (methodologyExists) {
          result.checksPassed++;
        } else {
          result.blockingFailures.push(`Methodology boundary missing: ${contractEntry.methodologyBoundaryPath}`);
          result.missingArtifacts.push(contractEntry.methodologyBoundaryPath!);
          result.checksFailed++;
        }
      }
    }

    // 6. Validated products require evidence ledger
    if (isValidated) {
      // Evidence Ledger v2 required for validated products
      result.requiredArtifacts.push('Evidence Ledger v2');
      // For now, flag as warning - actual ledger check would go here
      result.warnings.push('Validated products require Evidence Ledger v2 (check pending)');
    }

    // 7. Commercial safety
    if (govEntry.commercialClaimAllowed) {
      result.commercialSafe = true;
      result.checksPassed++;
    } else {
      result.warnings.push(`Commercial claims are not allowed for this product`);
    }

    // 8. Checkout safety
    if (!govEntry.checkoutAllowed) {
      result.checkoutSafe = true;
      result.checksPassed++;
    } else {
      result.warnings.push(`Checkout is enabled but may require additional controls`);
    }

    // 9. Manual fulfillment safety
    if (govEntry.manualFulfilmentAllowed && contractEntry.humanReviewRequired) {
      result.manualFulfilmentSafe = true;
      result.checksPassed++;
    } else if (govEntry.manualFulfilmentAllowed) {
      result.warnings.push(`Manual fulfillment allowed but human review not required`);
    }

    // 10. Forbidden claims check
    if (isEvidenceLimited && contractEntry.forbiddenClaims) {
      if (contractEntry.allowedClaimsPath) {
        const allowedContent = this.readFileContent(contractEntry.allowedClaimsPath);
        const forbiddenDetected = this.detectForbiddenClaims(allowedContent, contractEntry.forbiddenClaims);
        if (forbiddenDetected.length > 0) {
          result.forbiddenClaimsDetected = forbiddenDetected;
          result.blockingFailures.push(`Forbidden claims found in allowed claims: ${forbiddenDetected.join(', ')}`);
          result.checksFailed++;
        } else {
          result.checksPassed++;
        }
      }

      if (contractEntry.forbiddenClaimsPath) {
        const forbiddenContent = this.readFileContent(contractEntry.forbiddenClaimsPath);
        const present = forbiddenContent.length > 0;
        if (present) {
          result.checksPassed++;
        } else {
          result.warnings.push(`Forbidden claims file exists but is empty`);
        }
      }
    }

    // 11. Boundary variant validation
    if (isEvidenceLimited && !contractEntry.requiredBoundaryVariant) {
      result.warnings.push(`No boundary variant specified for evidence-limited product`);
    }

    // 12. Prior-quarter review requirement
    if (contractEntry.priorQuarterReviewRequired === true) {
      result.checksPassed++;
    } else if (contractEntry.priorQuarterReviewRequired === false) {
      result.warnings.push(`Prior-quarter review not required (may be acceptable for some products)`);
    }

    // 11. Check Evidence Package Registry (if product requires an evidence package)
    if (contractEntry.evidencePackagePath) {
      // Product requires an evidence package - must be registered and valid
      const registryEntry = this.getEvidencePackageRegistryEntry(productCode, contractEntry.evidencePackagePath);

      if (!registryEntry) {
        result.evidencePackageRegistered = false;
        result.evidencePackageValid = false;
        result.blockingFailures.push(
          `Evidence package required but not registered in Evidence Package Registry: ${contractEntry.evidencePackagePath}`
        );
        result.checksFailed++;
      } else {
        result.evidencePackageRegistered = true;
        result.evidencePackageId = registryEntry.packageId;

        if (registryEntry.validationStatus === 'valid') {
          result.evidencePackageValid = true;
          result.checksPassed++;
        } else {
          result.evidencePackageValid = false;
          result.evidencePackageBlockingFailures = registryEntry.validationErrors || [];
          result.blockingFailures.push(
            `Evidence package registered but validation failed: ${registryEntry.packageId}`
          );
          result.checksFailed++;
        }
      }
    }

    // Determine readiness status
    // Release ready now: in a commercial lane, all checks passed, no missing artifacts, evidence package valid (if required)
    const isCommercialLane = isEvidenceLimited;
    const hasNoBlockingIssues = result.blockingFailures.length === 0 && !isBlocked;
    const allRequiredArtifactsPresent = result.missingArtifacts.length === 0;
    const evidencePackageRequired = !!contractEntry.evidencePackagePath;
    const evidencePackageSatisfied = !evidencePackageRequired || result.evidencePackageValid;
    const isReadyForRelease = isCommercialLane && hasNoBlockingIssues && allRequiredArtifactsPresent && govEntry.commercialClaimAllowed && evidencePackageSatisfied;

    if (result.blockingFailures.length > 0 || isBlocked) {
      result.readinessStatus = 'blocked';
      result.blocked = true;
    } else if (isReadyForRelease) {
      result.readinessStatus = 'release_ready_now';
      result.releaseReadyNow = true;
    } else if (result.blockingFailures.length === 0) {
      // No blocking failures: has a valid pathway but not ready yet
      result.readinessStatus = 'future_ready_for_evidence_path';
      result.futureReady = true;
    } else {
      result.readinessStatus = 'blocked';
      result.blocked = true;
    }

    return result;
  }

  evaluateAll(): Record<string, ProductReleaseReadinessResult> {
    const results: Record<string, ProductReleaseReadinessResult> = {};
    for (const productCode of Object.keys(this.contract)) {
      results[productCode] = this.evaluate(productCode);
    }
    return results;
  }
}

export default ProductReleaseReadinessEngine;
