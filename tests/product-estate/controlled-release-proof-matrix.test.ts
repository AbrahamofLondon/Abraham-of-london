import { describe, expect, it } from "vitest";
import { buildControlledReleaseProofMatrix } from "@/lib/fulfilment/controlled-release-proof-matrix";
import { generateAllVerdicts } from "@/lib/fulfilment/estate-verdict-layer";

describe("controlled-release proof matrix", () => {
  it("proves every controlled product has an enforceable intentional or external boundary", () => {
    const expected = generateAllVerdicts().filter((v) => v.disposition === "CONTROLLED_RELEASE_READY");
    const matrix = buildControlledReleaseProofMatrix();

    expect(matrix).toHaveLength(expected.length);
    expect(matrix.map((r) => r.productCode).sort()).toEqual(expected.map((v) => v.productCode).sort());
    expect(matrix.filter((r) => r.primaryClass === "TEMPORARY_IMPLEMENTATION_DEFICIT")).toEqual([]);

    const classCounts = matrix.reduce<Record<string, number>>((acc, row) => {
      acc[row.primaryClass] = (acc[row.primaryClass] ?? 0) + 1;
      return acc;
    }, {});
    expect((classCounts.EXTERNAL_EVIDENCE_DEPENDENCY ?? 0) + (classCounts.INTENTIONAL_GOVERNANCE_CONTROL ?? 0)).toBe(matrix.length);

    for (const row of matrix) {
      expect(row.reasonForControl.length, row.productCode).toBeGreaterThan(20);
      expect(row.accessMode, row.productCode).not.toBe("checkout");
      expect(row.ownerOrReviewer.length, row.productCode).toBeGreaterThan(3);
      expect(row.escalationRoute.length, row.productCode).toBeGreaterThan(1);

      for (const [key, value] of Object.entries(row)) {
        if (value && typeof value === "object" && "proven" in value) {
          expect(value.proven, `${row.productCode}.${key}: ${value.evidence}`).toBe(true);
        }
      }
    }
  }, 60000);
});
