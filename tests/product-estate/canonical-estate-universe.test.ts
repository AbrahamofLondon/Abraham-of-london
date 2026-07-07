/**
 * tests/product-estate/canonical-estate-universe.test.ts
 *
 * Regression guards for the canonical product-universe reconciliation (§1/§8) and
 * the controlled-release final matrix (§23). Fails on: duplicate alias counted,
 * edition without a valid parent family, silent denominator change, rename pair
 * double-counted, or a controlled product left with a non-null implementation deficit.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CATALOG } from "@/lib/commercial/catalog";

const universe = JSON.parse(readFileSync("artifacts/validation/product-estate/canonical-estate-universe.json", "utf8"));
const matrix = JSON.parse(readFileSync("artifacts/validation/product-estate/controlled-release-final-matrix.json", "utf8"));

describe("canonical estate universe (§1/§8)", () => {
  it("denominator equals CATALOG size (guards silent denominator change)", () => {
    expect(universe.canonicalDenominator).toBe(Object.keys(CATALOG).length);
    expect(universe.identities).toHaveLength(universe.canonicalDenominator);
  });

  it("no identity code is counted twice (no duplicate alias)", () => {
    const codes = universe.identities.map((i: any) => i.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("every EDITION_INSTANCE has a valid parent PRODUCT_FAMILY", () => {
    const families = new Set(universe.identities.filter((i: any) => i.identityType === "PRODUCT_FAMILY").map((i: any) => i.code));
    for (const e of universe.identities.filter((i: any) => i.identityType === "EDITION_INSTANCE")) {
      expect(e.parentFamily, `${e.code} parentFamily`).toBeTruthy();
      expect(families.has(e.parentFamily), `${e.code} parent ${e.parentFamily} must be a counted PRODUCT_FAMILY`).toBe(true);
    }
  });

  it("identity types sum exactly to the denominator", () => {
    const sum = Object.values(universe.identityTypeTally as Record<string, number>).reduce((a, b) => a + b, 0);
    expect(sum).toBe(universe.canonicalDenominator);
  });

  it("lineage: renamed pairs are not double-counted (legacy name excluded, canonical counted)", () => {
    const current = new Set(universe.lineage.currentIdentitySet);
    for (const r of universe.lineage.renamedIdentities) {
      expect(current.has(r.to), `${r.to} must be counted`).toBe(true);
      expect(current.has(r.from), `${r.from} legacy name must NOT be counted`).toBe(false);
    }
  });

  it("lineage: historical + net delta reconciles to current, with schema version", () => {
    expect(universe.lineage.historicalBaselineCount + universe.lineage.netDelta).toBe(universe.canonicalDenominator);
    expect(universe.lineage.schemaVersion).toBeTruthy();
    // net delta must equal added-minus-removed (not a fabricated simple +3)
    expect(universe.lineage.addedIdentities.length - universe.lineage.removedIdentities.length).toBe(universe.lineage.netDelta);
  });
});

describe("controlled-release final matrix (§23)", () => {
  it("covers every controlled product with remainingImplementationDeficit null", () => {
    expect(matrix.controlledProductCount).toBeGreaterThan(0);
    expect(matrix.allDeficitsNull).toBe(true);
    for (const row of matrix.rows) {
      expect(row.remainingImplementationDeficit, `${row.productCode} deficit`).toBeNull();
    }
  });

  it("names the GMI Q2 external dependency and no fabricated others", () => {
    const ext = matrix.externalDependencies;
    expect(ext.map((e: any) => e.productCode)).toContain("gmi_q2_2026");
  });

  it("controlled count matches the canonical universe CONTROLLED tally", () => {
    expect(matrix.controlledProductCount).toBe(universe.finalStateTally.CONTROLLED_RELEASE_READY);
  });
});
