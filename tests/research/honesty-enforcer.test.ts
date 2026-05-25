/**
 * tests/research/honesty-enforcer.test.ts
 *
 * Tests for all five laws of the Honesty Constitution.
 */

import { describe, it, expect } from "vitest";
import {
  validateWiredStatus,
  validateDemoFlag,
  validateFindings,
  validateArchive,
  validateModuleDeclaration,
  enforceHonestyOnCreate,
} from "@/lib/research/honesty-enforcer";
import type { Finding } from "@/lib/research/foundry-contract";

// ─── Law 1: No False Labels ──────────────────────────────────────────────────

describe("Law 1 — validateWiredStatus", () => {
  it("allows WIRED when real-logic qualification passes", () => {
    const result = validateWiredStatus("WIRED", true);
    expect(result.ok).toBe(true);
  });

  it("blocks WIRED without real-logic qualification", () => {
    const result = validateWiredStatus("WIRED", false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations[0].law).toBe(1);
      expect(result.violations[0].message).toContain("qualification");
    }
  });

  it("allows non-WIRED status without qualification", () => {
    const result = validateWiredStatus("DEMO", false);
    expect(result.ok).toBe(true);
  });
});

// ─── Law 2: No Hidden DEMO ────────────────────────────────────────────────────

describe("Law 2 — validateDemoFlag", () => {
  it("requires isDemo: true for DEMO modules", () => {
    const result = validateDemoFlag({ isDemo: false, moduleStatus: "DEMO" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations[0].law).toBe(2);
    }
  });

  it("passes when DEMO module has isDemo: true", () => {
    const result = validateDemoFlag({ isDemo: true, moduleStatus: "DEMO" });
    expect(result.ok).toBe(true);
  });

  it("passes for WIRED module with isDemo: false", () => {
    const result = validateDemoFlag({ isDemo: false, moduleStatus: "WIRED" });
    expect(result.ok).toBe(true);
  });
});

// ─── Law 3: No Score Without Source ──────────────────────────────────────────

describe("Law 3 — validateFindings", () => {
  const validFinding: Finding = {
    id: "f1",
    title: "Test Finding",
    description: "A test finding",
    severity: "MEDIUM",
    source: "Rule: forbiddenPhraseDetector(text) matched 'guarantee'",
  };

  it("passes when all findings have sources", () => {
    const result = validateFindings([validFinding]);
    expect(result.ok).toBe(true);
  });

  it("fails when a finding has no source", () => {
    const noSource: Finding = { ...validFinding, source: "" };
    const result = validateFindings([noSource]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations[0].law).toBe(3);
    }
  });

  it("flags all sourceless findings", () => {
    const noSource1: Finding = { ...validFinding, id: "f1", title: "First", source: "" };
    const noSource2: Finding = { ...validFinding, id: "f2", title: "Second", source: "  " };
    const result = validateFindings([noSource1, noSource2]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toHaveLength(2);
    }
  });

  it("passes for empty findings array", () => {
    const result = validateFindings([]);
    expect(result.ok).toBe(true);
  });
});

// ─── Law 4: No Serious Finding Without a Path ─────────────────────────────────

