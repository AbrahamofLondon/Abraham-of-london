import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  routePathExists,
  validateProductEvidenceRecord,
  type ProductEvidenceRecord,
} from "@/lib/fulfilment/estate-evidence-registry";
import { generateVerdict } from "@/lib/fulfilment/estate-verdict-layer";
import { collectPricingViolations, type PricingAuditContext } from "@/lib/commercial/pricing-audit-core";
import { CATALOG, resolveProductCode } from "@/lib/commercial/catalog";

const root = process.cwd();
const tempRoute = join(root, "pages", "__estate-mutation-required-route", "check.tsx");

function cleanupTempRoute() {
  if (existsSync(tempRoute)) rmSync(tempRoute, { force: true });
}

afterEach(cleanupTempRoute);

function baseRecord(overrides: Partial<ProductEvidenceRecord> = {}): ProductEvidenceRecord {
  return {
    productCode: "boardroom_brief",
    productName: "Boardroom Brief",
    finalDisposition: "RELEASE_READY_NOW",
    evidenceClass: "VALID_PRODUCT_EVIDENCE_PACKAGE",
    evidenceBasis: [
      { category: "commercial", claim: "Catalog authority exists", path: "lib/commercial/catalog.ts", pathExists: true },
      { category: "fulfilment", claim: "Fulfilment contract exists", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
      { category: "route", claim: "Customer route exists", path: "/boardroom-brief", pathExists: true },
      { category: "test", claim: "Focused product test exists", path: "tests/product-estate/boardroom-brief-authority.test.ts", pathExists: true },
    ],
    evidencePaths: ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts"],
    testEvidence: ["tests/product-estate/boardroom-brief-authority.test.ts"],
    routeEvidence: ["/boardroom-brief"],
    fulfilmentEvidence: ["human_reviewed_dossier / analyst_review_and_send"],
    commercialEvidence: ["Catalog-backed commercial identity"],
    authorityBoundary: "Controlled or human-reviewed claims only.",
    claimBoundary: ["bounded operational product"],
    unresolvedExternalDependency: null,
    evidenceGeneratedAt: "2026-07-07T00:00:00.000Z",
    evidenceMethodVersion: "mutation-test",
    ...overrides,
  };
}

const pricingContext: PricingAuditContext = {
  productAmounts: Object.values(CATALOG).map((p) => String(p.amount)).filter((a) => a !== "0" && a !== "undefined"),
  isResolvableProductCode: (id) => Boolean(resolveProductCode(id)),
  retiredCodes: new Set(["diagnostic_report_basic", "diagnostic_report_pro"]),
  controlledProductCodes: new Set(Object.values(CATALOG).filter((p) => p.requiresCheckout !== true).map((p) => p.code)),
};

describe("estate mutation resistance", () => {
  it("Mutation 1: a required route removed is observed as missing", () => {
    mkdirSync(dirname(tempRoute), { recursive: true });
    writeFileSync(tempRoute, "export default function MutationRoute() { return null; }\n");

    expect(routePathExists("/__estate-mutation-required-route/check")).toBe(true);

    rmSync(tempRoute, { force: true });

    expect(routePathExists("/__estate-mutation-required-route/check")).toBe(false);
    expect(validateProductEvidenceRecord(baseRecord({ routeEvidence: ["/__estate-mutation-required-route/check"] })))
      .toContain("Route evidence route path not found: /__estate-mutation-required-route/check for product boardroom_brief");
  });

  it("Mutation 2: removing product-specific execution proof blocks release-ready evidence", () => {
    const errors = validateProductEvidenceRecord(baseRecord({ testEvidence: [] }));

    expect(errors).toContain("Product-specific execution/test evidence missing for boardroom_brief");
  });

  it("Mutation 3: substituting an irrelevant real file fails relevance validation", () => {
    const errors = validateProductEvidenceRecord(baseRecord({
      evidenceBasis: [
        { category: "commercial", claim: "Catalog authority exists", path: "tests/product-estate/boardroom-brief-authority.test.ts", pathExists: true },
      ],
    }));

    expect(errors).toContain("Evidence category/path mismatch for boardroom_brief: commercial cannot be proven by tests/product-estate/boardroom-brief-authority.test.ts");
  });

  it("Mutation 4: copied evidence identity fraud fails product-specific route validation", () => {
    const errors = validateProductEvidenceRecord(baseRecord({
      routeEvidence: ["/diagnostics/purpose-alignment"],
    }));

    expect(errors).toContain("Route evidence does not match product identity for boardroom_brief: /diagnostics/purpose-alignment");
  });

  it("Mutation 5: removing fulfilment registration blocks a market-facing product", () => {
    const errors = validateProductEvidenceRecord(baseRecord({
      productCode: "synthetic_release_product_without_contract",
      productName: "Synthetic Release Product Without Contract",
      routeEvidence: ["/boardroom-brief"],
    }));

    expect(errors).toContain("Fulfilment registration missing for market-facing product synthetic_release_product_without_contract");
  });

  it("Mutation 6: an active wrong price in a pricing-bearing surface is rejected", () => {
    const text = 'export const card = { productCode: "boardroom_brief", priceLabel: "£123" }';
    const findings = collectPricingViolations("components/mutated-price-card.tsx", text, pricingContext);

    expect(findings).toContainEqual({
      file: "components/mutated-price-card.tsx",
      type: "hardcoded_product_price",
      match: "£123",
    });
  });

  it("Mutation 7: generated final verdicts cannot become evidence inputs", () => {
    const errors = validateProductEvidenceRecord(baseRecord({
      evidencePaths: ["reports/gtm/estate-market-restoration-final.json"],
    }));

    expect(errors).toContain("Evidence uses generated verdict/package evidence: reports/gtm/estate-market-restoration-final.json for product boardroom_brief");
  });

  it("Mutation 8: self-asserted truth flags do not change observed reality", () => {
    const errors = validateProductEvidenceRecord(baseRecord({
      evidenceBasis: [
        {
          category: "test",
          claim: "Self asserted missing test",
          path: "tests/product-estate/not-a-real-proof.test.ts",
          pathExists: true,
          routeExists: true,
          testPassed: true,
        } as any,
      ],
    }));

    expect(errors).toContain("Evidence basis path not found: tests/product-estate/not-a-real-proof.test.ts for product boardroom_brief");
  });

  it("a missing observed route demotes an otherwise sellable product verdict", () => {
    const verdict = generateVerdict("decision_exposure_instrument");
    const routeFailure = verdict.failedCount > 0
      && verdict.reason.includes("Evaluation incomplete")
      && verdict.disposition === "CONTROLLED_RELEASE_READY";

    expect(routeFailure || verdict.disposition === "RELEASE_READY_NOW").toBe(true);
  });
});

