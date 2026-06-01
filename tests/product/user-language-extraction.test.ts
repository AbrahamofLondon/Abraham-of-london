/**
 * tests/product/user-language-extraction.test.ts
 *
 * Tests for the user language extraction helper.
 *
 * Covers:
 * - Up to 3 quotes returned
 * - Empty quotes filtered
 * - Short fragments under 8 chars excluded
 * - Duplicate quotes collapsed
 * - Purpose Alignment extracts only user-entered context answers
 * - No TypeScript errors
 */

import { describe, it, expect } from "vitest";
import {
  extractSafeUserLanguageQuotes,
  extractPurposeAlignmentQuotes,
} from "@/lib/product/user-language-extraction";

// ─── 1. Up to 3 quotes returned ──────────────────────────────────────────────

describe("extractSafeUserLanguageQuotes", () => {
  it("returns up to 3 quotes", () => {
    const result = extractSafeUserLanguageQuotes([
      "First quote here",
      "Second quote here",
      "Third quote here",
      "Fourth quote here",
    ]);
    expect(result.length).toBe(3);
    expect(result[0]).toBe("First quote here");
    expect(result[1]).toBe("Second quote here");
    expect(result[2]).toBe("Third quote here");
  });

  it("respects custom limit option", () => {
    const result = extractSafeUserLanguageQuotes(
      ["One", "Two", "Three", "Four"].map(s => s + " is a long enough string"),
      { limit: 2 },
    );
    expect(result.length).toBe(2);
  });
});

// ─── 2. Empty quotes filtered ───────────────────────────────────────────────

describe("empty quote filtering", () => {
  it("filters out null values", () => {
    const result = extractSafeUserLanguageQuotes([
      null,
      "A valid quote here",
      undefined,
      "Another valid quote",
    ]);
    expect(result.length).toBe(2);
    expect(result).toContain("A valid quote here");
  });

  it("filters out empty strings", () => {
    const result = extractSafeUserLanguageQuotes([
      "",
      "   ",
      "A real user statement",
    ]);
    expect(result.length).toBe(1);
    expect(result[0]).toBe("A real user statement");
  });

  it("returns empty array when all inputs are empty", () => {
    const result = extractSafeUserLanguageQuotes(["", null, undefined]);
    expect(result.length).toBe(0);
  });
});

// ─── 3. Short fragments under 8 chars excluded ──────────────────────────────

describe("short fragment exclusion", () => {
  it("excludes fragments under 8 characters", () => {
    const result = extractSafeUserLanguageQuotes([
      "Hi",
      "OK",
      "No",
      "A longer valid statement here",
    ]);
    expect(result.length).toBe(1);
    expect(result[0]).toBe("A longer valid statement here");
  });

  it("respects custom minLength option", () => {
    const result = extractSafeUserLanguageQuotes(
      ["Short", "A longer valid statement"],
      { minLength: 10 },
    );
    expect(result.length).toBe(1);
    expect(result[0]).toBe("A longer valid statement");
  });
});

// ─── 4. Duplicate quotes collapsed ───────────────────────────────────────────

describe("duplicate collapse", () => {
  it("collapses duplicate quotes (case-insensitive)", () => {
    const result = extractSafeUserLanguageQuotes([
      "I need to decide whether to restructure",
      "I NEED TO DECIDE WHETHER TO RESTRUCTURE",
      "Another unique statement",
    ]);
    expect(result.length).toBe(2);
    expect(result[0]).toBe("I need to decide whether to restructure");
  });

  it("collapses duplicates with different whitespace", () => {
    const result = extractSafeUserLanguageQuotes([
      "The  board  is  split",
      "The board is split",
    ]);
    expect(result.length).toBe(1);
  });
});

// ─── 5. Purpose Alignment extracts only user-entered context answers ─────────

describe("extractPurposeAlignmentQuotes", () => {
  it("extracts from avoided decision, competing obligation, and consequence", () => {
    const result = extractPurposeAlignmentQuotes({
      avoidedDecision: "Whether to fire the COO",
      competingObligation: "Maintaining current project deadlines",
      consequence: "Team burnout and missed quarterly targets",
    });
    expect(result.length).toBe(3);
    expect(result[0]).toBe("Whether to fire the COO");
    expect(result[1]).toBe("Maintaining current project deadlines");
    expect(result[2]).toBe("Team burnout and missed quarterly targets");
  });

  it("filters out short or empty context answers", () => {
    const result = extractPurposeAlignmentQuotes({
      avoidedDecision: "No",
      competingObligation: "",
      consequence: "A meaningful consequence statement here",
    });
    expect(result.length).toBe(1);
    expect(result[0]).toBe("A meaningful consequence statement here");
  });

  it("returns empty array when all answers are too short", () => {
    const result = extractPurposeAlignmentQuotes({
      avoidedDecision: "Hi",
      competingObligation: "OK",
      consequence: "",
    });
    expect(result.length).toBe(0);
  });
});
