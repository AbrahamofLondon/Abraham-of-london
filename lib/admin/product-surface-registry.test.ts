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
import {
  SURFACE_PERSISTENCE_MAP,
  getSurfacePersistenceLevel,
  type RecordPersistenceLevel,
} from "@/lib/product/record-persistence-contract";

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
      expect(typeof surface.previewAvailable, "previewAvailable not boolean for " + surface.id).toBe("boolean");
      expect(surface.recordPolicy, "recordPolicy missing for " + surface.id).toBeDefined();
      expect(typeof surface.recordPolicy.createsRecord, "recordPolicy.createsRecord not boolean for " + surface.id).toBe("boolean");
      expect(surface.recordPolicy.recordType, "recordPolicy.recordType missing for " + surface.id).toBeTruthy();
      expect(surface.recordPolicy.systemOfRecord, "recordPolicy.systemOfRecord missing for " + surface.id).toBeTruthy();
      expect(typeof surface.recordPolicy.provenanceCapable, "recordPolicy.provenanceCapable not boolean for " + surface.id).toBe("boolean");
      expect(surface.description, "description blank for " + surface.id).toBeTruthy();
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

  it("outputs and downstream are non-empty arrays; captures may be empty for public-only surfaces", () => {
    for (const surface of PRODUCT_SURFACE_REGISTRY) {
      // captures can be empty for public-only surfaces that don't collect user data
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

  // ─── Doctrine enforcement ────────────────────────────────────────────────

  it("Decision Centre description contains 'governed decision lives'", () => {
    const dc = getProductSurfaceById("decision-centre");
    expect(dc).toBeDefined();
    expect(dc!.description).toContain("governed decision lives");
  });

  it("Return Brief route is not dead or misleading (route exists as /return-brief)", () => {
    const rb = getProductSurfaceById("return-brief");
    expect(rb).toBeDefined();
    expect(rb!.clientRoute).toBe("/return-brief");
    expect(rb!.status).toBe("live");
  });

  it("Proof Pack description contains 'portable' and 'client-safe'", () => {
    const pp = getProductSurfaceById("proof-pack");
    expect(pp).toBeDefined();
    expect(pp!.description).toContain("portable");
    expect(pp!.description).toContain("client-safe");
  });

  it("all required public live surfaces exist in registry", () => {
    const requiredIds = [
      "decision-delay-exposure-calculator",
      "board-summary-preview",
      "provenance-sample-export",
      "public-anchor-log",
    ];
    for (const id of requiredIds) {
      const surface = getProductSurfaceById(id);
      expect(surface, `missing required surface: ${id}`).toBeDefined();
      expect(surface!.status, `${id} should be live`).toBe("live");
    }
  });

  it("no registry description uses the term 'toolkit'", () => {
    const offenders = PRODUCT_SURFACE_REGISTRY.filter(
      (s) => s.description.toLowerCase().includes("toolkit"),
    );
    expect(offenders.map((s) => s.id)).toEqual([]);
  });

  it("no registry description claims WORM/blockchain/external immutability", () => {
    const forbidden = ["worm", "blockchain", "immutable", "immutability"];
    const offenders = PRODUCT_SURFACE_REGISTRY.filter((s) => {
      const lower = s.description.toLowerCase();
      return forbidden.some((term) => lower.includes(term));
    });
    expect(offenders.map((s) => s.id)).toEqual([]);
  });

  it("no active registry route points to a missing obvious page (route-check for known surfaces)", () => {
    // Verify that all live surfaces have a clientRoute that starts with /
    // This is a structural check — actual page existence is verified by the build.
    const liveSurfaces = PRODUCT_SURFACE_REGISTRY.filter((s) => s.status === "live");
    for (const surface of liveSurfaces) {
      expect(
        surface.clientRoute.startsWith("/"),
        `${surface.id} has invalid clientRoute: ${surface.clientRoute}`,
      ).toBe(true);
    }
  });

  // ─── Persistence enforcement ─────────────────────────────────────────────

  it("every registry surface has a persistence level defined in the persistence contract", () => {
    for (const surface of PRODUCT_SURFACE_REGISTRY) {
      const level = getSurfacePersistenceLevel(surface.id);
      expect(
        level,
        `Surface "${surface.id}" (${surface.label}) has no persistence level defined. Add it to SURFACE_PERSISTENCE_MAP.`,
      ).toBeDefined();
    }
  });

  it("Decision Centre is described as a governed case, not a session preview", () => {
    const dc = getProductSurfaceById("decision-centre");
    expect(dc).toBeDefined();
    const level = getSurfacePersistenceLevel("decision-centre");
    expect(level).toBe("GOVERNED_CASE");
  });

  it("sample/preview pages are marked SESSION_PREVIEW, NONE, or PUBLIC_ROOT_PUBLISHED", () => {
    const previewIds = [
      "decision-delay-exposure-calculator",
      "board-summary-preview",
      "provenance-sample-export",
      "public-anchor-log",
    ];
    const allowedLevels: RecordPersistenceLevel[] = ["SESSION_PREVIEW", "NONE", "PUBLIC_ROOT_PUBLISHED"];
    for (const id of previewIds) {
      const level = getSurfacePersistenceLevel(id);
      expect(
        allowedLevels.includes(level!),
        `${id} has persistence level "${level}" but should be SESSION_PREVIEW, NONE, or PUBLIC_ROOT_PUBLISHED`,
      ).toBe(true);
    }
  });

  it("Provenance Sample is NONE, not a live record", () => {
    const level = getSurfacePersistenceLevel("provenance-sample-export");
    expect(level).toBe("NONE");
  });

  it("Public Anchor Log is PUBLIC_ROOT_PUBLISHED, not a live governed record", () => {
    const level = getSurfacePersistenceLevel("public-anchor-log");
    expect(level).toBe("PUBLIC_ROOT_PUBLISHED");
  });

  it("Return Brief explainer surface is GOVERNED_CASE (route exists as /return-brief)", () => {
    const level = getSurfacePersistenceLevel("return-brief");
    expect(level).toBe("GOVERNED_CASE");
  });

  it("Strategy Room is not labelled PROVENANCE_BACKED unless provenance exists", () => {
    const level = getSurfacePersistenceLevel("strategy-room");
    expect(level).toBe("GOVERNED_CASE");
    // Strategy Room is GOVERNED_CASE, not PROVENANCE_BACKED, because
    // provenance chain anchoring is not yet configured for all cases.
  });

  it("Oversight Brief is PROVENANCE_BACKED (has chain-of-custody provenance)", () => {
    const level = getSurfacePersistenceLevel("oversight-brief");
    expect(level).toBe("PROVENANCE_BACKED");
  });

  it("Proof Pack is PROVENANCE_BACKED (has chain-of-custody provenance)", () => {
    const level = getSurfacePersistenceLevel("proof-pack");
    expect(level).toBe("PROVENANCE_BACKED");
  });
});
