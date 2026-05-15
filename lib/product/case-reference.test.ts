import { describe, expect, it } from "vitest";

import {
  generateCaseReference,
  isValidCaseReference,
  parseCaseReferenceDate,
} from "./case-reference";

describe("generateCaseReference", () => {
  it("returns a string matching CASE-YYMM-XXXX format", () => {
    const ref = generateCaseReference("journey_key_001");
    expect(ref).toMatch(/^CASE-\d{4}-[A-F0-9]{4}$/);
  });

  it("produces the same reference for the same seed", () => {
    const ref1 = generateCaseReference("stable_seed");
    const ref2 = generateCaseReference("stable_seed");
    expect(ref1).toBe(ref2);
  });

  it("produces different references for different seeds", () => {
    const ref1 = generateCaseReference("seed_a");
    const ref2 = generateCaseReference("seed_b");
    expect(ref1).not.toBe(ref2);
  });

  it("handles empty seed without crashing", () => {
    const ref = generateCaseReference("");
    expect(ref).toMatch(/^CASE-\d{4}-[A-F0-9]{4}$/);
  });

  it("handles long seed without crashing", () => {
    const ref = generateCaseReference("a".repeat(1000));
    expect(ref).toMatch(/^CASE-\d{4}-[A-F0-9]{4}$/);
  });
});

describe("isValidCaseReference", () => {
  it("returns true for valid references", () => {
    expect(isValidCaseReference("CASE-2605-A3F2")).toBe(true);
    expect(isValidCaseReference("CASE-2512-0000")).toBe(true);
    expect(isValidCaseReference("CASE-2401-FFFF")).toBe(true);
  });

  it("returns false for invalid references", () => {
    expect(isValidCaseReference("")).toBe(false);
    expect(isValidCaseReference("CASE-2605")).toBe(false);
    expect(isValidCaseReference("2605-A3F2")).toBe(false);
    expect(isValidCaseReference("case-2605-a3f2")).toBe(false);
    expect(isValidCaseReference("CASE-2605-A3F")).toBe(false);
    expect(isValidCaseReference("CASE-2605-A3F22")).toBe(false);
    expect(isValidCaseReference("CASE-2605-A3FZ")).toBe(false);
  });
});

describe("parseCaseReferenceDate", () => {
  it("extracts year and month from valid reference", () => {
    const result = parseCaseReferenceDate("CASE-2605-A3F2");
    expect(result).toEqual({ year: "2026", month: "05" });
  });

  it("returns null for invalid reference", () => {
    expect(parseCaseReferenceDate("invalid")).toBeNull();
  });
});
