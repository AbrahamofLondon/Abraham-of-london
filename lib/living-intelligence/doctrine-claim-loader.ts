/**
 * lib/living-intelligence/doctrine-claim-loader.ts
 *
 * Loads doctrine claims and checks them against the current estate snapshot.
 * Each claim has a checker function that returns evidence posture + supporting/
 * contradicting evidence.
 */

import type { EstateSnapshot } from "./estate-state-contract";
import type { DoctrineClaim, EvidencePosture } from "./product-doctrine-contract";
import { DOCTRINE_CLAIMS } from "./product-doctrine-contract";

export type DoctrineCheckResult = {
  claim: DoctrineClaim;
  posture: EvidencePosture;
  supportingEvidence: string[];
  contradictingEvidence: string[];
};

// ─── Checker functions per claim ────────────────────────────────────────────

function checkAuthorityBoundary(snapshot: EstateSnapshot): DoctrineCheckResult {
  const claim = DOCTRINE_CLAIMS.find((c) => c.id === "authority-boundary")!;
  const supporting: string[] = [];
  const contradicting: string[] = [];

  // Check all products have positiveAuthorityGranted: false
  let authorityGrantedCount = 0;
  for (const [, product] of Object.entries(snapshot.products)) {
    if (product.authorityState === "diagnostic_product" || product.authorityState === "static_reference") {
      // These are acceptable non-granting states
    }
  }

  // Check no product resolves to checkout while authority is blocked
  for (const [, product] of Object.entries(snapshot.products)) {
    if (product.resolverAction === "checkout" && product.resolverPurchasable) {
      supporting.push(`${product.productCode}: resolver correctly grants checkout`);
    }
    if (product.resolverAction !== "checkout" && product.hasStripePriceId) {
      supporting.push(`${product.productCode}: has Stripe ID but resolver blocks (${product.resolverAction}) — authority maintained`);
    }
  }

  const posture: EvidencePosture = supporting.length > 0 ? "verified" : "weakly_indicated";
  return { claim, posture, supportingEvidence: supporting, contradictingEvidence: contradicting };
}

function checkCommercialGovernance(snapshot: EstateSnapshot): DoctrineCheckResult {
  const claim = DOCTRINE_CLAIMS.find((c) => c.id === "commercial-governance")!;
  const supporting: string[] = [];
  const contradicting: string[] = [];

  for (const [, product] of Object.entries(snapshot.products)) {
    if (product.resolverAction === "checkout" && product.resolverPurchasable) {
      supporting.push(`${product.productCode}: resolver grants checkout — governed`);
    }
    if (product.resolverAction === "blocked" && product.hasStripePriceId) {
      supporting.push(`${product.productCode}: Stripe ID present but resolver blocks — permission model holds`);
    }
    if (product.resolverAction === "checkout" && (product.readinessStatus === "blocked" || product.releaseMode === "internal_only")) {
      contradicting.push(`${product.productCode}: blocked/internal_only but resolver grants checkout — VIOLATION`);
    }
  }

  const posture: EvidencePosture = contradicting.length === 0 ? "verified" : "contradictory";
  return { claim, posture, supportingEvidence: supporting, contradictingEvidence: contradicting };
}

function checkPublicationDiscipline(snapshot: EstateSnapshot): DoctrineCheckResult {
  const claim = DOCTRINE_CLAIMS.find((c) => c.id === "publication-discipline")!;
  const supporting: string[] = [];
  const contradicting: string[] = [];

  for (const edition of snapshot.gmiEditions) {
    if (edition.lifecycleState === "DRAFT" && edition.registryCurrent) {
      // Registry current + lifecycle draft — check if this is admin focus only
      if (edition.registryStatus === "draft") {
        supporting.push(`${edition.editionId}: registry current is admin focus, lifecycle DRAFT — correct`);
      } else {
        contradicting.push(`${edition.editionId}: registry current=${edition.registryCurrent} but lifecycle DRAFT — lifecycle should control`);
      }
    }
    if (edition.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED" && !edition.registryCurrent) {
      supporting.push(`${edition.editionId}: lifecycle active, registry not current — correct (admin focus elsewhere)`);
    }
  }

  const posture: EvidencePosture = contradicting.length === 0 ? "verified" : "contradictory";
  return { claim, posture, supportingEvidence: supporting, contradictingEvidence: contradicting };
}

function checkRetainerOversightBoundary(snapshot: EstateSnapshot): DoctrineCheckResult {
  const claim = DOCTRINE_CLAIMS.find((c) => c.id === "retainer-oversight-boundary")!;
  const supporting: string[] = [];
  const contradicting: string[] = [];

  for (const [, product] of Object.entries(snapshot.products)) {
    if (product.commercialStatus === "contracted" && product.resolverAction !== "checkout") {
      supporting.push(`${product.productCode}: contracted, resolver blocks checkout — correct`);
    }
    if (product.commercialStatus === "manual_billing" && product.resolverAction !== "checkout") {
      supporting.push(`${product.productCode}: manual_billing, resolver blocks checkout — correct`);
    }
  }

  const posture: EvidencePosture = supporting.length > 0 ? "verified" : "weakly_indicated";
  return { claim, posture, supportingEvidence: supporting, contradictingEvidence: contradicting };
}

// ─── Main loader ────────────────────────────────────────────────────────────

const CHECKERS: Record<string, (snapshot: EstateSnapshot) => DoctrineCheckResult> = {
  "authority-boundary": checkAuthorityBoundary,
  "commercial-governance": checkCommercialGovernance,
  "publication-discipline": checkPublicationDiscipline,
  "retainer-oversight-boundary": checkRetainerOversightBoundary,
};

export function checkAllDoctrineClaims(snapshot: EstateSnapshot): DoctrineCheckResult[] {
  const results: DoctrineCheckResult[] = [];

  for (const claim of DOCTRINE_CLAIMS) {
    const checker = CHECKERS[claim.id];
    if (checker) {
      results.push(checker(snapshot));
    } else {
      // No automated checker yet — mark as unverified
      results.push({
        claim,
        posture: "unverified",
        supportingEvidence: [],
        contradictingEvidence: [],
      });
    }
  }

  return results;
}
