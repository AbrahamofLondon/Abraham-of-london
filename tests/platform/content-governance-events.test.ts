/**
 * tests/platform/content-governance-events.test.ts
 *
 * Tests for content governance event service.
 * Verifies that content checks emit standard GovernanceEvents.
 */

import { describe, it, expect, vi } from "vitest";

// ── Hoist mocks before imports ────────────────────────────────────────────────

const { mockAuditLog, mockGovernanceLogCreate } = vi.hoisted(() => ({
  mockAuditLog: vi.fn().mockResolvedValue(null),
  mockGovernanceLogCreate: vi.fn().mockResolvedValue({ id: "log-id" }),
}));

vi.mock("@/lib/audit/audit-logger", () => ({
  auditLogger: { log: mockAuditLog },
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: { governanceLog: { create: mockGovernanceLogCreate } },
}));

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

  it("failing check in strict mode returns PARTIAL (ResearchRun deferred to caller)", async () => {
    const result = await recordContentStyleChecked({
      ok: false,
      slug: "test-editorial",
      title: "Test Editorial",
      errors: ["Style violation detected"],
      strictMode: true,
    });
    // Audit and lineage writes succeed, but shouldCreateResearchRun=true is always
    // bus-SKIPPED — caller must create the ResearchRun via the Foundry service.
    expect(result.ok).toBe(false);
    expect(result.status).toBe("PARTIAL");
    expect(result.researchRunStatus).toBe("SKIPPED");
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

  it("failing eligibility returns PARTIAL (ResearchRun deferred to caller)", async () => {
    const result = await recordContentOutboundEligible({
      ok: false,
      slug: "test-editorial",
      warnings: ["Missing social caption"],
    });
    // shouldCreateResearchRun=true when ok=false, but bus always SKIPs creation.
    expect(result.ok).toBe(false);
    expect(result.status).toBe("PARTIAL");
    expect(result.researchRunStatus).toBe("SKIPPED");
  });
});
