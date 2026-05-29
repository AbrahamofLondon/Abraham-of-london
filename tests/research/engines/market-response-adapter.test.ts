/**
 * Market Response Adapter — proof tests.
 *
 * Verifies:
 * - Clean fixture produces zero violations (only INFO)
 * - Dirty fixture detects CRITICAL/HIGH violations across expected categories
 * - Forbidden phrase detection (guarantee, urgency, overclaim categories)
 * - Generic SaaS language detection
 * - Unsupported comparative claim detection
 * - Audience clarity detection
 * - Platform length check fires for overlong ad headline
 * - selfTest() passes
 * - Engine version is present in all output
 * - Limitations are explicitly declared
 * - Summary is non-empty
 */

import { describe, it, expect } from "vitest";
import {
  marketResponseAdapter,
  MARKET_RESPONSE_ENGINE_ID,
  MARKET_RESPONSE_VERSION,
} from "@/lib/research/engines/market-response-adapter";

const { run, selfTest } = marketResponseAdapter;

// ─── selfTest ─────────────────────────────────────────────────────────────────

describe("Market Response Adapter — selfTest", () => {
  it("selfTest() passes", async () => {
    const result = await selfTest();
    expect(result.ok).toBe(true);
  });
});

// ─── Clean fixture ────────────────────────────────────────────────────────────

