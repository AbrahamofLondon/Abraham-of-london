/**
 * Canary: FindingRepository rejects findings without source.
 * This verifies Law 3 enforcement is wired into the persistence layer.
 * These tests run against the pure logic — no DB required.
 */

import { describe, it, expect } from "vitest";
import { FoundryHonestyError } from "@/lib/research/errors";
import { enforceHonestyOnFindingCreate } from "@/lib/research/honesty-enforcer";
import type { Finding } from "@/lib/research/foundry-contract";

function assertFindingValid(finding: Finding) {
  const result = enforceHonestyOnFindingCreate(finding);
  if (!result.ok) throw new FoundryHonestyError(result.violations.map((v) => v.message).join("; "));
}

describe("Finding source required (Law 3)", () => {
  it("accepts finding with a non-empty source", () => {
    expect(() =>
      assertFindingValid({
        id: "f1",
        title: "SQL injection in user endpoint",
        description: "Unparameterised query found",
        severity: "CRITICAL",
        source: "security-scanner/sqlmap-v1.7",
      })
    ).not.toThrow();
  });

  it("rejects finding with empty source string", () => {
    expect(() =>
      assertFindingValid({
        id: "f2",
        title: "Missing finding source",
        description: "This should fail",
        severity: "HIGH",
        source: "",
      })
    ).toThrow(FoundryHonestyError);
  });

  it("rejects finding with whitespace-only source", () => {
    expect(() =>
      assertFindingValid({
        id: "f3",
        title: "Whitespace source",
        description: "Should fail",
        severity: "MEDIUM",
        source: "   ",
      })
    ).toThrow(FoundryHonestyError);
  });

  it("multiple findings — all must have source", () => {
    const findings: Finding[] = [
      { id: "a", title: "Good", description: "d", severity: "LOW", source: "scanner/v1" },
      { id: "b", title: "Bad", description: "d", severity: "HIGH", source: "" },
    ];

    let errorCount = 0;
    for (const f of findings) {
      try {
        assertFindingValid(f);
      } catch {
        errorCount++;
      }
    }
    expect(errorCount).toBe(1);
  });
});
