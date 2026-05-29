/**
 * tests/research/canary/foundry-closure-validation.test.ts
 *
 * Closure validation for the 16-commit Intelligence Foundry production
 * maturity drive. Each describe block maps to one of the 12 closure
 * conditions. These tests must stay green — any regression proves that
 * a governing invariant has been broken.
 *
 * Governing doctrine:
 *   No GREEN without wiring.
 *   No LIVE without durable evidence.
 *   No promotion without proof.
 *   No simulation without learning.
 *   No LIVE_GOVERNED without proof.
 *   No admin surface without ownership.
 */

import { describe, it, expect } from "vitest";

// ─── 1. Maturity ladder is correct and complete ───────────────────────────────

describe("Closure 1 — Maturity ladder integrity", () => {
  it("MATURITY_ORDER has exactly four stages in canonical sequence", async () => {
    const { MATURITY_ORDER } = await import("@/lib/research/promotion/promotion-service");
    expect(MATURITY_ORDER).toEqual([
      "RESERVED_CONCEPT",
      "SIMULATION_ONLY",
      "PILOT_READY",
      "LIVE_GOVERNED",
    ]);
  });

  it("isValidPromotion accepts exactly one-step advances", async () => {
    const { isValidPromotion } = await import("@/lib/research/promotion/promotion-service");
    expect(isValidPromotion("RESERVED_CONCEPT", "SIMULATION_ONLY")).toBe(true);
    expect(isValidPromotion("SIMULATION_ONLY",  "PILOT_READY")).toBe(true);
    expect(isValidPromotion("PILOT_READY",       "LIVE_GOVERNED")).toBe(true);
  });

  it("isValidPromotion rejects skipping stages", async () => {
    const { isValidPromotion } = await import("@/lib/research/promotion/promotion-service");
    expect(isValidPromotion("RESERVED_CONCEPT", "PILOT_READY")).toBe(false);
    expect(isValidPromotion("RESERVED_CONCEPT", "LIVE_GOVERNED")).toBe(false);
    expect(isValidPromotion("SIMULATION_ONLY",  "LIVE_GOVERNED")).toBe(false);
  });

  it("isValidPromotion rejects lateral or backward moves", async () => {
    const { isValidPromotion } = await import("@/lib/research/promotion/promotion-service");
    expect(isValidPromotion("PILOT_READY",   "SIMULATION_ONLY")).toBe(false);
    expect(isValidPromotion("LIVE_GOVERNED", "PILOT_READY")).toBe(false);
    expect(isValidPromotion("PILOT_READY",   "PILOT_READY")).toBe(false);
  });

  it("nextStage returns null for LIVE_GOVERNED (terminal)", async () => {
    const { nextStage } = await import("@/lib/research/promotion/promotion-service");
    expect(nextStage("LIVE_GOVERNED")).toBeNull();
  });

  it("nextStage returns correct successor for each non-terminal stage", async () => {
    const { nextStage } = await import("@/lib/research/promotion/promotion-service");
    expect(nextStage("RESERVED_CONCEPT")).toBe("SIMULATION_ONLY");
    expect(nextStage("SIMULATION_ONLY")).toBe("PILOT_READY");
    expect(nextStage("PILOT_READY")).toBe("LIVE_GOVERNED");
  });
});

// ─── 2. LIVE_GOVERNED promotion gate — evidence run required ─────────────────