describe("Law 4 — validateArchive", () => {
  it("blocks HIGH severity archive without any path", () => {
    const result = validateArchive({
      severity: "HIGH",
      implementedAt: null,
      deferredReason: null,
      decisionOutcome: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations[0].law).toBe(4);
      expect(result.violations[0].message).toContain("HIGH");
    }
  });

  it("blocks CRITICAL severity archive without any path", () => {
    const result = validateArchive({
      severity: "CRITICAL",
      implementedAt: null,
      deferredReason: null,
      decisionOutcome: null,
    });
    expect(result.ok).toBe(false);
  });

  it("allows HIGH archive with implementedAt set", () => {
    const result = validateArchive({
      severity: "HIGH",
      implementedAt: new Date(),
      deferredReason: null,
      decisionOutcome: null,
    });
    expect(result.ok).toBe(true);
  });

  it("allows HIGH archive with deferredReason set", () => {
    const result = validateArchive({
      severity: "HIGH",
      implementedAt: null,
      deferredReason: "Deferred to Q3 — dependency on infrastructure upgrade",
      decisionOutcome: null,
    });
    expect(result.ok).toBe(true);
  });

  it("allows HIGH archive with decisionOutcome set", () => {
    const result = validateArchive({
      severity: "HIGH",
      implementedAt: null,
      deferredReason: null,
      decisionOutcome: "Owner accepted risk — documented in board minutes",
    });
    expect(result.ok).toBe(true);
  });

  it("allows INFO severity archive without path", () => {
    const result = validateArchive({
      severity: "INFO",
      implementedAt: null,
      deferredReason: null,
      decisionOutcome: null,
    });
    expect(result.ok).toBe(true);
  });

  it("blocks HIGH archive with empty deferredReason", () => {
    const result = validateArchive({
      severity: "HIGH",
      implementedAt: null,
      deferredReason: "  ",
      decisionOutcome: null,
    });
    expect(result.ok).toBe(false);
  });
});

// ─── Law 5: No Module Claims More Than It Delivers ────────────────────────────

describe("Law 5 — validateModuleDeclaration", () => {
  it("flags WIRED module with no capabilities", () => {
    const result = validateModuleDeclaration({
      name: "Test Module",
      status: "WIRED",
      description: "Does something",
      capabilities: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations[0].law).toBe(5);
    }
  });

  it("flags module with empty description", () => {
    const result = validateModuleDeclaration({
      name: "Test Module",
      status: "DEMO",
      description: "",
      capabilities: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations[0].law).toBe(5);
    }
  });

  it("passes WIRED module with capabilities and description", () => {
    const result = validateModuleDeclaration({
      name: "Content Red Team",
      status: "WIRED",
      description: "Detects overclaims and guarantee language",
      capabilities: ["overclaim-detection", "guarantee-language"],
    });
    expect(result.ok).toBe(true);
  });
});

// ─── Compound Validator ───────────────────────────────────────────────────────

describe("enforceHonestyOnCreate", () => {
  const baseRun: any = {
    title: "Test Run",
    slug: "test-run",
    runType: "RED_TEAM",
    module: "content-red-team",
    moduleVersion: "1.0.0",
    severity: "MEDIUM",
    status: "PENDING",
    isDemo: false,
    humanReviewRequired: false,
    requiresOwnerDecision: false,
    driftDetected: false,
    schemaVersion: "1.0.0",
    resurrectionCount: 0,
  };

  const validFinding: Finding = {
    id: "f1",
    title: "Valid Finding",
    description: "description",
    severity: "MEDIUM",
    source: "forbiddenPhraseDetector matched 'guarantee'",
  };

  it("passes with valid WIRED module run", () => {
    const result = enforceHonestyOnCreate({
      run: baseRun,
      moduleStatus: "WIRED",
      findings: [validFinding],
    });
    expect(result.ok).toBe(true);
  });

  it("fails when DEMO module run has isDemo: false", () => {
    const result = enforceHonestyOnCreate({
      run: { ...baseRun, isDemo: false },
      moduleStatus: "DEMO",
      findings: [validFinding],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.law === 2)).toBe(true);
    }
  });

  it("fails when findings lack source", () => {
    const result = enforceHonestyOnCreate({
      run: baseRun,
      moduleStatus: "WIRED",
      findings: [{ ...validFinding, source: "" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.law === 3)).toBe(true);
    }
  });

  it("collects violations from multiple laws", () => {
    const result = enforceHonestyOnCreate({
      run: { ...baseRun, isDemo: false },
      moduleStatus: "DEMO",
      findings: [{ ...validFinding, source: "" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.length).toBeGreaterThanOrEqual(2);
    }
  });
});
