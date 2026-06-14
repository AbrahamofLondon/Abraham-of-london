/**
 * Governed Memory Context
 *
 * Before any product writes memory, it must read governance and readiness state.
 * This helper ensures memory writes carry complete governance context.
 *
 * Rule: Memory may only be written after governance state is recorded.
 */

import { ProductReleaseGovernance } from "../product/product-release-governance";
import { ProductReadinessStatus } from "../product/product-release-readiness";
import { ProductAuthorityState } from "../product/product-authority-contract";

export interface GovernedMemoryContext {
  productCode: string;
  caseId: string;
  releaseLane: string;
  releaseMode: string;
  readinessStatus: ProductReadinessStatus;
  authorityState: ProductAuthorityState;
  evidencePackageId?: string;
  evidencePackageValid?: boolean;
  mayWriteMemory: boolean;
  memoryWriteBoundary: string;
}

/**
 * Build governed memory context before recording
 */
export function buildGovernedMemoryContext(
  productCode: string,
  caseId: string,
  governance: ProductReleaseGovernance,
  readiness: ProductReadinessStatus,
  authorityState: ProductAuthorityState,
  evidencePackageId?: string
): GovernedMemoryContext {
  // Rule: Product may write memory only after governance and readiness state are recorded
  const mayWriteMemory =
    governance !== undefined &&
    readiness !== undefined &&
    authorityState !== undefined;

  // Boundary notice for this memory write
  const boundaries: string[] = [];

  if (readiness === "blocked") {
    boundaries.push("Product is blocked; memory documents decision context only");
  }

  if (readiness === "future_ready_for_evidence_path") {
    boundaries.push(
      "Product is future-ready; memory will inform evidence collection path"
    );
  }

  if (authorityState && (authorityState.includes("blocked") || authorityState.includes("pending"))) {
    boundaries.push("Authority state restricts decision scope; memory documents gaps");
  }

  if (evidencePackageId) {
    boundaries.push("Evidence package reference recorded; validation completed separately");
  }

  const memoryWriteBoundary =
    boundaries.length > 0
      ? boundaries.join("; ")
      : "Standard governance boundary applies";

  return {
    productCode,
    caseId,
    releaseLane: governance?.releaseLane || "unknown",
    releaseMode: governance?.releaseMode || "unknown",
    readinessStatus: readiness,
    authorityState,
    evidencePackageId,
    evidencePackageValid: !!evidencePackageId,
    mayWriteMemory,
    memoryWriteBoundary,
  };
}

/**
 * Validate that context allows memory write
 */
export function validateMemoryWriteAllowed(
  context: GovernedMemoryContext
): { allowed: boolean; reason: string } {
  if (!context.mayWriteMemory) {
    return {
      allowed: false,
      reason:
        "Governance, readiness, or authority state not recorded; cannot write memory",
    };
  }

  // Additional checks
  if (context.readinessStatus === "blocked") {
    // Even blocked products can have memory recorded for decision context
    return {
      allowed: true,
      reason: "Blocked product; memory documents decision context",
    };
  }

  if (
    context.authorityState &&
    (context.authorityState.includes("blocked") || context.authorityState.includes("pending"))
  ) {
    return {
      allowed: true,
      reason: `Authority state ${context.authorityState}; memory documents evidence gaps`,
    };
  }

  return {
    allowed: true,
    reason: `Governance lane ${context.releaseLane}, mode ${context.releaseMode}; memory write allowed`,
  };
}

/**
 * Get memory write boundary notice for product communication
 */
export function getMemoryWriteBoundaryNotice(
  context: GovernedMemoryContext
): string {
  const notices: string[] = [];

  notices.push(
    `Product: ${context.productCode} | Authority State: ${context.authorityState}`
  );
  notices.push(`Release Lane: ${context.releaseLane} | Mode: ${context.releaseMode}`);
  notices.push(`Readiness: ${context.readinessStatus}`);

  if (context.memoryWriteBoundary !== "Standard governance boundary applies") {
    notices.push(`Boundary: ${context.memoryWriteBoundary}`);
  }

  return notices.join(" | ");
}
