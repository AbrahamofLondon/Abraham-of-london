/**
 * tests/research/real-logic-classifier.test.ts
 */

import { describe, it, expect } from "vitest";
import { classifyModule, hasRealLogicQualification } from "@/lib/research/real-logic-classifier";

describe("classifyModule", () => {
  const fullInput = {
    engineId: "fast-diagnostic",
    engineIsCallable: true,
    hasImplementedCapabilities: true,
    findingsHaveSource: true,
    writesViaRepository: true,
    displaysDemoDisclaimer: true,
  };

  it("returns WIRED when all criteria pass", () => {
    const result = classifyModule(fullInput);
    expect(result.qualified).toBe(true);
    if (result.qualified) {
      expect(result.status).toBe("WIRED");
    }
  });

  it("returns ADAPTER_NEEDED when engine is not callable", () => {
    const result = classifyModule({ ...fullInput, engineIsCallable: false });
    expect(result.qualified).toBe(false);
    if (!result.qualified) {
      expect(result.status).toBe("ADAPTER_NEEDED");
    }
  });

  it("returns DEMO when no implemented capabilities", () => {
    const result = classifyModule({ ...fullInput, hasImplementedCapabilities: false });
    expect(result.qualified).toBe(false);
    if (!result.qualified) {
      expect(result.status).toBe("DEMO");
    }
  });

  it("returns PARTIAL when findings lack source", () => {
    const result = classifyModule({ ...fullInput, findingsHaveSource: false });
    expect(result.qualified).toBe(false);
    if (!result.qualified) {
      expect(result.status).toBe("PARTIAL");
    }
  });

  it("returns PARTIAL when not writing via repository", () => {
    const result = classifyModule({ ...fullInput, writesViaRepository: false });
    expect(result.qualified).toBe(false);
    if (!result.qualified) {
      expect(result.status).toBe("PARTIAL");
    }
  });

  it("returns PARTIAL when DemoDisclaimer is not displayed", () => {
    const result = classifyModule({ ...fullInput, displaysDemoDisclaimer: false });
    expect(result.qualified).toBe(false);
    if (!result.qualified) {
      expect(result.status).toBe("PARTIAL");
    }
  });
});

describe("hasRealLogicQualification", () => {
  it("returns true for known WIRED modules", () => {
    expect(hasRealLogicQualification("content-red-team")).toBe(true);
    expect(hasRealLogicQualification("research-run-vault")).toBe(true);
    expect(hasRealLogicQualification("foundry-health")).toBe(true);
  });

  it("returns false for unknown or non-qualified modules", () => {
    expect(hasRealLogicQualification("made-up-module")).toBe(false);
    expect(hasRealLogicQualification("reference-models")).toBe(false);
  });
});
