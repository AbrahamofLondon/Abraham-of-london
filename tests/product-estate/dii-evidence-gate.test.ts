/**
 * tests/product-estate/dii-evidence-gate.test.ts
 *
 * GOVERNANCE GUARD (§9/§33): the public Market DII, Learning Log and Cross-Edition
 * Review must NEVER present a published headline/score derived from the seed ledger
 * (which is explicitly "NOT RUNTIME SOURCE OF TRUTH"). Seed evidence → PREVIEW only.
 * A published headline requires AUTHORITATIVE injected calls AND coverage threshold.
 */

import { describe, it, expect } from "vitest";
import { calculateDecisionIntegrityIndex } from "@/lib/intelligence/accountability/market-decision-integrity-index";
import { getPublicLearningLog } from "@/lib/intelligence/accountability/public-decision-learning-log";
import { getPublicCrossEditionReview } from "@/lib/intelligence/accountability/cross-edition-call-review";
import { resolveMarketAccountabilityEvidence } from "@/lib/intelligence/accountability/market-accountability-evidence";

describe("§9/§33 DII evidence gate — no fabricated public metric from seed data", () => {
  it("default DII (seed evidence) is PREVIEW with a withheld headline", () => {
    const dii = calculateDecisionIntegrityIndex();
    expect(dii.publicationStatus).toBe("PREVIEW");
    expect(dii.evidenceMode).toBe("PREVIEW_SEED");
    expect(dii.headlineScore).toBeNull();
    // no edition may show a published score in preview
    expect(dii.editionTrend.every((e) => e.diiScore === null)).toBe(true);
  });

  it("empty authoritative evidence is still PREVIEW (fail-safe toward withholding)", () => {
    const dii = calculateDecisionIntegrityIndex({ authoritativeCalls: [] });
    expect(dii.publicationStatus).toBe("PREVIEW");
    expect(dii.headlineScore).toBeNull();
  });

  it("publishes a headline ONLY on authoritative evidence that meets coverage", () => {
    // reuse the seed calls but mark them authoritative (as a persisted source would)
    const seed = resolveMarketAccountabilityEvidence().calls;
    const dii = calculateDecisionIntegrityIndex({ authoritativeCalls: seed });
    expect(dii.evidenceMode).toBe("AUTHORITATIVE");
    // with authoritative evidence + sufficient coverage, a headline is emitted
    expect(dii.publicationStatus).toBe("PUBLISHABLE");
    expect(typeof dii.headlineScore).toBe("number");
  });

  it("learning log and cross-edition review default to labelled PREVIEW", () => {
    expect(getPublicLearningLog().preview).toBe(true);
    expect(getPublicCrossEditionReview().preview).toBe(true);
  });
});
