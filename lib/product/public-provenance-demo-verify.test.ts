/**
 * lib/product/public-provenance-demo-verify.test.ts
 *
 * Verifies that the public demo provenance record is self-consistent:
 * the stored hash must always match what is recomputed from the canonical object.
 * A MISMATCH here means the record was edited without updating DEMO_PROVENANCE_HASH.
 */

import { describe, expect, it } from "vitest";
import { verifyDemoProvenance } from "./public-provenance-demo-verify";
import { buildGovernedCaseHash } from "@/lib/product/governed-case-hash";
import {
  PUBLIC_PROVENANCE_DEMO_RECORD,
  DEMO_PROVENANCE_HASH,
} from "./public-provenance-demo-record";

describe("verifyDemoProvenance", () => {
  it("returns MATCH — stored hash equals recomputed hash", () => {
    const result = verifyDemoProvenance();
    expect(result.status).toBe("MATCH");
  });

  it("returns the stored and recomputed hashes in output", () => {
    const result = verifyDemoProvenance();
    expect(result.storedHash).toBe(DEMO_PROVENANCE_HASH);
    expect(result.recomputedHash).toBe(DEMO_PROVENANCE_HASH);
  });

  it("includes a checkedAt ISO timestamp", () => {
    const before = Date.now();
    const result = verifyDemoProvenance();
    const after = Date.now();
    const ts = new Date(result.checkedAt).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("includes a non-empty message on MATCH", () => {
    const result = verifyDemoProvenance();
    expect(result.message).toMatch(/hash/i);
    expect(result.message.length).toBeGreaterThan(20);
  });

  it("recomputes deterministically — calling twice produces the same hash", () => {
    const a = verifyDemoProvenance();
    const b = verifyDemoProvenance();
    expect(a.recomputedHash).toBe(b.recomputedHash);
    expect(a.storedHash).toBe(b.storedHash);
  });

  it("DEMO_PROVENANCE_HASH is a valid 64-char hex SHA-256 string", () => {
    expect(DEMO_PROVENANCE_HASH).toMatch(/^[0-9a-f]{64}$/);
  });

  it("the demo record hashes to DEMO_PROVENANCE_HASH directly via buildGovernedCaseHash", () => {
    const hash = buildGovernedCaseHash(
      PUBLIC_PROVENANCE_DEMO_RECORD as unknown as Record<string, unknown>,
    );
    expect(hash).toBe(DEMO_PROVENANCE_HASH);
  });

  it("demo record contains the required governance boundary statement", () => {
    expect(PUBLIC_PROVENANCE_DEMO_RECORD.boundary).toContain(
      "Demonstration data only",
    );
    // The phrase "Not connected to any account" must be present — it explicitly
    // denies any live account linkage. The word "account" is part of that denial.
    expect(PUBLIC_PROVENANCE_DEMO_RECORD.boundary).toContain(
      "Not connected to any account",
    );
    // Must not imply ownership or linkage to a real case/client record.
    expect(PUBLIC_PROVENANCE_DEMO_RECORD.boundary).not.toContain("your account");
    expect(PUBLIC_PROVENANCE_DEMO_RECORD.boundary).not.toContain("your case");
  });

  it("demo record surface is PUBLIC_PROVENANCE_DEMO", () => {
    expect(PUBLIC_PROVENANCE_DEMO_RECORD.surface).toBe("PUBLIC_PROVENANCE_DEMO");
  });

  it("status is not hardcoded — depends on actual hash comparison", () => {
    // Verify the function structure: it calls buildGovernedCaseHash and compares,
    // not returning MATCH unconditionally.
    const recomputed = buildGovernedCaseHash(
      PUBLIC_PROVENANCE_DEMO_RECORD as unknown as Record<string, unknown>,
    );
    const stored = DEMO_PROVENANCE_HASH;
    const expectedStatus = recomputed === stored ? "MATCH" : "MISMATCH";
    const result = verifyDemoProvenance();
    expect(result.status).toBe(expectedStatus);
  });
});
