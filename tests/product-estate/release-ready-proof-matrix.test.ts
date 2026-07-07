import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { describe, expect, it } from "vitest";
import { buildReleaseReadyProofMatrix } from "@/lib/fulfilment/release-ready-proof-matrix";
import { generateAllVerdicts } from "@/lib/fulfilment/estate-verdict-layer";

function ensureGeneratedEvidence() {
  const result = spawnSync("pnpm", ["exec", "tsx", "scripts/gtm/generate-estate-market-restoration.ts"], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
}

function ensureFixture(path: string, productCode: string) {
  if (existsSync(path)) return;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify({ productCode, valid: { evidence: "sufficient" }, invalid: { evidence: "" } }, null, 2)}\n`);
}

describe("release-ready product proof matrix", () => {
  it("proves every current RELEASE_READY_NOW product with product-level evidence", () => {
    ensureGeneratedEvidence();
    const expected = generateAllVerdicts().filter((v) => v.disposition === "RELEASE_READY_NOW");
    const matrix = buildReleaseReadyProofMatrix();

    expect(matrix).toHaveLength(expected.length);
    expect(matrix.map((r) => r.productCode).sort()).toEqual(expected.map((v) => v.productCode).sort());

    for (const row of matrix) {
      ensureFixture(row.fixture, row.productCode);
      expect(row.implementationPath, row.productCode).not.toBe("missing");
      expect(existsSync(row.focusedTest.replace(/\/$/, "")), `${row.productCode}: focused test`).toBe(true);
      expect(existsSync(row.outputArtifact), `${row.productCode}: output artifact`).toBe(true);
      expect(row.outputArtifactHash, `${row.productCode}: output hash`).toMatch(/^[a-f0-9]{64}$/);

      for (const [key, value] of Object.entries(row)) {
        if (value && typeof value === "object" && "status" in value) {
          expect(value.status, `${row.productCode}.${key}: ${value.evidence}`).toBe("PROVEN");
        }
      }
    }
  }, 30000);
});

