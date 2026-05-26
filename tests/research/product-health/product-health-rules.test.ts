/**
 * tests/research/product-health/product-health-rules.test.ts
 *
 * Tests for the Product Health rule engine.
 */

import { describe, it, expect } from "vitest";
import {
  checkProductSurfaceExists,
  checkProductRoute,
  checkCanonicalRecord,
  checkAdminOwner,
  checkFoundryCoverage,
  checkLineageCoverage,
  checkGovernanceEvents,
  checkEntitlement,
  checkOutbound,
  checkSimulationOnlyEvents,
  runAllRules,
  aggregateStatus,
} from "@/lib/research/product-health/product-health-rules";
import { getProductLadderEntry } from "@/lib/platform/product-ladder-registry";

// ─── 1. Product surface exists ───────────────────────────────────────────────

describe("checkProductSurfaceExists", () => {
  it("existing surface returns GREEN", () => {
    const result = checkProductSurfaceExists("executive-reporting");
    expect(result.status).toBe("GREEN");
  });

  it("non-existent surface returns RED", () => {
    const result = checkProductSurfaceExists("nonexistent-surface");
    expect(result.status).toBe("RED");
  });
});

describe("checkProductRoute", () => {
  it("surface with real route returns GREEN", () => {
    const surface = getProductLadderEntry("executive-reporting")!;
    const result = checkProductRoute(surface);
    expect(result.status).toBe("GREEN");
  });
});

// ─── 2. Canonical record ─────────────────────────────────────────────────────

describe("checkCanonicalRecord", () => {
  it("existing canonical record returns GREEN", () => {
    const surface = getProductLadderEntry("executive-reporting")!;
    const result = checkCanonicalRecord(surface);
    expect(result.status).toBe("GREEN");
  });
});

// ─── 3. Admin owner ──────────────────────────────────────────────────────────

describe("checkAdminOwner", () => {
  it("surface with admin owner returns GREEN", () => {
    const surface = getProductLadderEntry("executive-reporting")!;
    const result = checkAdminOwner(surface);
    expect(result.status).toBe("GREEN");
  });
});

// ─── 4. Foundry coverage ─────────────────────────────────────────────────────

describe("checkFoundryCoverage", () => {
  it("surface with PRODUCTION_CALLABLE Foundry module returns GREEN", () => {
    const surface = getProductLadderEntry("executive-reporting")!;
    const result = checkFoundryCoverage(surface);
    expect(result.status).toBe("GREEN");
  });

  it("surface without Foundry module returns GREY", () => {
    const surface = getProductLadderEntry("canon")!;
    const result = checkFoundryCoverage(surface);
    expect(result.status).toBe("GREY");
  });
});

// ─── 5. Lineage coverage ─────────────────────────────────────────────────────

describe("checkLineageCoverage", () => {
  it("surface with COMPLETE lineage chain returns GREEN", () => {
    const surface = getProductLadderEntry("executive-reporting")!;
    const result = checkLineageCoverage(surface);
    expect(result.status).toBe("GREEN");
  });

  it("surface without mapped chain returns GREY", () => {
    const surface = getProductLadderEntry("canon")!;
    const result = checkLineageCoverage(surface);
    expect(result.status).toBe("GREY");
  });
});

// ─── 6. Governance events ────────────────────────────────────────────────────

describe("checkGovernanceEvents", () => {
  it("surface with registered events returns GREEN", () => {
    const surface = getProductLadderEntry("executive-reporting")!;
    const result = checkGovernanceEvents(surface);
    expect(result.status).toBe("GREEN");
  });
});

// ─── 7. Entitlement ──────────────────────────────────────────────────────────

describe("checkEntitlement", () => {
  it("gated surface with entitlement returns GREEN", () => {
    const surface = getProductLadderEntry("executive-reporting")!;
    const result = checkEntitlement(surface);
    expect(result.status).toBe("GREEN");
  });

  it("public surface returns GREY", () => {
    const surface = getProductLadderEntry("editorials")!;
    const result = checkEntitlement(surface);
    expect(result.status).toBe("GREY");
  });
});

// ─── 8. Outbound ─────────────────────────────────────────────────────────────

describe("checkOutbound", () => {
  it("outbound-eligible surface with events returns GREEN", () => {
    const surface = getProductLadderEntry("outbound-linkedin")!;
    const result = checkOutbound(surface);
    expect(result.status).toBe("GREEN");
  });

  it("non-outbound surface returns GREY", () => {
    const surface = getProductLadderEntry("executive-reporting")!;
    const result = checkOutbound(surface);
    expect(result.status).toBe("GREY");
  });
});

// ─── 9. Simulation-only events ───────────────────────────────────────────────

describe("checkSimulationOnlyEvents", () => {
  it("surface without simulation events returns GREEN", () => {
    const surface = getProductLadderEntry("executive-reporting")!;
    const result = checkSimulationOnlyEvents(surface);
    expect(result.status).toBe("GREEN");
  });

  it("surface with BOARDROOM_DOSSIER_PREVIEWED in lineageEvents returns AMBER", () => {
    // Create a surface-like object with simulation events
    const result = checkSimulationOnlyEvents({
      ...getProductLadderEntry("executive-reporting")!,
      lineageEvents: ["BOARDROOM_DOSSIER_PREVIEWED"],
    });
    expect(result.status).toBe("AMBER");
  });

  it("surface with SIMULATED event in lineageEvents returns AMBER", () => {
    const result = checkSimulationOnlyEvents({
      ...getProductLadderEntry("executive-reporting")!,
      lineageEvents: ["BOARDROOM_DOSSIER_EXPORTED_SIMULATED"],
    });
    expect(result.status).toBe("AMBER");
  });
});

// ─── 10. Aggregate status ────────────────────────────────────────────────────

describe("aggregateStatus", () => {
  it("all GREEN returns GREEN", () => {
    const result = aggregateStatus([
      { status: "GREEN", explanation: "ok" },
      { status: "GREEN", explanation: "ok" },
    ]);
    expect(result.status).toBe("GREEN");
  });

  it("any RED returns RED", () => {
    const result = aggregateStatus([
      { status: "GREEN", explanation: "ok" },
      { status: "RED", explanation: "fail" },
    ]);
    expect(result.status).toBe("RED");
  });

  it("AMBER without RED returns AMBER", () => {
    const result = aggregateStatus([
      { status: "GREEN", explanation: "ok" },
      { status: "AMBER", explanation: "partial" },
    ]);
    expect(result.status).toBe("AMBER");
  });

  it("all GREY returns GREY", () => {
    const result = aggregateStatus([
      { status: "GREY", explanation: "n/a" },
      { status: "GREY", explanation: "n/a" },
    ]);
    expect(result.status).toBe("GREY");
  });
});

// ─── 11. Run all rules for a surface ─────────────────────────────────────────

describe("runAllRules", () => {
  it("returns rules for existing surface", () => {
    const results = runAllRules("executive-reporting");
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns RED for non-existent surface", () => {
    const results = runAllRules("nonexistent");
    expect(results[0]?.status).toBe("RED");
  });
});
