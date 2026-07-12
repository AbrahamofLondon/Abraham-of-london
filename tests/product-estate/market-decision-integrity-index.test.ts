/**
 * tests/product-estate/market-decision-integrity-index.test.ts
 *
 * §9 — DII tests: score calculation, coverage detection, edition trend, NULL-headline behaviour.
 */
import { describe, it, expect } from "vitest";
import { calculateDecisionIntegrityIndex, resolveVerifiedMarketEvidence } from "../../lib/intelligence/accountability/market-decision-integrity-index";
import type { ReceiptRegistry, SourceEvidenceProvider } from "../../lib/intelligence/accountability/market-decision-integrity-index";
import { MARKET_CALL_LEDGER } from "../../lib/intelligence/market-intelligence-call-ledger";

function makeRegistry(): ReceiptRegistry {
  return { getReceipt: () => null };
}

function makeSourceProvider(): SourceEvidenceProvider {
  return { getVerifiedCalls: () => null };
}

describe("Market Decision Integrity Index", () => {
  it("default (no evidence) returns empty state", () => {
    const dii = calculateDecisionIntegrityIndex();
    expect(dii).toBeDefined();
    expect(dii.methodologyVersion).toBe("1.0.0");
    expect(dii.generatedAt).toBeTruthy();
    expect(dii.coverage.totalCalls).toBe(0);
    expect(dii.componentScores).toEqual([]);
    expect(dii.editionTrend).toEqual([]);
  });

  it("default (no evidence) returns PRELIMINARY with null headline", () => {
    const dii = calculateDecisionIntegrityIndex();
    expect(dii.publicationStatus).toBe("PRELIMINARY");
    expect(dii.headlineScore).toBeNull();
  });

  it("resolveVerifiedMarketEvidence returns null without receipt in registry", () => {
    const result = resolveVerifiedMarketEvidence({
      editionId: "GMI-Q1-2026",
      receiptId: "any-receipt",
      receiptRegistry: makeRegistry(),
      sourceEvidence: makeSourceProvider(),
    });
    expect(result).toBeNull();
  });

  it("resolveVerifiedMarketEvidence returns null when receipt registry returns null", () => {
    const result = resolveVerifiedMarketEvidence({
      editionId: "GMI-Q1-2026",
      receiptId: "nonexistent",
      receiptRegistry: { getReceipt: () => null },
      sourceEvidence: makeSourceProvider(),
    });
    expect(result).toBeNull();
  });
});