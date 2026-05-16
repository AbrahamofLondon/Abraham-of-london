/**
 * tests/pages/api/provenance/demo-verify.test.ts
 *
 * Contract tests for GET /api/provenance/demo-verify.
 *
 * These tests verify the handler's output contract by calling verifyDemoProvenance()
 * directly (the same function the handler calls). The handler itself is a thin
 * wrapper — we test the contract shape and the integrity of the underlying result.
 *
 * HTTP-layer tests (method enforcement, rate limiting, headers) are covered
 * separately via integration runs; they require a live Next.js server.
 */

import { describe, expect, it } from "vitest";
import { verifyDemoProvenance } from "@/lib/product/public-provenance-demo-verify";
import { DEMO_PROVENANCE_HASH } from "@/lib/product/public-provenance-demo-record";

describe("GET /api/provenance/demo-verify — response contract", () => {
  it("returns status MATCH for the canonical demo record", () => {
    const result = verifyDemoProvenance();
    expect(result.status).toBe("MATCH");
  });

  it("response shape contains all required fields", () => {
    const result = verifyDemoProvenance();
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("storedHash");
    expect(result).toHaveProperty("recomputedHash");
    expect(result).toHaveProperty("checkedAt");
    expect(result).toHaveProperty("message");
  });

  it("storedHash equals the published DEMO_PROVENANCE_HASH constant", () => {
    const result = verifyDemoProvenance();
    expect(result.storedHash).toBe(DEMO_PROVENANCE_HASH);
  });

  it("recomputedHash equals storedHash on MATCH", () => {
    const result = verifyDemoProvenance();
    expect(result.recomputedHash).toBe(result.storedHash);
  });

  it("checkedAt is a valid ISO 8601 timestamp", () => {
    const before = Date.now();
    const result = verifyDemoProvenance();
    const after = Date.now();
    const ts = new Date(result.checkedAt).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
    expect(result.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("message is a non-empty human-readable string on MATCH", () => {
    const result = verifyDemoProvenance();
    expect(typeof result.message).toBe("string");
    expect(result.message.length).toBeGreaterThan(20);
    expect(result.message).toMatch(/hash/i);
  });

  it("does not expose internal or suppression fields", () => {
    const result = verifyDemoProvenance();
    const serialised = JSON.stringify(result);
    expect(serialised).not.toContain("operatorNotes");
    expect(serialised).not.toContain("suppressedReason");
    expect(serialised).not.toContain("internalNotes");
    expect(serialised).not.toContain("governanceEvents");
    expect(serialised).not.toContain("actorId");
  });

  it("response is serialisable as JSON (no circular references)", () => {
    const result = verifyDemoProvenance();
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("hashes are valid 64-char hex SHA-256 strings", () => {
    const result = verifyDemoProvenance();
    expect(result.storedHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.recomputedHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("status field is one of the permitted values", () => {
    const result = verifyDemoProvenance();
    expect(["MATCH", "MISMATCH", "UNAVAILABLE"]).toContain(result.status);
  });

  it("calling the endpoint twice returns identical hashes (deterministic)", () => {
    const a = verifyDemoProvenance();
    const b = verifyDemoProvenance();
    expect(a.storedHash).toBe(b.storedHash);
    expect(a.recomputedHash).toBe(b.recomputedHash);
    expect(a.status).toBe(b.status);
  });
});