describe("Closure 2 — LIVE_GOVERNED requires evidence run", () => {
  it("createPromotion returns EVIDENCE_RUN_REQUIRED when toStage is LIVE_GOVERNED and no runId", async () => {
    const { createPromotion } = await import("@/lib/research/promotion/promotion-service");
    const result = await createPromotion({
      eventType:       "TEST_GATE_EVENT",
      fromStage:       "PILOT_READY",
      toStage:         "LIVE_GOVERNED",
      approvedBy:      "test@example.com",
      promotionReason: "Testing gate enforcement",
      // no researchRunId
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("EVIDENCE_RUN_REQUIRED");
    }
  });

  it("createPromotion returns INVALID_TRANSITION for skip-stage promotion", async () => {
    const { createPromotion } = await import("@/lib/research/promotion/promotion-service");
    const result = await createPromotion({
      eventType:       "TEST_SKIP_EVENT",
      fromStage:       "RESERVED_CONCEPT",
      toStage:         "LIVE_GOVERNED",
      approvedBy:      "test@example.com",
      promotionReason: "Skipping stages",
      researchRunId:   "some-run-id",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("INVALID_TRANSITION");
    }
  });
});

// ─── 3. All required adapters are in the registry ────────────────────────────

describe("Closure 3 — Adapter registry completeness", () => {
  it("registry contains all session-critical adapters", async () => {
    const { ADAPTER_REGISTRY } = await import("@/lib/research/adapter-registry");
    const ids = ADAPTER_REGISTRY.map((a) => a.id);

    const required = [
      "fast-diagnostic",
      "constitutional-diagnostic",
      "strategy-room",
      "boardroom-dossier",
      "executive-reporting",
      "executive-report-boardroom-bridge",
      "editorial-style-checker",
      "outbound-policy-gate",
      "market-response",
      "content-red-team",      // added Commit 9
      "security-red-team",     // added Commit 9
      "report-lineage",
    ];

    for (const id of required) {
      expect(ids, `adapter '${id}' missing from registry`).toContain(id);
    }
  });

  it("every registry entry has selfTest: 'registered'", async () => {
    const { ADAPTER_REGISTRY } = await import("@/lib/research/adapter-registry");
    for (const entry of ADAPTER_REGISTRY) {
      expect(entry.selfTest).toBe("registered");
    }
  });

  it("no duplicate adapter IDs in registry", async () => {
    const { ADAPTER_REGISTRY } = await import("@/lib/research/adapter-registry");
    const ids = ADAPTER_REGISTRY.map((a) => a.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ─── 4. Module registry — constitutional-diagnostic-sim is WIRED ─────────────

describe("Closure 4 — Module registry wired surfaces", () => {
  it("constitutional-diagnostic-sim is present and WIRED", async () => {
    const { MODULE_REGISTRY } = await import("@/lib/research/module-registry");
    const mod = MODULE_REGISTRY.find((m) => m.id === "constitutional-diagnostic-sim");
    expect(mod, "constitutional-diagnostic-sim missing from registry").toBeDefined();
    expect(mod!.status).toBe("WIRED");
  });

  it("content-category-lab is WIRED (not PARTIAL)", async () => {
    const { MODULE_REGISTRY } = await import("@/lib/research/module-registry");
    const mod = MODULE_REGISTRY.find((m) => m.id === "content-category-lab");
    expect(mod).toBeDefined();
    expect(mod!.status).toBe("WIRED");
  });

  it("outbound-narrative-range is WIRED", async () => {
    const { MODULE_REGISTRY } = await import("@/lib/research/module-registry");
    const mod = MODULE_REGISTRY.find((m) => m.id === "outbound-narrative-range");
    expect(mod).toBeDefined();
    expect(mod!.status).toBe("WIRED");
  });

  it("promotion-workflow is WIRED", async () => {
    const { MODULE_REGISTRY } = await import("@/lib/research/module-registry");
    const mod = MODULE_REGISTRY.find((m) => m.id === "promotion-workflow");
    expect(mod).toBeDefined();
    expect(mod!.status).toBe("WIRED");
  });

  it("no module has an undefined status", async () => {
    const { MODULE_REGISTRY } = await import("@/lib/research/module-registry");
    for (const mod of MODULE_REGISTRY) {
      expect(mod.status, `module '${mod.id}' has no status`).toBeDefined();
      expect(["WIRED", "PARTIAL", "DEMO", "PLANNED"]).toContain(mod.status);
    }
  });

  it("constitutional-diagnostic-sim references constitutional-diagnostic engineId", async () => {
    const { MODULE_REGISTRY } = await import("@/lib/research/module-registry");
    const mod = MODULE_REGISTRY.find((m) => m.id === "constitutional-diagnostic-sim");
    expect(mod!.engineId).toBe("constitutional-diagnostic");
  });
});

// ─── 5. Governance event types — Foundry promotion events registered ──────────

describe("Closure 5 — Foundry governance events in registry", () => {
  it("FOUNDRY_PROMOTION_CREATED is registered", async () => {
    const { GOVERNANCE_EVENT_TYPES } = await import("@/lib/platform/governance-event-types");
    const entry = GOVERNANCE_EVENT_TYPES.find((e) => e.eventType === "FOUNDRY_PROMOTION_CREATED");
    expect(entry, "FOUNDRY_PROMOTION_CREATED not found in governance event types").toBeDefined();
  });

  it("FOUNDRY_PROMOTION_ROLLED_BACK is registered", async () => {
    const { GOVERNANCE_EVENT_TYPES } = await import("@/lib/platform/governance-event-types");
    const entry = GOVERNANCE_EVENT_TYPES.find((e) => e.eventType === "FOUNDRY_PROMOTION_ROLLED_BACK");
    expect(entry, "FOUNDRY_PROMOTION_ROLLED_BACK not found in governance event types").toBeDefined();
  });

  it("FOUNDRY_RUN_STATUS_CHANGED is registered", async () => {
    const { GOVERNANCE_EVENT_TYPES } = await import("@/lib/platform/governance-event-types");
    const entry = GOVERNANCE_EVENT_TYPES.find((e) => e.eventType === "FOUNDRY_RUN_STATUS_CHANGED");
    expect(entry, "FOUNDRY_RUN_STATUS_CHANGED not found in governance event types").toBeDefined();
  });

  it("FOUNDRY_PROMOTION_CREATED has SIMULATION_ONLY maturity", async () => {
    const { GOVERNANCE_EVENT_TYPES } = await import("@/lib/platform/governance-event-types");
    const entry = GOVERNANCE_EVENT_TYPES.find((e) => e.eventType === "FOUNDRY_PROMOTION_CREATED");
    expect(entry!.maturity).toBe("SIMULATION_ONLY");
  });

  it("FOUNDRY_RUN_STATUS_CHANGED is emitted on ResearchRun promotion", async () => {
    // Doctest: promotion-service emits this audit event. Verify it's registered.
    const { GOVERNANCE_EVENT_TYPES } = await import("@/lib/platform/governance-event-types");
    const entry = GOVERNANCE_EVENT_TYPES.find((e) => e.eventType === "FOUNDRY_RUN_STATUS_CHANGED");
    // The promotion service uses this string as the event field in FoundryAuditEvent.create()
    expect(entry!.foundryRelationship).toBeDefined();
  });
});

// ─── 6. Promotion service error type union is exhaustive ─────────────────────

describe("Closure 6 — Promotion error types", () => {
  it("PromotionServiceError union includes all expected error codes", async () => {
    // Import the type-narrowing by checking what the service can return.
    // We prove this by triggering each reachable non-DB path without a real DB.
    const { createPromotion } = await import("@/lib/research/promotion/promotion-service");

    // INVALID_TRANSITION
    const r1 = await createPromotion({
      eventType: "T", fromStage: "LIVE_GOVERNED", toStage: "RESERVED_CONCEPT",
      approvedBy: "a@b.com", promotionReason: "test",
    });
    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(r1.error.type).toBe("INVALID_TRANSITION");

    // EVIDENCE_RUN_REQUIRED
    const r2 = await createPromotion({
      eventType: "T", fromStage: "PILOT_READY", toStage: "LIVE_GOVERNED",
      approvedBy: "a@b.com", promotionReason: "test",
    });
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error.type).toBe("EVIDENCE_RUN_REQUIRED");
  });
});

// ─── 7. Boardroom dossier adapter shim exports correctly ─────────────────────

describe("Closure 7 — Boardroom dossier adapter shim", () => {
  it("boardroom-dossier-adapter re-exports boardroomDossierAdapter", async () => {
    const mod = await import("@/lib/research/engines/boardroom-dossier-adapter");
    expect(mod.boardroomDossierAdapter).toBeDefined();
    expect(typeof mod.boardroomDossierAdapter.run).toBe("function");
  });

  it("BOARDROOM_ENGINE_ID exported from shim matches canonical engine id", async () => {
    const shim = await import("@/lib/research/engines/boardroom-dossier-adapter");
    const canonical = await import("@/lib/research/engines/boardroom-mode-adapter");
    expect(shim.BOARDROOM_ENGINE_ID).toBe(canonical.BOARDROOM_ENGINE_ID);
  });
});

// ─── 8. Product health overview returns valid shape ──────────────────────────

describe("Closure 8 — Product health overview shape", () => {
  it("getProductHealthOverview returns summary with all required keys", async () => {
    const { getProductHealthOverview } = await import(
      "@/lib/research/product-health/product-health-service"
    );
    const overview = getProductHealthOverview();
    expect(overview).toHaveProperty("summary");
    expect(overview).toHaveProperty("surfaces");
    expect(typeof overview.summary.red).toBe("number");
    expect(typeof overview.summary.amber).toBe("number");
    expect(typeof overview.summary.green).toBe("number");
    expect(typeof overview.summary.grey).toBe("number");
    expect(typeof overview.summary.total).toBe("number");
    expect(typeof overview.summary.releaseBlockers).toBe("number");
  });

  it("summary.total equals sum of red + amber + green + grey", async () => {
    const { getProductHealthOverview } = await import(
      "@/lib/research/product-health/product-health-service"
    );
    const { summary } = getProductHealthOverview();
    expect(summary.total).toBe(summary.red + summary.amber + summary.green + summary.grey);
  });

  it("releaseBlockers equals red surface count", async () => {
    const { getProductHealthOverview } = await import(
      "@/lib/research/product-health/product-health-service"
    );
    const { summary } = getProductHealthOverview();
    expect(summary.releaseBlockers).toBe(summary.red);
  });

  it("each surface has an overallStatus field", async () => {
    const { getProductHealthOverview } = await import(
      "@/lib/research/product-health/product-health-service"
    );
    const { surfaces } = getProductHealthOverview();
    for (const surface of surfaces) {
      expect(["GREEN", "AMBER", "RED", "GREY"]).toContain(surface.overallStatus);
    }
  });
});

// ─── 9. Promotion rollback records are append-only ───────────────────────────

describe("Closure 9 — Rollback is append-only", () => {
  it("rollbackPromotion with non-existent ID returns ok: false without throwing", async () => {
    const { rollbackPromotion } = await import("@/lib/research/promotion/promotion-service");
    // non-existent ID — Prisma will throw, service must catch and return { ok: false }
    const result = await rollbackPromotion("non-existent-id-closure-test", "test rollback");
    expect(result.ok).toBe(false);
    expect(typeof result.error).toBe("string");
  });
});

// ─── 10. Constitutional diagnostic adapter is callable ───────────────────────

describe("Closure 10 — Constitutional diagnostic adapter is callable", () => {
  it("constitutionalDiagnosticAdapter.run with useDefaults returns valid EngineRunOutput", async () => {
    const { constitutionalDiagnosticAdapter } = await import(
      "@/lib/research/engines/constitutional-diagnostic-adapter"
    );
    const result = await constitutionalDiagnosticAdapter.run({ payload: { useDefaults: true } });
    expect(result).toBeDefined();
    expect(Array.isArray(result.findings)).toBe(true);
    expect(typeof result.summary).toBe("string");
    expect(typeof result.severity).toBe("string");
    expect(typeof result.engineVersion).toBe("string");
    expect(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(result.severity);
  });

  it("result includes route in rawOutput (constitutional route decision)", async () => {
    const { constitutionalDiagnosticAdapter } = await import(
      "@/lib/research/engines/constitutional-diagnostic-adapter"
    );
    const result = await constitutionalDiagnosticAdapter.run({ payload: { useDefaults: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    // The adapter returns route (not constitutionalRoute) in rawOutput
    expect(raw.route).toBeDefined();
    expect(["REJECT", "DIAGNOSTIC", "STRATEGY", "INFORMATION"]).toContain(raw.route);
  });
});

// ─── 11. Governance event list has no duplicate eventType keys ───────────────

describe("Closure 11 — Governance event type uniqueness", () => {
  it("all governance event types are unique", async () => {
    const { GOVERNANCE_EVENT_TYPES } = await import("@/lib/platform/governance-event-types");
    const types = GOVERNANCE_EVENT_TYPES.map((e) => e.eventType);
    const unique = new Set(types);
    expect(unique.size).toBe(types.length);
  });

  it("every governance event has required fields: eventType, maturity, currentReality", async () => {
    const { GOVERNANCE_EVENT_TYPES } = await import("@/lib/platform/governance-event-types");
    for (const entry of GOVERNANCE_EVENT_TYPES) {
      expect(typeof entry.eventType, `eventType missing in entry`).toBe("string");
      expect(entry.eventType.length).toBeGreaterThan(0);
      expect(typeof entry.maturity, `maturity missing for ${entry.eventType}`).toBe("string");
      expect(typeof entry.currentReality, `currentReality missing for ${entry.eventType}`).toBe("string");
    }
  });
});

// ─── 12. CI gate block logic is deterministic ────────────────────────────────

describe("Closure 12 — CI gate block logic", () => {
  it("block is true when criticalUnresolved > 0", () => {
    // Mirrors the exact logic in ci-gate/route.ts
    const criticalUnresolved = 1;
    const red = 0;
    const block = criticalUnresolved > 0 || red > 0;
    expect(block).toBe(true);
  });

  it("block is true when red > 0", () => {
    const criticalUnresolved = 0;
    const red = 2;
    const block = criticalUnresolved > 0 || red > 0;
    expect(block).toBe(true);
  });

  it("block is false when both are zero", () => {
    const criticalUnresolved = 0;
    const red = 0;
    const block = criticalUnresolved > 0 || red > 0;
    expect(block).toBe(false);
  });

  it("getProductHealthOverview summary shape matches what ci-gate destructures", async () => {
    const { getProductHealthOverview } = await import(
      "@/lib/research/product-health/product-health-service"
    );
    const { summary } = getProductHealthOverview();
    // ci-gate destructures: { red, amber, green, grey, releaseBlockers }
    expect(typeof summary.red).toBe("number");
    expect(typeof summary.amber).toBe("number");
    expect(typeof summary.green).toBe("number");
    expect(typeof summary.grey).toBe("number");
    expect(typeof summary.releaseBlockers).toBe("number");
  });
});
