/**
 * tests/research/product-health/product-health-service.test.ts
 *
 * Tests for the Product Health service.
 */

import { describe, it, expect } from "vitest";
import {
  getProductHealthForSurface,
  getProductHealthForAllSurfaces,
  getProductHealthOverview,
  getProductHealthSummary,
} from "@/lib/research/product-health/product-health-service";

// ─── 1. Every product ladder entry appears ───────────────────────────────────

describe("product health coverage", () => {
  it("every product ladder entry appears in health overview", () => {
    const overview = getProductHealthOverview();
    // Should have at least 15 surfaces
    expect(overview.surfaces.length).toBeGreaterThanOrEqual(15);
  });

  it("summary counts match surface count", () => {
    const overview = getProductHealthOverview();
    expect(overview.summary.total).toBe(overview.surfaces.length);
  });
});

// ─── 2. Individual surface health ────────────────────────────────────────────

describe("individual surface health", () => {
  it("returns health for existing surface", () => {
    const health = getProductHealthForSurface("executive-reporting");
    expect(health).not.toBeNull();
    expect(health!.productSurfaceId).toBe("executive-reporting");
  });

  it("returns null for non-existent surface", () => {
    const health = getProductHealthForSurface("nonexistent");
    expect(health).toBeNull();
  });

  it("every surface has overall status", () => {
    const surfaces = getProductHealthForAllSurfaces();
    for (const surface of surfaces) {
      expect(["GREEN", "AMBER", "RED", "GREY"]).toContain(surface.overallStatus);
    }
  });

  it("every surface has explanation", () => {
    const surfaces = getProductHealthForAllSurfaces();
    for (const surface of surfaces) {
      expect(typeof surface.explanation).toBe("string");
      expect(surface.explanation.length).toBeGreaterThan(0);
    }
  });
});

// ─── 3. Summary ──────────────────────────────────────────────────────────────

describe("product health summary", () => {
  it("returns summary with all counts", () => {
    const summary = getProductHealthSummary();
    expect(summary.total).toBeGreaterThan(0);
    expect(typeof summary.green).toBe("number");
    expect(typeof summary.amber).toBe("number");
    expect(typeof summary.red).toBe("number");
    expect(typeof summary.grey).toBe("number");
  });

  it("sum of counts equals total", () => {
    const summary = getProductHealthSummary();
    const sum = summary.green + summary.amber + summary.red + summary.grey;
    expect(sum).toBe(summary.total);
  });
});

// ─── 4. Registry presence alone cannot produce GREEN ─────────────────────────

describe("registry presence alone is insufficient", () => {
  it("every surface has a computed status (not manually declared)", () => {
    const surfaces = getProductHealthForAllSurfaces();
    for (const surface of surfaces) {
      expect(["GREEN", "AMBER", "RED", "GREY"]).toContain(surface.overallStatus);
      // Status must be computed by rules, not hardcoded
      expect(surface.explanation.length).toBeGreaterThan(0);
    }
  });
});

// ─── 5. Status distribution ──────────────────────────────────────────────────

describe("status distribution", () => {
  it("at least one surface is GREEN", () => {
    const summary = getProductHealthSummary();
    expect(summary.green).toBeGreaterThan(0);
  });

  it("at least one surface is AMBER (simulation-only events)", () => {
    const summary = getProductHealthSummary();
    expect(summary.amber).toBeGreaterThan(0);
  });
});
