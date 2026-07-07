import { existsSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { beforeAll, describe, expect, it } from "vitest";
import { CATALOG } from "@/lib/commercial/catalog";

const reportPath = "reports/gtm/estate-market-restoration-final.json";
const reportMdPath = "reports/gtm/estate-market-restoration-final.md";

function runGenerator() {
  rmSync(reportPath, { force: true });
  rmSync(reportMdPath, { force: true });

  const result = spawnSync("pnpm", ["exec", "tsx", "scripts/gtm/generate-estate-market-restoration.ts"], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  expect(existsSync(reportPath)).toBe(true);
  return JSON.parse(readFileSync(reportPath, "utf8"));
}

describe("estate market restoration final disposition", () => {
  let report: any;

  beforeAll(() => {
    report = runGenerator();
  }, 60_000);

  it("generates the final report from tracked source in a clean worktree", () => {
    const expectedTotal = Object.keys(CATALOG).length;

    expect(report.schemaVersion).toBe("estate-market-restoration-final.v2");
    expect(report.totalProducts).toBe(expectedTotal);
    expect(report.products).toHaveLength(expectedTotal);
    expect(report.unresolved).toBe(0);
    expect(report.releaseReadyNow + report.controlledReleaseReady + report.publicReferenceReady + report.internalOnlyJustified + report.mergedOrRetired).toBe(expectedTotal);
    expect(report.exactTruthStatement).toContain(`${expectedTotal}/${expectedTotal} PRODUCTS DISPOSITIONED`);
  });

  it("writes product evidence packages with source fingerprints and no report-as-evidence dependency", () => {

    for (const product of report.products) {
      expect(existsSync(product.evidencePackage), `${product.code}: missing evidence package`).toBe(true);
      const evidence = JSON.parse(readFileSync(product.evidencePackage, "utf8"));
      expect(evidence.productCode).toBe(product.code);
      expect(evidence.observedDisposition).toBe(product.finalState);
      expect(evidence.sourceFingerprints.length, `${product.code}: source fingerprints`).toBeGreaterThan(0);
      expect(evidence.validationErrors).toEqual([]);
      expect(JSON.stringify(evidence.evidencePaths)).not.toContain("estate-market-restoration-final");
    }
  });

  it("preserves the GMI Q2 controlled pre-release boundary", () => {

    expect(report.gmiBoundary.q2State).toBe("controlled_pre_release");
    expect(report.gmiBoundary.q2CheckoutAllowed).toBe(false);
    expect(report.gmiBoundary.q2StripeProductId).toBeNull();
    expect(report.gmiBoundary.q2StripePriceId).toBeNull();
    expect(report.gmiBoundary.q1Superseded).toBe(false);

    const q2 = report.products.find((p: any) => p.code === "gmi_q2_2026");
    expect(q2.finalState).toBe("CONTROLLED_RELEASE_READY");
    expect(q2.authorityBoundary).toContain("No publication");
  });
});


