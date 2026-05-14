/**
 * lib/admin/product-surface-registry.test.ts
 *
 * Tests for the canonical product surface registry.
 * Verifies registry completeness, type correctness, and helper functions.
 */

import { describe, expect, it } from "vitest";
import {
  PRODUCT_SURFACE_REGISTRY,
  getProductSurfacesByCategory,
  getProductSurfacesByStatus,
  getProductSurfacesByPriority,
  getProductSurfaceById,
  getProductSurfacesByAudience,
} from "@/lib/admin/product-surface-registry";

describe("product surface registry", () => {
  it("contains at least one surface", () => {
    expect(PRODUCT_SURFACE_REGISTRY.length).toBeGreaterThan(0);
  });

  it("every surface has all required fields", () => {
    for (const surface of PRODUCT_SURFACE_REGISTRY) {
      expect(surface.id, `id blank for ${surface.label}`).toBeTruthy();
      expect(surface.label, `label blank for ${surface.id}`).toBeTruthy();
      expect(surface.category, `category blank for ${surface.id}`).toBeTruthy();
      expect(surface.clientRoute, `clientRoute blank for ${surface.id}`).toBeTruthy();
      expect(surface.status, `status blank for ${surface.id}`).toBeTruthy();
      expect(surface.audience, `audience blank for ${surface.id}`).toBeTruthy();
      expect(surface.entryRequirement, `entryRequirement blank for ${surface.id}`).toBeTruthy();
      expect(Array.isArray(surface.captures), `captures not array for ${surface.id}`).toBe(true);
      expect(Array.isArray(surface.outputs), `outputs not array for ${surface.id}`).toBe(true);
      expect(Array.isArray(surface.downstream), `downstream not array for ${surface.id}`).toBe(true);
      expect(surface.monitoringPriority, `monitoringPriority blank for ${surface.id}`).toBeTruthy();
      expect(surface.operationalOwner, `operationalOwner blank for ${surface.id}`).toBeTruthy();
      expect(typeof surface.previewAvailable, `previewAvailable not boolean for ${surface.id}`).toBe("boolean");
      expect(surface.description, `description blank for ${surface.id}`).toBeTruthy();
    }
  });

  it("no two surfaces share the same id", () => {
    const ids = PRODUCT_SURFACE_REGISTRY.map((s) => s.id);
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    expect(duplicates, "duplicate surface ids found").toEqual([]);
  });

  it("every surface has a valid category", () => {
    const validCategories = [
      "DIAGNOSTIC",
      "ASSESSMENT",
      "REPORT",
      "INTERVENTION",
      "RETAINER",
      "ESCALATION",
      "CLIENT_PORTAL",
      "CONTENT",
    ];
    for (const surface of PRODUCT_SURFACE_REGISTRY) {
      expect(
        validCategories.includes(surface.category),
        `${surface.id} has invalid category: ${surface.category}`,
      ).toBe(true);
    }
  });

  it("every surface has a valid status", () => {
    const validStatuses = ["live", "rough", "internal", "experimental", "deprecated"];
    for (const surface of PRODUCT_SURFACE_REGISTRY) {
      expect(
        validStatuses.includes(surface.status),
        `${surface.id} has invalid status: ${surface.status}`,
      ).toBe(true);
    }
  });

  it("every surface has a valid audience", () => {
    const validAudiences = ["individual", "sponsor", "operator", "organisation", "board", "counsel"];
    for (const surface of PRODUCT_SURFACE_REGISTRY) {
      expect(
        validAudiences.includes(surface.audience),
        `${surface.id} has invalid audience: ${surface.audience}`,
      ).toBe(true);
    }
  });

  it("every surface has a valid monitoring priority", () => {
    const validPriorities = ["low", "medium", "high", "critical"];
    for (const surface of PRODUCT_SURFACE_REGISTRY) {
      expect(
        validPriorities.includes(surface.monitoringPriority),
        `${surface.id} has invalid monitoringPriority: ${surface.monitoringPriority}`,
      ).toBe(true);
    }
  });

  it("every surface has a valid operational owner", () => {
    const validOwners = ["admin", "operator", "founder", "future-team"];
    for (const surface of PRODUCT_SURFACE_REGISTRY) {
      expect(
        validOwners.includes(surface.operationalOwner),
        `${surface.id} has invalid operationalOwner: ${surface.operationalOwner}`,
      ).toBe(true);
    }
  });

  it("getProductSurfacesByCategory groups correctly", () => {
    const grouped = getProductSurfacesByCategory();
    const totalFromGroups = [...grouped.values()].reduce((sum, items) => sum + items.length, 0);
    expect(totalFromGroups).toBe(PRODUCT_SURFACE_REGISTRY.length);
    expect(grouped.has("DIAGNOSTIC")).toBe(true);
    expect(grouped.has("ASSESSMENT")).toBe(true);
    expect(grouped.has("REPORT")).toBe(true);
    expect(grouped.has("INTERVENTION")).toBe(true);
    expect(grouped.has("RETAINER")).toBe(true);
    expect(grouped.has("ESCALATION")).toBe(true);
    expect(grouped.has("CLIENT_PORTAL")).toBe(true);
    expect(grouped.has("CONTENT")).toBe(true);
  });

  it("getProductSurfacesByStatus groups correctly", () => {
    const grouped = getProductSurfacesByStatus();
    const totalFromGroups = [...grouped.values()].reduce((sum, items) => sum + items.length, 0);
    expect(totalFromGroups).toBe(PRODUCT_SURFACE_REGISTRY.length);
  });

  it("getProductSurfacesByPriority groups correctly", () => {
    const grouped = getProductSurfacesByPriority();
    const totalFromGroups = [...grouped.values()].reduce((sum, items) => sum + items.length, 0);
    expect(totalFromGroups).toBe(PRODUCT_SURFACE_REGISTRY.length);
  });

  it("getProductSurfaceById returns correct surface", () => {
    const fast = getProductSurfaceById("fast-diagnostic");
    expect(fast).toBeDefined();
    expect(fast?.label).toBe("Fast Diagnostic");
  });

  it("getProductSurfaceById returns undefined for unknown id", () => {
    expect(getProductSurfaceById("nonexistent")).toBeUndefined();
  });

  it("getProductSurfacesByAudience returns surfaces for a given audience", () => {
    const sponsorSurfaces = getProductSurfacesByAudience("sponsor");
    expect(sponsorSurfaces.length).toBeGreaterThan(0);
    for (const surface of sponsorSurfaces) {
      expect(surface.audience).toBe("sponsor");
    }
  });

  it("all client routes start with /", () => {
    const bad = PRODUCT_SURFACE_REGISTRY.filter((s) => !s.clientRoute.startsWith("/"));
    expect(bad.map((s) => `${s.id}: ${s.clientRoute}`)).toEqual([]);
  });

  it("all admin routes start with /admin when present", () => {
    const bad = PRODUCT_SURFACE_REGISTRY.filter(
      (s) => s.adminRoute && !s.adminRoute.startsWith("/admin"),
    );
    expect(bad.map((s) => `${s.id}: ${s.adminRoute}`)).toEqual([]);
  });

  it("captures, outputs, and downstream are non-empty arrays", () => {
    for (const surface of PRODUCT_SURFACE_REGISTRY) {
      expect(
        surface.captures.length,
        `${surface.id} has empty captures`,
      ).toBeGreaterThan(0);
      expect(
        surface.outputs.length,
        `${surface.id} has empty outputs`,
      ).toBeGreaterThan(0);
    }
  });

  it("at least one surface has critical monitoring priority", () => {
    const critical = PRODUCT_SURFACE_REGISTRY.filter((s) => s.monitoringPriority === "critical");
    expect(critical.length).toBeGreaterThan(0);
  });

  it("at least one surface has each category represented", () => {
    const categories = new Set(PRODUCT_SURFACE_REGISTRY.map((s) => s.category));
    expect(categories.has("DIAGNOSTIC")).toBe(true);
    expect(categories.has("ASSESSMENT")).toBe(true);
    expect(categories.has("REPORT")).toBe(true);
    expect(categories.has("INTERVENTION")).toBe(true);
    expect(categories.has("RETAINER")).toBe(true);
    expect(categories.has("ESCALATION")).toBe(true);
    expect(categories.has("CLIENT_PORTAL")).toBe(true);
    expect(categories.has("CONTENT")).toBe(true);
  });
});
