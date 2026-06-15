/**
 * lib/commercial/commercial-governance.ts
 *
 * Governance state loader for commercial checkout decisions.
 *
 * Merges the Product Release Readiness Matrix and the Product Release
 * Governance Matrix (both keyed by productCode) into a single typed
 * GovernanceState lookup. This is the governance half that the commercial
 * action resolver consults — checkout-ready CATALOG data is never permission
 * on its own.
 *
 * Both matrices are committed JSON artifacts and imported statically so the
 * resolver works at build time, on the server, and (for CTA rendering) in the
 * client bundle.
 */

import readinessMatrix from "@/reports/product-release-readiness-matrix.json";
import governanceMatrix from "@/reports/product-release-governance-matrix.json";

export type GovernanceState = {
  productCode: string;
  /** Present in the governance source (readiness and/or governance matrix). */
  known: boolean;

  // From the readiness matrix
  readinessStatus: string | null;
  releaseReadyNow: boolean;
  checkoutSafe: boolean | null;
  commercialSafe: boolean | null;

  // Shared / governance matrix
  releaseLane: string | null;
  releaseMode: string | null;

  // From the governance matrix
  checkoutAllowed: boolean | null;
  manualFulfilmentAllowed: boolean | null;
  commercialClaimAllowed: boolean | null;
  authorityState: string | null;
  effectiveAuthorityState: string | null;
};

type AnyRecord = Record<string, any>;

const readiness = readinessMatrix as unknown as Record<string, AnyRecord>;
const governance = governanceMatrix as unknown as Record<string, AnyRecord>;

function bool(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

/**
 * Resolve the merged governance state for a product code. Returns a state with
 * `known: false` (and null governance fields) when the code is absent from both
 * matrices, so the resolver can fall back to catalog-only behaviour safely.
 */
export function getGovernanceState(productCode: string): GovernanceState {
  const r = readiness[productCode] || null;
  const g = governance[productCode] || null;
  const known = Boolean(r || g);

  return {
    productCode,
    known,
    readinessStatus: (r?.readinessStatus as string) ?? null,
    releaseReadyNow: r?.releaseReadyNow === true,
    checkoutSafe: bool(r?.checkoutSafe),
    commercialSafe: bool(r?.commercialSafe),
    releaseLane: (r?.releaseLane as string) ?? (g?.releaseLane as string) ?? null,
    releaseMode: (r?.releaseMode as string) ?? (g?.releaseMode as string) ?? null,
    checkoutAllowed: bool(g?.checkoutAllowed),
    manualFulfilmentAllowed: bool(g?.manualFulfilmentAllowed),
    commercialClaimAllowed: bool(g?.commercialClaimAllowed),
    authorityState: (g?.authorityState as string) ?? null,
    effectiveAuthorityState: (g?.effectiveAuthorityState as string) ?? null,
  };
}

/** True when governance unambiguously blocks a product (any blocked signal). */
export function isGovernanceBlocked(s: GovernanceState): boolean {
  return (
    s.readinessStatus === "blocked" ||
    s.releaseMode === "blocked" ||
    (typeof s.releaseLane === "string" && s.releaseLane.startsWith("blocked")) ||
    s.checkoutAllowed === false && s.manualFulfilmentAllowed === false && s.commercialClaimAllowed === false
  );
}

/** All governance product codes (union of both matrices). */
export function allGovernanceCodes(): string[] {
  return Array.from(new Set([...Object.keys(readiness), ...Object.keys(governance)])).sort();
}
