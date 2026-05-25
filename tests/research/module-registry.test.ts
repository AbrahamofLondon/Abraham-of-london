/**
 * tests/research/module-registry.test.ts
 */

import { describe, it, expect } from "vitest";
import { MODULE_REGISTRY, getModule, getWiredModules, getDemoModules } from "@/lib/research/module-registry";

describe("MODULE_REGISTRY", () => {
  it("every module has a non-empty id, name, description, and route", () => {
    for (const mod of MODULE_REGISTRY) {
      expect(mod.id.trim()).not.toBe("");
      expect(mod.name.trim()).not.toBe("");
      expect(mod.description.trim()).not.toBe("");
      expect(mod.route.trim()).not.toBe("");
    }
  });

  it("no duplicate module IDs", () => {
    const ids = MODULE_REGISTRY.map((m) => m.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all WIRED modules have at least one capability", () => {
    const wired = MODULE_REGISTRY.filter((m) => m.status === "WIRED");
    for (const mod of wired) {
      expect(mod.capabilities.length).toBeGreaterThan(0);
    }
  });

  it("DEMO modules have descriptions containing DEMO", () => {
    const demo = getDemoModules();
    for (const mod of demo) {
      expect(mod.description.toUpperCase()).toContain("DEMO");
    }
  });

  it("getModule returns the correct module", () => {
    const mod = getModule("content-red-team");
    expect(mod).toBeDefined();
    expect(mod?.name).toBe("Content Red Team");
  });

  it("getModule returns undefined for unknown id", () => {
    expect(getModule("nonexistent-module")).toBeUndefined();
  });

  it("getWiredModules returns only WIRED status modules", () => {
    const wired = getWiredModules();
    for (const mod of wired) {
      expect(mod.status).toBe("WIRED");
    }
  });
});
