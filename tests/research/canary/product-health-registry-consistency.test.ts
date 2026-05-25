/**
 * tests/research/canary/product-health-registry-consistency.test.ts
 *
 * Canary: If a new product surface is added to product-ladder-registry,
 * product-health tests must fail unless the surface has admin owner,
 * canonical record, Foundry/lineage/audit expectations, and status rules.
 */

import { describe, it, expect } from "vitest";
import { getProductHealthForAllSurfaces } from "@/lib/research/product-health/product-health-service";
import { PRODUCT_LADDER } from "@/lib/platform/product-ladder-registry";

describe("product health registry consistency", () => {
  const surfaces = getProductHealthForAllSurfaces();

  it("every product ladder entry appears in health overview", () => {
    const healthIds = new Set(surfaces.map((s) => s.productSurfaceId));
    for (const entry of PRODUCT_LADDER) {
      expect(healthIds.has(entry.id), `Surface "${entry.id}" missing from health overview`).toBe(true);
    }
  });

  it("every surface has a canonical record status", () => {
    for (const surface of surfaces) {
      expect(["GREEN", "AMBER", "RED", "GREY"]).toContain(surface.canonicalRecordStatus);
    }
  });

  it("every surface has an admin owner status", () => {
    for (const surface of surfaces) {
      expect(["GREEN", "AMBER", "RED", "GREY"]).toContain(surface.adminOwnerStatus);
    }
  });

  it("every surface has a foundry coverage status", () => {
    for (const surface of surfaces) {
      expect(["GREEN", "AMBER", "RED", "GREY"]).toContain(surface.foundryCoverageStatus);
    }
  });

  it("every surface has a lineage coverage status", () => {
    for (const surface of surfaces) {
      expect(["GREEN", "AMBER", "RED", "GREY"]).toContain(surface.lineageCoverageStatus);
    }
  });

  it("every surface has a governance event status", () => {
    for (const surface of surfaces) {
      expect(["GREEN", "AMBER", "RED", "GREY"]).toContain(surface.governanceEventStatus);
    }
  });

  it("every surface has an entitlement status", () => {
    for (const surface of surfaces) {
      expect(["GREEN", "AMBER", "RED", "GREY"]).toContain(surface.entitlementStatus);
    }
  });

  it("every surface has an outbound status", () => {
    for (const surface of surfaces) {
      expect(["GREEN", "AMBER", "RED", "GREY"]).toContain(surface.outboundStatus);
    }
  });

  it("every surface has an overall status", () => {
    for (const surface of surfaces) {
      expect(["GREEN", "AMBER", "RED", "GREY"]).toContain(surface.overallStatus);
    }
  });

  it("every surface has a non-empty explanation", () => {
    for (const surface of surfaces) {
      expect(typeof surface.explanation).toBe("string");
      expect(surface.explanation.length).toBeGreaterThan(0);
    }
  });
});
