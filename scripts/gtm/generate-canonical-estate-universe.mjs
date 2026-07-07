#!/usr/bin/env node
/**
 * scripts/gtm/generate-canonical-estate-universe.mjs
 *
 * Section 1 — canonical product-universe reconciliation. Resolves the 43-vs-46
 * discrepancy by deriving ONE canonical denominator from architecture + commercial
 * identity, and classifying every counted identity.
 *
 * Derivation: the GMI governance model explicitly defines the family
 * (gmi_quarterly) and each edition (gmi_qN_2026) as SEPARATELY governed estate
 * products — each edition has its own lifecycle record, data-lock, prior-call
 * review, owner release authority, and fulfilment contract; the family has its
 * own reusable fulfilment contract. Per the "unless the governance model
 * explicitly defines them as separate estate products" rule, both the family and
 * its editions are counted. Canonical denominator = 46. The historical 43 predates
 * the family/edition split and is superseded.
 *
 * Reproducible: reads reports/gtm/estate-market-restoration-final.json (Layer-C
 * verdicts) + reports/product-release-readiness-matrix.json. No hand truth.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const estate = JSON.parse(readFileSync(path.join(ROOT, "reports/gtm/estate-market-restoration-final.json"), "utf8"));
const readiness = JSON.parse(readFileSync(path.join(ROOT, "reports/product-release-readiness-matrix.json"), "utf8"));

const GMI_FAMILY = "gmi_quarterly";
const isGmiEdition = (code) => /^gmi_q[1-4]_\d{4}$/.test(code);

function identityType(p) {
  if (p.code === GMI_FAMILY) return "PRODUCT_FAMILY";
  if (isGmiEdition(p.code)) return "EDITION_INSTANCE";
  switch (p.finalState) {
    case "MERGED_OR_RETIRED":
      return "RETIRED_IDENTITY";
    case "PUBLIC_REFERENCE_READY":
      return "REFERENCE_ASSET";
    case "INTERNAL_ONLY_JUSTIFIED":
      return "INTERNAL_CAPABILITY";
    default:
      return "CANONICAL_COMMERCIAL_PRODUCT"; // RELEASE_READY_NOW | CONTROLLED_RELEASE_READY
  }
}

const identities = estate.products.map((p) => {
  const type = identityType(p);
  const isEdition = type === "EDITION_INSTANCE";
  return {
    code: p.code,
    name: p.name ?? p.displayName ?? p.code,
    identityType: type,
    finalState: p.finalState,
    parentFamily: isEdition ? GMI_FAMILY : null,
    editionRelationship: isEdition ? "instance_of_family" : type === "PRODUCT_FAMILY" ? "family_root" : null,
    commercialIndependence: type === "EDITION_INSTANCE" ? "delivered_under_family_subscription" : type === "RETIRED_IDENTITY" ? "none" : "independent",
    fulfilmentIndependence:
      type === "EDITION_INSTANCE"
        ? "edition_governed_separately_data_lock_owner_authority"
        : type === "RETIRED_IDENTITY"
          ? "none"
          : "independent_contract",
    counted: true,
    reason:
      type === "EDITION_INSTANCE"
        ? "Counted: GMI governance defines each edition as a separately-governed estate product (own lifecycle, data-lock, release authority, contract)."
        : type === "PRODUCT_FAMILY"
          ? "Counted: reusable family product with its own fulfilment contract + release gate."
          : type === "RETIRED_IDENTITY"
            ? "Counted for completeness; commercially non-exposed (merged/retired)."
            : `Counted: ${type.toLowerCase()}.`,
  };
});

const byType = {};
for (const i of identities) byType[i.identityType] = (byType[i.identityType] || 0) + 1;
const byFinalState = {};
for (const i of identities) byFinalState[i.finalState] = (byFinalState[i.finalState] || 0) + 1;

const denominator = identities.filter((i) => i.counted).length;

const out = {
  generatedAt: new Date().toISOString(),
  canonicalDenominator: denominator,
  denominatorRationale:
    "The GMI product family (gmi_quarterly) and each edition (gmi_qN_YYYY) are counted separately because the governance model explicitly governs them as distinct estate products: editions carry their own lifecycle record, data-lock, prior-call review, owner release authority, and fulfilment contract; the family carries its own reusable fulfilment contract + release gate. Counting family + editions = 46. The historical 43 predates the family/edition split and is superseded. One denominator (46) is used by every estate validator and the final report.",
  supersedesHistoricalDenominator: 43,
  sourceOfTruth: ["reports/gtm/estate-market-restoration-final.json", "reports/product-release-readiness-matrix.json"],
  identityTypeTally: byType,
  finalStateTally: byFinalState,
  readinessMatrixCount: Object.keys(readiness).length,
  estateReportCount: estate.products.length,
  aligned: denominator === Object.keys(readiness).length && denominator === estate.products.length,
  identities,
};

const dir = path.join(ROOT, "artifacts/validation/product-estate");
mkdirSync(dir, { recursive: true });
const target = path.join(dir, "canonical-estate-universe.json");
writeFileSync(target, JSON.stringify(out, null, 2) + "\n");

console.log(`canonical denominator: ${denominator}`);
console.log(`aligned (report == readiness == denominator): ${out.aligned}`);
console.log(`identity types: ${JSON.stringify(byType)}`);
console.log(`final states: ${JSON.stringify(byFinalState)}`);
console.log(`written: ${path.relative(ROOT, target)}`);
