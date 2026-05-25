/**
 * Canary: Module status computer derives status from real criteria.
 * Modules cannot self-declare WIRED — it must be earned.
 */

import { describe, it, expect } from "vitest";
import { computeModuleStatus } from "@/lib/research/module-status-computer";
import type { ModuleRegistryEntry } from "@/lib/research/module-registry";

function makeEntry(overrides: Partial<ModuleRegistryEntry>): ModuleRegistryEntry {
  return {
    id: "test-module",
    name: "Test Module",
    status: "WIRED",
    description: "A test module",
    route: "/admin/intelligence-foundry/test-module",
    runType: "MANUAL",
    capabilities: ["test"],
    ...overrides,
  };
}

describe("computeModuleStatus", () => {
  it("DEMO passes through without override", () => {
    const entry = makeEntry({ status: "DEMO", engineId: undefined });
    const report = computeModuleStatus(entry);
    expect(report.computedStatus).toBe("DEMO");
  });

  it("DECOMMISSIONED passes through without override", () => {
    const entry = makeEntry({ status: "DECOMMISSIONED", engineId: undefined });
    const report = computeModuleStatus(entry);
    expect(report.computedStatus).toBe("DECOMMISSIONED");
  });

  it("WIRED declaration with no route on disk → PLANNED", () => {
    const entry = makeEntry({ status: "WIRED", route: "/admin/intelligence-foundry/nonexistent-route-xyz" });
    const report = computeModuleStatus(entry);
    // Since the route file doesn't exist on disk
    expect(report.routeExists).toBe(false);
    expect(report.computedStatus).not.toBe("WIRED");
    expect(report.computedStatus).toBe("PLANNED");
  });

  it("report includes declaredStatus and computedStatus", () => {
    const entry = makeEntry({ status: "WIRED", route: "/admin/intelligence-foundry/ghost-route" });
    const report = computeModuleStatus(entry);
    expect(report.declaredStatus).toBe("WIRED");
    expect(typeof report.computedStatus).toBe("string");
    expect(typeof report.reason).toBe("string");
  });
});
