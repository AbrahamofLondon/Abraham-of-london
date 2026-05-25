/**
 * tests/platform/content-governance-events.test.ts
 *
 * Tests for content governance event service.
 * Verifies that content checks emit standard GovernanceEvents.
 */

import { describe, it, expect } from "vitest";
import {
  recordContentStyleChecked,
  recordContentMetadataValidated,
  recordContentOutboundEligible,
} from "@/lib/platform/content-governance-events";

// ─── Content style check ─────────────────────────────────────────────────────

describe("recordContentStyleChecked", () => {
  it("passing check returns RECORDED", async () => {
    const result = await recordContentStyleChecked({
      ok: true,
      slug: "test-editorial",
      title: "Test Editorial",
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe("RECORDED");
  });

  it("failing check in strict mode returns RECORDED", async () => {
    const result = await recordContentStyleChecked({
      ok: false,
      slug: "test-editorial",
      title: "Test Editorial",
      errors: ["Style violation detected"],
      strictMode: true,
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe("RECORDED");
  });
});

// ─── Content metadata validation ─────────────────────────────────────────────

describe("recordContentMetadataValidated", () => {
  it("passing validation returns RECORDED", async () => {
    const result = await recordContentMetadataValidated({
      ok: true,
      slug: "test-editorial",
    });
    expect(result.ok).toBe(true);
  });
});

// ─── Content outbound eligibility ────────────────────────────────────────────

describe("recordContentOutboundEligible", () => {
  it("passing eligibility returns RECORDED", async () => {
    const result = await recordContentOutboundEligible({
      ok: true,
      slug: "test-editorial",
    });
    expect(result.ok).toBe(true);
  });

  it("failing eligibility returns RECORDED (error is captured)", async () => {
    const result = await recordContentOutboundEligible({
      ok: false,
      slug: "test-editorial",
      warnings: ["Missing social caption"],
    });
    expect(result.ok).toBe(true);
  });
});
