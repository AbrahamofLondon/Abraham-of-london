/**
 * tests/research/engine-registry.test.ts
 */

import { describe, it, expect } from "vitest";
import { ENGINE_REGISTRY, getEngine, getCallableEngines, getNonCallableEngines } from "@/lib/research/engine-registry";

describe("ENGINE_REGISTRY", () => {
  it("every engine has a non-empty id, name, description, and version", () => {
    for (const engine of ENGINE_REGISTRY) {
      expect(engine.id.trim()).not.toBe("");
      expect(engine.name.trim()).not.toBe("");
      expect(engine.description.trim()).not.toBe("");
      expect(engine.version.trim()).not.toBe("");
    }
  });

  it("no duplicate engine IDs", () => {
    const ids = ENGINE_REGISTRY.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("non-callable engines have a limitationReason", () => {
    const nonCallable = ENGINE_REGISTRY.filter((e) => e.status !== "PRODUCTION_CALLABLE");
    for (const engine of nonCallable) {
      expect(engine.limitationReason).toBeDefined();
      expect(engine.limitationReason!.trim()).not.toBe("");
    }
  });

  it("reference-ogr-engine is not PRODUCTION_CALLABLE", () => {
    const ogr = getEngine("reference-ogr-engine");
    expect(ogr).toBeDefined();
    expect(ogr?.status).not.toBe("PRODUCTION_CALLABLE");
    expect(ogr?.description).toContain("REFERENCE MODEL");
  });

  it("getCallableEngines returns only PRODUCTION_CALLABLE engines", () => {
    const callable = getCallableEngines();
    for (const e of callable) {
      expect(e.status).toBe("PRODUCTION_CALLABLE");
    }
  });

  it("callable + non-callable covers all engines", () => {
    const callable = getCallableEngines();
    const nonCallable = getNonCallableEngines();
    expect(callable.length + nonCallable.length).toBe(ENGINE_REGISTRY.length);
  });

  it("contains all 21 named product engines", () => {
    const requiredIds = [
      "fast-diagnostic", "purpose-alignment", "constitutional-diagnostic",
      "executive-reporting", "strategy-room", "enterprise-decision-authority",
      "boardroom-dossier", "gmi", "outbound-policy-gate", "cohort-privacy",
      "report-lineage", "editorial-style-checker", "outbound-content-validator",
      "contradiction-detection", "cost-of-delay", "pattern-recurrence",
      "decision-credit", "consequence-engine", "retainer-readiness",
      "enforcement-gates", "reference-ogr-engine",
    ];
    const registryIds = new Set(ENGINE_REGISTRY.map((e) => e.id));
    for (const id of requiredIds) {
      expect(registryIds.has(id), `Missing engine: ${id}`).toBe(true);
    }
  });
});
