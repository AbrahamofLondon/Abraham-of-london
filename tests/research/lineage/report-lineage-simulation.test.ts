/**
 * tests/research/lineage/report-lineage-simulation.test.ts
 *
 * Tests for the Report Lineage Simulation engine.
 * Verifies chain completeness, gap detection, finding generation,
 * and registry validation.
 */

import { describe, it, expect } from "vitest";
import { simulateLineageChain, simulateAllLineageChains } from "@/lib/research/lineage/report-lineage-simulation";
import { getAllChainIds } from "@/lib/research/lineage/lineage-chain-definitions";
import { getEventType } from "@/lib/platform/governance-event-types";
import { getCanonicalRecord } from "@/lib/platform/canonical-record-registry";
import { getProductLadderEntry } from "@/lib/platform/product-ladder-registry";
import { getAdminRoute } from "@/lib/platform/admin-domain-registry";

// ─── 1. All chains produce results ───────────────────────────────────────────

describe("all chains produce results", () => {
  const results = simulateAllLineageChains();

  it("returns results for all defined chains", () => {
    const chainIds = getAllChainIds();
    expect(results.length).toBe(chainIds.length);
  });

  it("every result has a chainId and title", () => {
    for (const result of results) {
      expect(result.chainId).toBeTruthy();
      expect(result.title).toBeTruthy();
    }
  });

  it("every result has events array", () => {
    for (const result of results) {
      expect(Array.isArray(result.events)).toBe(true);
      expect(result.events.length).toBeGreaterThan(0);
    }
  });
});

// ─── 2. Executive Reporting chain ────────────────────────────────────────────

describe("Executive Reporting chain", () => {
  const result = simulateLineageChain("executive-reporting");

  it("returns expected event sequence", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toEqual([
      "EXECUTIVE_REPORT_STARTED",
      "EXECUTIVE_REPORT_GENERATED",
      "EXECUTIVE_REPORT_REVIEWED",
      "EXECUTIVE_REPORT_EXPORTED",
      "EXECUTIVE_REPORT_REVOKED",
    ]);
  });

  it("all events reference ExecutiveReport canonical record", () => {
    for (const event of result.events) {
      expect(event.canonicalRecord).toBe("ExecutiveReport");
    }
  });

  it("all events have registry source references", () => {
    for (const event of result.events) {
      expect(event.registrySource.productSurface).toBeTruthy();
      expect(event.registrySource.canonicalRecord).toBeTruthy();
      expect(event.registrySource.governanceEvent).toBeTruthy();
    }
  });
});

// ─── 3. ER → Boardroom chain ─────────────────────────────────────────────────

describe("ER → Boardroom chain", () => {
  const result = simulateLineageChain("executive-report-boardroom");

  it("includes ER_MAPPED_TO_INTELLIGENCE_SPINE", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("ER_MAPPED_TO_INTELLIGENCE_SPINE");
  });

  it("includes BOARDROOM_QUALIFICATION_EVALUATED", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("BOARDROOM_QUALIFICATION_EVALUATED");
  });

  it("includes BOARDROOM_DOSSIER_PREVIEWED", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("BOARDROOM_DOSSIER_PREVIEWED");
  });

  it("transitions from ExecutiveReport to BoardroomDossier canonical record", () => {
    const firstRecord = result.events[0]?.canonicalRecord;
    const lastRecord = result.events[result.events.length - 1]?.canonicalRecord;
    expect(firstRecord).toBe("ExecutiveReport");
    expect(lastRecord).toBe("BoardroomDossier");
  });
});

// ─── 4. Strategy Room chain ──────────────────────────────────────────────────

describe("Strategy Room chain", () => {
  const result = simulateLineageChain("strategy-room");

  it("includes DIRECTIVE_DERIVED", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("DIRECTIVE_DERIVED");
  });

  it("includes ACTION_REQUIRED", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("ACTION_REQUIRED");
  });

  it("all events reference StrategyRoomCase canonical record", () => {
    for (const event of result.events) {
      expect(event.canonicalRecord).toBe("StrategyRoomCase");
    }
  });
});