describe("Market Response Adapter — clean fixture", () => {
  it("produces only INFO findings (zero violations)", async () => {
    const result = await run({ payload: { mode: "clean" } });
    const violations = result.findings.filter((f) => f.severity !== "INFO");
    expect(violations).toHaveLength(0);
  });

  it("returns INFO severity overall", async () => {
    const result = await run({ payload: { mode: "clean" } });
    expect(result.severity).toBe("INFO");
  });

  it("includes engine version", async () => {
    const result = await run({ payload: { mode: "clean" } });
    expect(result.engineVersion).toBe(MARKET_RESPONSE_VERSION);
  });

  it("records a non-empty summary", async () => {
    const result = await run({ payload: { mode: "clean" } });
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it("records a positive durationMs", async () => {
    const result = await run({ payload: { mode: "clean" } });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("declares limitations", async () => {
    const result = await run({ payload: { mode: "clean" } });
    expect(result.limitations).toBeDefined();
    expect(result.limitations!.length).toBeGreaterThan(0);
  });

  it("includes formula steps in rawOutput", async () => {
    const result = await run({ payload: { mode: "clean" } });
    const steps = (result.rawOutput as { formulaSteps?: unknown[] })?.formulaSteps;
    expect(Array.isArray(steps)).toBe(true);
    expect(steps!.length).toBeGreaterThan(0);
  });
});

// ─── Dirty fixture ────────────────────────────────────────────────────────────

describe("Market Response Adapter — dirty fixture", () => {
  it("detects at least one CRITICAL finding", async () => {
    const result = await run({ payload: { mode: "dirty" } });
    const critical = result.findings.filter((f) => f.severity === "CRITICAL");
    expect(critical.length).toBeGreaterThan(0);
  });

  it("detects at least one HIGH finding", async () => {
    const result = await run({ payload: { mode: "dirty" } });
    const high = result.findings.filter((f) => f.severity === "HIGH");
    expect(high.length).toBeGreaterThan(0);
  });

  it("detects forbidden guarantee language", async () => {
    const result = await run({ payload: { mode: "dirty" } });
    const guaranteeFindings = result.findings.filter((f) =>
      f.source.includes("FORBIDDEN_GUARANTEE")
    );
    expect(guaranteeFindings.length).toBeGreaterThan(0);
  });

  it("detects forbidden urgency language", async () => {
    const result = await run({ payload: { mode: "dirty" } });
    const urgencyFindings = result.findings.filter((f) =>
      f.source.includes("FORBIDDEN_URGENCY")
    );
    expect(urgencyFindings.length).toBeGreaterThan(0);
  });

  it("detects generic SaaS language", async () => {
    const result = await run({ payload: { mode: "dirty" } });
    const saasFindings = result.findings.filter((f) =>
      f.source.includes("GENERIC_SAAS_LANGUAGE")
    );
    expect(saasFindings.length).toBeGreaterThan(0);
  });

  it("detects unsupported comparative claims", async () => {
    const result = await run({ payload: { mode: "dirty" } });
    const comparativeFindings = result.findings.filter((f) =>
      f.source.includes("UNSUPPORTED_COMPARATIVE_CLAIM")
    );
    expect(comparativeFindings.length).toBeGreaterThan(0);
  });

  it("returns CRITICAL overall severity", async () => {
    const result = await run({ payload: { mode: "dirty" } });
    expect(result.severity).toBe("CRITICAL");
  });

  it("includes engine version", async () => {
    const result = await run({ payload: { mode: "dirty" } });
    expect(result.engineVersion).toBe(MARKET_RESPONSE_VERSION);
  });

  it("records a non-empty summary", async () => {
    const result = await run({ payload: { mode: "dirty" } });
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it("all findings have required fields", async () => {
    const result = await run({ payload: { mode: "dirty" } });
    for (const f of result.findings) {
      expect(f.id).toBeTruthy();
      expect(f.title).toBeTruthy();
      expect(f.description).toBeTruthy();
      expect(f.source).toContain(MARKET_RESPONSE_ENGINE_ID);
      expect(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(f.severity);
    }
  });
});

// ─── Custom text — specific checks ────────────────────────────────────────────

describe("Market Response Adapter — custom text checks", () => {
  it("detects weak CTA verb in custom text", async () => {
    const result = await run({ payload: { text: "Click here to get started.", mode: "analyze" } });
    const ctaFindings = result.findings.filter((f) => f.source.includes("CTA_VERB_CHECK"));
    expect(ctaFindings.length).toBeGreaterThan(0);
  });

  it("detects 'learn more' as weak CTA", async () => {
    const result = await run({ payload: { text: "Learn more about our services.", mode: "analyze" } });
    const ctaFindings = result.findings.filter((f) => f.source.includes("CTA_VERB_CHECK"));
    expect(ctaFindings.length).toBeGreaterThan(0);
  });

  it("passes clean text with no CTA violations", async () => {
    const result = await run({ payload: { text: "Book a diagnostic call to see if we are the right fit.", mode: "analyze" } });
    const ctaFindings = result.findings.filter((f) => f.source.includes("CTA_VERB_CHECK"));
    expect(ctaFindings).toHaveLength(0);
  });

  it("detects vague audience reference 'for anyone'", async () => {
    const result = await run({ payload: { text: "Our service is for anyone in business.", mode: "analyze" } });
    const audienceFindings = result.findings.filter((f) => f.source.includes("AUDIENCE_CLARITY"));
    expect(audienceFindings.length).toBeGreaterThan(0);
  });

  it("detects unsupported 'number one in the UK market' claim", async () => {
    const result = await run({ payload: { text: "We are number one in the UK market for executive coaching.", mode: "analyze" } });
    const comparativeFindings = result.findings.filter((f) => f.source.includes("UNSUPPORTED_COMPARATIVE_CLAIM"));
    expect(comparativeFindings.length).toBeGreaterThan(0);
  });

  it("does not fire headline check when isHeadline=false", async () => {
    const result = await run({ payload: { text: "Innovation and excellence in business strategy outcomes.", mode: "analyze", isHeadline: false } });
    const headlineFindings = result.findings.filter((f) => f.source.includes("HEADLINE_ABSTRACT_NOUN"));
    expect(headlineFindings).toHaveLength(0);
  });

  it("fires headline check when isHeadline=true with 2+ abstract nouns", async () => {
    const result = await run({ payload: { text: "Innovation and excellence in business strategy.", mode: "analyze", isHeadline: true } });
    const headlineFindings = result.findings.filter((f) => f.source.includes("HEADLINE_ABSTRACT_NOUN"));
    expect(headlineFindings.length).toBeGreaterThan(0);
  });
});

// ─── Platform length checks ───────────────────────────────────────────────────

describe("Market Response Adapter — platform length checks", () => {
  it("fires HIGH for ad headline exceeding 30 chars", async () => {
    const result = await run({ payload: { text: "This is a headline that is much too long for an ad", platform: "ad-headline", mode: "analyze" } });
    const lengthFindings = result.findings.filter((f) => f.source.includes("PLATFORM_LENGTH_CHARS") && f.severity === "HIGH");
    expect(lengthFindings.length).toBeGreaterThan(0);
  });

  it("fires HIGH for X post exceeding 280 chars", async () => {
    const longText = "a".repeat(300);
    const result = await run({ payload: { text: longText, platform: "x-post", mode: "analyze" } });
    const lengthFindings = result.findings.filter((f) => f.source.includes("PLATFORM_LENGTH_CHARS") && f.severity === "HIGH");
    expect(lengthFindings.length).toBeGreaterThan(0);
  });

  it("does not fire platform check when platform is 'none'", async () => {
    const result = await run({ payload: { text: "a".repeat(500), platform: "none", mode: "analyze" } });
    const lengthFindings = result.findings.filter((f) => f.source.includes("PLATFORM_LENGTH"));
    expect(lengthFindings).toHaveLength(0);
  });

  it("does not fire for LinkedIn post within 3000 chars", async () => {
    const result = await run({ payload: { text: "a".repeat(100), platform: "linkedin-post", mode: "analyze" } });
    const lengthFindings = result.findings.filter((f) => f.source.includes("PLATFORM_LENGTH_CHARS"));
    expect(lengthFindings).toHaveLength(0);
  });
});

// ─── Engine metadata ──────────────────────────────────────────────────────────

describe("Market Response Adapter — engine metadata", () => {
  it("exports MARKET_RESPONSE_ENGINE_ID = 'market-response'", () => {
    expect(MARKET_RESPONSE_ENGINE_ID).toBe("market-response");
  });

  it("exports a non-empty MARKET_RESPONSE_VERSION", () => {
    expect(MARKET_RESPONSE_VERSION.length).toBeGreaterThan(0);
  });

  it("getVersion() returns the declared version", () => {
    expect(marketResponseAdapter.getVersion()).toBe(MARKET_RESPONSE_VERSION);
  });

  it("rawOutput includes engineId", async () => {
    const result = await run({ payload: { mode: "clean" } });
    expect((result.rawOutput as { engineId?: string })?.engineId).toBe(MARKET_RESPONSE_ENGINE_ID);
  });
});
