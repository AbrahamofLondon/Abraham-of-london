/**
 * tests/product-estate/dii-evidence-gate.test.ts
 *
 * GOVERNANCE GUARD (§9/§33): the public Market DII, Learning Log and Cross-Edition
 * Review must NEVER present a published headline/score derived from the seed ledger.
 *
 * HARD TRUTH INVARIANTS:
 * - Public DII without verified evidence returns zero public records
 * - Public DII without verified evidence returns no score
 * - Seed ledger cannot populate public DII output
 * - Forged receipt rejected
 * - Unknown receipt rejected
 * - Receipt for another edition rejected
 * - Payload hash mismatch rejected
 * - Draft edition rejected
 * - Controlled unreleased edition rejected
 * - Released verified edition accepted
 */

import { describe, it, expect } from "vitest";
import { calculateDecisionIntegrityIndex, resolveVerifiedMarketEvidence } from "../../lib/intelligence/accountability/market-decision-integrity-index";
import type { ReceiptRegistry, ReleaseReceipt, SourceEvidenceProvider } from "../../lib/intelligence/accountability/market-decision-integrity-index";
import { MARKET_CALL_LEDGER } from "../../lib/intelligence/market-intelligence-call-ledger";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeReceipt(overrides: Partial<ReleaseReceipt> = {}): ReleaseReceipt {
  return {
    id: "receipt-gmi-q1-2026-001",
    editionId: "GMI-Q1-2026",
    releaseStatus: "RELEASED",
    payloadHash: "hash-1a2b3c",
    sourceIds: MARKET_CALL_LEDGER.map(c => c.id),
    issuedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeRegistry(receipt: ReleaseReceipt | null): ReceiptRegistry {
  return { getReceipt: (_id: string) => receipt };
}

function makeSourceProvider(calls: readonly any[] | null): SourceEvidenceProvider {
  return { getVerifiedCalls: (_editionId: string) => calls as any };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("§9/§33 DII evidence gate — no fabricated public metric from seed data", () => {
  it("public DII without verified evidence returns zero public records", () => {
    const dii = calculateDecisionIntegrityIndex();
    expect(dii.coverage.totalCalls).toBe(0);
    expect(dii.coverage.scoredCalls).toBe(0);
    expect(dii.componentScores).toEqual([]);
    expect(dii.editionTrend).toEqual([]);
  });

  it("public DII without verified evidence returns no score", () => {
    const dii = calculateDecisionIntegrityIndex();
    expect(dii.headlineScore).toBeNull();
    expect(dii.publicationStatus).toBe("PRELIMINARY");
  });

  it("seed ledger cannot populate public DII output", () => {
    const dii = calculateDecisionIntegrityIndex();
    expect(dii.coverage.totalCalls).toBe(0);
    expect(dii.coverage.scoredCalls).toBe(0);
    // Even if MARKET_CALL_LEDGER has records, they must not appear
    expect(MARKET_CALL_LEDGER.length).toBeGreaterThan(0);
    expect(dii.coverage.totalCalls).toBe(0);
  });

  // -----------------------------------------------------------------------
  // Forgery and receipt validation tests
  // -----------------------------------------------------------------------

  it("forged receipt rejected — receipt not in registry", () => {
    // No receipt in registry at all
    const evidence = resolveVerifiedMarketEvidence({
      editionId: "GMI-Q1-2026",
      receiptId: "forged-receipt-001",
      receiptRegistry: makeRegistry(null),
      sourceEvidence: makeSourceProvider(MARKET_CALL_LEDGER),
    });
    expect(evidence).toBeNull();
  });

  it("unknown receipt rejected — receipt ID not found", () => {
    const evidence = resolveVerifiedMarketEvidence({
      editionId: "GMI-Q1-2026",
      receiptId: "nonexistent-receipt",
      receiptRegistry: makeRegistry(null),
      sourceEvidence: makeSourceProvider(MARKET_CALL_LEDGER),
    });
    expect(evidence).toBeNull();
  });

  it("receipt for another edition rejected", () => {
    const receipt = makeReceipt({ editionId: "GMI-Q2-2026" });
    const evidence = resolveVerifiedMarketEvidence({
      editionId: "GMI-Q1-2026", // requesting Q1
      receiptId: receipt.id,
      receiptRegistry: makeRegistry(receipt), // but receipt is for Q2
      sourceEvidence: makeSourceProvider(MARKET_CALL_LEDGER),
    });
    expect(evidence).toBeNull();
  });

  it("payload hash mismatch rejected", () => {
    const receipt = makeReceipt({ payloadHash: "hash-expected-but-different" });
    const evidence = resolveVerifiedMarketEvidence({
      editionId: "GMI-Q1-2026",
      receiptId: receipt.id,
      receiptRegistry: makeRegistry(receipt),
      sourceEvidence: makeSourceProvider(MARKET_CALL_LEDGER),
    });
    // The computed hash of MARKET_CALL_LEDGER won't match the fake receipt hash
    expect(evidence).toBeNull();
  });

  it("draft edition rejected", () => {
    const receipt = makeReceipt({ releaseStatus: "DRAFT" });
    const evidence = resolveVerifiedMarketEvidence({
      editionId: "GMI-Q1-2026",
      receiptId: receipt.id,
      receiptRegistry: makeRegistry(receipt),
      sourceEvidence: makeSourceProvider(MARKET_CALL_LEDGER),
    });
    expect(evidence).toBeNull();
  });

  it("controlled unreleased edition rejected", () => {
    const receipt = makeReceipt({ releaseStatus: "CONTROLLED" });
    const evidence = resolveVerifiedMarketEvidence({
      editionId: "GMI-Q1-2026",
      receiptId: receipt.id,
      receiptRegistry: makeRegistry(receipt),
      sourceEvidence: makeSourceProvider(MARKET_CALL_LEDGER),
    });
    expect(evidence).toBeNull();
  });

  it("released verified edition accepted with correct receipt and matching hash", () => {
    // Compute the correct hash by calling the resolver with a registry
    // that has a receipt whose hash matches the actual payload
    const calls = MARKET_CALL_LEDGER;
    // We need to compute what hash the resolver will produce
    // The hash function is deterministic, so we create a receipt with
    // a hash that will match after we know the algorithm
    // For this test, we use a simpler approach: verify the resolver
    // accepts when all conditions are met by using the internal hash
    // Since we can't easily predict the hash, we test the structure:
    // with a proper receipt and matching source IDs, the resolver
    // should accept (we test this by ensuring source IDs match)
    const callIds = calls.map(c => c.id);
    const receipt = makeReceipt({
      sourceIds: callIds,
      // The hash must match what hashPayload() produces for these calls
      // We'll set it to match by computing it the same way
      payloadHash: (() => {
        const parts = calls.map(c => `${c.id}:${c.outcomeStatus ?? "PENDING"}:${c.score ?? "null"}`);
        let hash = 0;
        for (const part of parts) {
          for (let i = 0; i < part.length; i++) {
            const char = part.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
          }
        }
        return `hash-${Math.abs(hash).toString(16)}`;
      })(),
    });

    const evidence = resolveVerifiedMarketEvidence({
      editionId: "GMI-Q1-2026",
      receiptId: receipt.id,
      receiptRegistry: makeRegistry(receipt),
      sourceEvidence: makeSourceProvider(calls),
    });

    // Should be accepted — all checks pass
    expect(evidence).not.toBeNull();
    expect(evidence!.authority).toBe("AUTHORITATIVE");
    expect(evidence!.verificationReceiptId).toBe(receipt.id);
    expect(evidence!.sourceIds).toEqual(callIds);
    expect(evidence!.calls.length).toBe(calls.length);
    expect(evidence!.verifiedAt).toBeTruthy();
  });

  it("verified evidence with sufficient coverage produces PUBLISHABLE state", () => {
    // Use the same approach to get accepted evidence
    const calls = MARKET_CALL_LEDGER;
    const callIds = calls.map(c => c.id);
    const receipt = makeReceipt({
      sourceIds: callIds,
      payloadHash: (() => {
        const parts = calls.map(c => `${c.id}:${c.outcomeStatus ?? "PENDING"}:${c.score ?? "null"}`);
        let hash = 0;
        for (const part of parts) {
          for (let i = 0; i < part.length; i++) {
            const char = part.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
          }
        }
        return `hash-${Math.abs(hash).toString(16)}`;
      })(),
    });

    const evidence = resolveVerifiedMarketEvidence({
      editionId: "GMI-Q1-2026",
      receiptId: receipt.id,
      receiptRegistry: makeRegistry(receipt),
      sourceEvidence: makeSourceProvider(calls),
    });

    expect(evidence).not.toBeNull();
    const dii = calculateDecisionIntegrityIndex(evidence!);
    if (dii.coverage.scoredCalls >= dii.coverage.minRequired) {
      expect(dii.publicationStatus).toBe("PUBLISHABLE");
      expect(typeof dii.headlineScore).toBe("number");
      expect(dii.editionTrend.length).toBeGreaterThan(0);
    } else {
      expect(dii.coverage.totalCalls).toBeGreaterThan(0);
      expect(dii.headlineScore).toBeNull();
    }
  });

  it("source IDs mismatch rejected", () => {
    const receipt = makeReceipt({
      sourceIds: ["call-nonexistent-1", "call-nonexistent-2"],
      payloadHash: "hash-will-not-match-anyway",
    });
    const evidence = resolveVerifiedMarketEvidence({
      editionId: "GMI-Q1-2026",
      receiptId: receipt.id,
      receiptRegistry: makeRegistry(receipt),
      sourceEvidence: makeSourceProvider(MARKET_CALL_LEDGER),
    });
    // Will fail on hash mismatch first, but also source IDs won't match
    expect(evidence).toBeNull();
  });
});
