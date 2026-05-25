/**
 * Canary: HonestyEnforcer functions exist and behave as expected.
 * These tests exist to prove the enforcer is wired and callable — not decorative.
 */

import { describe, it, expect } from "vitest";
import {
  enforceHonestyOnCreate,
  enforceHonestyOnArchive,
  enforceHonestyOnDefer,
  enforceHonestyOnFindingCreate,
} from "@/lib/research/honesty-enforcer";
import type { Finding } from "@/lib/research/foundry-contract";

const baseRun = {
  title: "Test Run",
  slug: "test-run",
  runType: "MANUAL" as const,
  module: "test-module",
  moduleVersion: "1.0.0",
  severity: "INFO" as const,
  status: "PENDING" as const,
  isDemo: false,
  requiresOwnerDecision: false,
  driftDetected: false,
  humanReviewRequired: false,
  resurrectionCount: 0,
  schemaVersion: "1.0.0",
};

const validFinding: Finding = {
  id: "f1",
  title: "Test Finding",
  description: "Something went wrong",
  severity: "LOW",
  source: "formula-engine/v1",
};

describe("enforceHonestyOnCreate", () => {
  it("passes when module is not DEMO and findings have sources", () => {
    const result = enforceHonestyOnCreate({
      run: baseRun as any,
      moduleStatus: "WIRED",
      findings: [validFinding],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects when module is DEMO but run.isDemo is false (Law 2)", () => {
    const result = enforceHonestyOnCreate({
      run: { ...baseRun, isDemo: false } as any,
      moduleStatus: "DEMO",
      findings: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.law === 2)).toBe(true);
    }
  });

  it("rejects finding without source (Law 3)", () => {
    const badFinding: Finding = { id: "f2", title: "Missing Source", description: "Bad", severity: "HIGH", source: "" };
    const result = enforceHonestyOnCreate({
      run: baseRun as any,
      moduleStatus: "WIRED",
      findings: [badFinding],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.law === 3)).toBe(true);
    }
  });
});

describe("enforceHonestyOnArchive", () => {
  it("allows archive of INFO severity without decision path", () => {
    const result = enforceHonestyOnArchive({
      severity: "INFO",
      implementedAt: null,
      deferredReason: null,
      decisionOutcome: null,
    });
    expect(result.ok).toBe(true);
  });

  it("blocks CRITICAL archive without decision path (Law 4)", () => {
    const result = enforceHonestyOnArchive({
      severity: "CRITICAL",
      implementedAt: null,
      deferredReason: null,
      decisionOutcome: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.law === 4)).toBe(true);
    }
  });

  it("allows CRITICAL archive with implementedAt set", () => {
    const result = enforceHonestyOnArchive({
      severity: "CRITICAL",
      implementedAt: new Date(),
      deferredReason: null,
      decisionOutcome: null,
    });
    expect(result.ok).toBe(true);
  });
});

describe("enforceHonestyOnDefer", () => {
  it("allows deferral with substantive reason", () => {
    const result = enforceHonestyOnDefer({ deferredReason: "Will revisit after Q3 review cycle completes" });
    expect(result.ok).toBe(true);
  });

  it("rejects deferral with empty reason", () => {
    const result = enforceHonestyOnDefer({ deferredReason: "" });
    expect(result.ok).toBe(false);
  });

  it("rejects deferral with reason under 20 characters", () => {
    const result = enforceHonestyOnDefer({ deferredReason: "short" });
    expect(result.ok).toBe(false);
  });

  it("rejects deferral with reason of exactly 15 characters", () => {
    const result = enforceHonestyOnDefer({ deferredReason: "fifteen chars!!" });
    expect(result.ok).toBe(false);
  });

  it("accepts deferral with reason of exactly 20 characters", () => {
    const result = enforceHonestyOnDefer({ deferredReason: "exactly twenty chars" });
    expect(result.ok).toBe(true);
  });
});

describe("enforceHonestyOnFindingCreate", () => {
  it("passes finding with source", () => {
    expect(enforceHonestyOnFindingCreate(validFinding).ok).toBe(true);
  });

  it("rejects finding without source", () => {
    const result = enforceHonestyOnFindingCreate({ ...validFinding, source: "" });
    expect(result.ok).toBe(false);
  });
});