// ─── 5. Outbound chain ───────────────────────────────────────────────────────

describe("Outbound Publishing chain", () => {
  const result = simulateLineageChain("outbound-publishing");

  it("includes OUTBOUND_POLICY_CHECKED", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("OUTBOUND_POLICY_CHECKED");
  });

  it("includes OUTBOUND_SYNCED", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("OUTBOUND_SYNCED");
  });

  it("includes OUTBOUND_FAILED", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("OUTBOUND_FAILED");
  });
});

// ─── 6. Foundry chain ────────────────────────────────────────────────────────

describe("Foundry ResearchRun chain", () => {
  const result = simulateLineageChain("foundry-research-run");

  it("includes FINDING_CREATED", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("FINDING_CREATED");
  });

  it("includes ACTION_BRIEF_EXPORTED", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("ACTION_BRIEF_EXPORTED");
  });

  it("includes IMPLEMENTED and ARCHIVED", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("IMPLEMENTED");
    expect(eventTypes).toContain("ARCHIVED");
  });

  it("uses FOUNDRY_ACTION_REQUIRED (not generic ACTION_REQUIRED)", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("FOUNDRY_ACTION_REQUIRED");
    expect(eventTypes).not.toContain("ACTION_REQUIRED");
  });
});

// ─── 7. Content / Editorial chain ────────────────────────────────────────────

describe("Content / Editorial chain", () => {
  const result = simulateLineageChain("content-editorial");

  it("includes CONTENT_PUBLISHED", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("CONTENT_PUBLISHED");
  });

  it("includes CONTENT_STYLE_CHECKED", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("CONTENT_STYLE_CHECKED");
  });
});

// ─── 8. GMI Release chain ────────────────────────────────────────────────────

describe("GMI Release chain", () => {
  const result = simulateLineageChain("gmi-release");

  it("includes GMI_RELEASE_PUBLISHED", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("GMI_RELEASE_PUBLISHED");
  });

  it("includes GMI_QUALITY_GATE_RUN", () => {
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("GMI_QUALITY_GATE_RUN");
  });
});

// ─── 9. Registry validation ──────────────────────────────────────────────────

describe("registry validation", () => {
  it("every event governance event exists in governance-event-types", () => {
    const results = simulateAllLineageChains();
    for (const result of results) {
      for (const event of result.events) {
        const govEvent = getEventType(event.eventType);
        // Some events like BOARDROOM_DOSSIER_PREVIEWED, CONTENT_ASSET_CREATED,
        // CONTENT_STYLE_CHECKED, CONTENT_METADATA_VALIDATED, CONTENT_OUTBOUND_ELIGIBLE,
        // GMI_PRIOR_CALLS_REVIEWED, GMI_QUALITY_GATE_RUN, GMI_CALL_CARRIED_FORWARD
        // may not yet be registered — they will produce gaps
        if (!govEvent) {
          const gap = result.gaps.find((g) => g.eventType === event.eventType);
          expect(gap).toBeDefined();
          expect(gap?.gapType).toBe("MISSING_GOVERNANCE_EVENT");
        }
      }
    }
  });

  it("every event canonical record exists in canonical-record-registry", () => {
    const results = simulateAllLineageChains();
    for (const result of results) {
      for (const event of result.events) {
        const record = getCanonicalRecord(event.canonicalRecord);
        if (!record) {
          const gap = result.gaps.find(
            (g) => g.eventType === event.eventType && g.gapType === "MISSING_CANONICAL_RECORD",
          );
          expect(gap).toBeDefined();
        }
      }
    }
  });

  it("every event source surface exists in product-ladder-registry", () => {
    const results = simulateAllLineageChains();
    for (const result of results) {
      for (const event of result.events) {
        const surface = getProductLadderEntry(event.sourceSurface);
        if (!surface) {
          const gap = result.gaps.find(
            (g) => g.eventType === event.eventType && g.gapType === "MISSING_PRODUCT_SURFACE",
          );
          expect(gap).toBeDefined();
        }
      }
    }
  });
});

// ─── 10. Gap and finding generation ──────────────────────────────────────────

describe("gap and finding generation", () => {
  it("missing governance event creates gap", () => {
    // CONTENT_ASSET_CREATED is a chain event that may not be in governance-event-types
    const result = simulateLineageChain("content-editorial");
    const contentCreatedEvent = result.events.find((e) => e.eventType === "CONTENT_ASSET_CREATED");
    if (contentCreatedEvent) {
      const govEvent = getEventType("CONTENT_ASSET_CREATED");
      if (!govEvent) {
        const gap = result.gaps.find((g) => g.eventType === "CONTENT_ASSET_CREATED");
        expect(gap).toBeDefined();
        expect(gap?.gapType).toBe("MISSING_GOVERNANCE_EVENT");
      }
    }
  });

  it("HIGH/CRITICAL gaps create findings", () => {
    const results = simulateAllLineageChains();
    for (const result of results) {
      const highCriticalGaps = result.gaps.filter(
        (g) => g.severity === "HIGH" || g.severity === "CRITICAL",
      );
      if (highCriticalGaps.length > 0) {
        expect(result.findings.length).toBeGreaterThanOrEqual(highCriticalGaps.length);
      }
    }
  });

  it("COMPLETE chain has no gaps", () => {
    const results = simulateAllLineageChains();
    for (const result of results) {
      if (result.status === "COMPLETE") {
        expect(result.gaps.length).toBe(0);
      }
    }
  });

  it("ER → Boardroom chain is COMPLETE after vocabulary closure", () => {
    const result = simulateLineageChain("executive-report-boardroom");
    expect(result.status).toBe("COMPLETE");
    expect(result.gaps.length).toBe(0);
  });

  it("Content / Editorial chain is COMPLETE after vocabulary closure", () => {
    const result = simulateLineageChain("content-editorial");
    expect(result.status).toBe("COMPLETE");
    expect(result.gaps.length).toBe(0);
  });

  it("GMI Release chain is COMPLETE after vocabulary closure", () => {
    const result = simulateLineageChain("gmi-release");
    expect(result.status).toBe("COMPLETE");
    expect(result.gaps.length).toBe(0);
  });

  it("Foundry ResearchRun chain is COMPLETE after FOUNDRY_ACTION_REQUIRED", () => {
    const result = simulateLineageChain("foundry-research-run");
    expect(result.status).toBe("COMPLETE");
    expect(result.gaps.length).toBe(0);
  });

  it("researchRunRecommended is true when findings exist", () => {
    const results = simulateAllLineageChains();
    for (const result of results) {
      if (result.findings.length > 0) {
        expect(result.researchRunRecommended).toBe(true);
      }
    }
  });

  it("every gap has sourceRule", () => {
    const results = simulateAllLineageChains();
    for (const result of results) {
      for (const gap of result.gaps) {
        expect(typeof gap.sourceRule).toBe("string");
        expect(gap.sourceRule.length).toBeGreaterThan(0);
      }
    }
  });

  it("every finding has source", () => {
    const results = simulateAllLineageChains();
    for (const result of results) {
      for (const finding of result.findings) {
        expect(typeof finding.source).toBe("string");
        expect(finding.source.length).toBeGreaterThan(0);
      }
    }
  });
});

// ─── 11. Product health integration ───────────────────────────────────────────

describe("product health integration", () => {
  it("getProductHealthForSurface returns health for executive-reporting", async () => {
    const mod = await import("@/lib/research/product-health/product-health-service");
    const health = mod.getProductHealthForSurface("executive-reporting");
    expect(health).not.toBeNull();
    expect(["GREEN", "AMBER", "RED", "GREY"]).toContain(health!.overallStatus);
  });

  it("getProductHealthOverview returns all surfaces", async () => {
    const mod = await import("@/lib/research/product-health/product-health-service");
    const overview = mod.getProductHealthOverview();
    expect(overview.surfaces.length).toBeGreaterThan(0);
    expect(overview.summary.total).toBe(overview.surfaces.length);
  });
});
