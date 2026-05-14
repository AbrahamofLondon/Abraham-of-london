import { describe, expect, it } from "vitest";

import {
  buildRetainerReadinessRemediation,
  type RemediationInput,
} from "@/lib/admin/retainer-readiness-remediation";

function baseInput(overrides?: Partial<RemediationInput>): RemediationInput {
  return {
    readiness: {
      roleContractActive: true,
      sponsorCommandSummaryComplete: true,
      portfolioExposureMature: true,
      evidenceIntegrity: true,
      ipExposureControl: true,
      cadenceSignalActive: false,
      counselMemoryExists: true,
      boardroomMemoryExists: true,
      outcomeThin: false,
    },
    queueCounts: {
      due: 0,
      overdue: 0,
      skipped: 0,
      escalated: 0,
      notConfigured: 0,
    },
    runtime: {
      schedulerBackedCadence: true,
      cadenceTickVerified: true,
      emailTransportStatus: "PROVIDER_READY",
      pdfRuntimeVerified: true,
      suppressionLedgerCoverage: 6,
      portfolioScopeMaturity: "DEFENSIBLE",
      crossOrgPatternDepth: "DEFENSIBLE",
      roleDataLayerCoverage: "DEFENSIBLE",
      retainedHistoryDepth: "SUFFICIENT",
      deliveryAuditDepth: "DEFENSIBLE",
      institutionalCaseContinuity: "DEFENSIBLE",
      executiveToStrategyContinuity: "DEFENSIBLE",
      strategyToCounselContinuity: "DEFENSIBLE",
      strategyToBoardroomContinuity: "DEFENSIBLE",
      boardroomArchiveDepth: "DEFENSIBLE",
      oversightCaseCoverage: "DEFENSIBLE",
      cadenceRuntimeDepth: "DEFENSIBLE",
      portfolioInstitutionalCoverage: "DEFENSIBLE",
      suppressionCorridorCoverage: "DEFENSIBLE",
      deliveryRuntimeProof: "DEFENSIBLE",
      retainedOutcomeDepth: "DEFENSIBLE",
    },
    verificationQueuePosture: {
      reviewSlaBand: "GREEN",
      pendingCount: 0,
      criticalPendingCount: 0,
      overdueReviewCount: 0,
      oldestPendingAge: 0,
    },
    ...overrides,
  };
}

describe("buildRetainerReadinessRemediation", () => {
  it("produces no urgent remediation when all dimensions pass", () => {
    const result = buildRetainerReadinessRemediation(baseInput());
    const failing = result.filter((r) => r.status === "FAIL");
    expect(failing).toHaveLength(0);
    const critical = result.filter((r) => r.severity === "CRITICAL");
    expect(critical).toHaveLength(0);
  });

  it("failing cadence dimension links to /admin/retained-cadence", () => {
    const result = buildRetainerReadinessRemediation(
      baseInput({ queueCounts: { due: 0, overdue: 2, skipped: 0, escalated: 0, notConfigured: 0 } }),
    );
    const cadence = result.find((r) => r.dimension === "Overdue cadence cycles");
    expect(cadence).toBeDefined();
    expect(cadence?.status).toBe("FAIL");
    expect(cadence?.actionHref).toBe("/admin/retained-cadence");
  });

  it("cadence not configured also links to /admin/retained-cadence", () => {
    const result = buildRetainerReadinessRemediation(
      baseInput({ queueCounts: { due: 0, overdue: 0, skipped: 0, escalated: 0, notConfigured: 3 } }),
    );
    const item = result.find((r) => r.dimension === "Cadence configuration");
    expect(item).toBeDefined();
    expect(item?.actionHref).toBe("/admin/retained-cadence");
  });

  it("delivery audit failure links to /admin/delivery-queue", () => {
    const result = buildRetainerReadinessRemediation(
      baseInput({
        runtime: {
          ...baseInput().runtime,
          deliveryAuditDepth: "FOUNDATION_READY",
        },
      }),
    );
    const delivery = result.find((r) => r.dimension === "Delivery audit depth");
    expect(delivery).toBeDefined();
    expect(delivery?.actionHref).toBe("/admin/delivery-queue");
  });

  it("suppression issue links to /admin/suppression-ledger", () => {
    const result = buildRetainerReadinessRemediation(
      baseInput({
        runtime: {
          ...baseInput().runtime,
          suppressionLedgerCoverage: 2,
        },
      }),
    );
    const suppression = result.find((r) => r.dimension === "Suppression ledger coverage");
    expect(suppression).toBeDefined();
    expect(suppression?.actionHref).toBe("/admin/suppression-ledger");
  });

  it("unavailable-equivalent: thin outcome produces FAIL not PASS", () => {
    const result = buildRetainerReadinessRemediation(
      baseInput({
        readiness: {
          ...baseInput().readiness,
          outcomeThin: true,
        },
      }),
    );
    const outcome = result.find((r) => r.dimension === "Retained outcome history");
    expect(outcome).toBeDefined();
    expect(outcome?.status).toBe("FAIL");
    expect(outcome?.status).not.toBe("PASS");
  });

  it("severity ordering places CRITICAL and HIGH before MEDIUM and LOW", () => {
    const result = buildRetainerReadinessRemediation(
      baseInput({
        queueCounts: { due: 0, overdue: 5, skipped: 0, escalated: 0, notConfigured: 1 },
        runtime: {
          ...baseInput().runtime,
          suppressionLedgerCoverage: 1,
          deliveryAuditDepth: "FOUNDATION_READY",
        },
        verificationQueuePosture: {
          reviewSlaBand: "CRITICAL",
          pendingCount: 4,
          criticalPendingCount: 4,
          overdueReviewCount: 2,
          oldestPendingAge: 10,
        },
      }),
    );
    const severities = result.map((r) => r.severity);
    const criticalIndex = severities.indexOf("CRITICAL");
    const lowIndex = severities.lastIndexOf("LOW");
    const mediumIndex = severities.lastIndexOf("MEDIUM");
    // CRITICAL must appear before LOW and MEDIUM
    if (criticalIndex !== -1 && lowIndex !== -1) {
      expect(criticalIndex).toBeLessThan(lowIndex);
    }
    if (criticalIndex !== -1 && mediumIndex !== -1) {
      expect(criticalIndex).toBeLessThan(mediumIndex);
    }
  });

  it("overdue >= 3 produces CRITICAL severity", () => {
    const result = buildRetainerReadinessRemediation(
      baseInput({ queueCounts: { due: 0, overdue: 3, skipped: 0, escalated: 0, notConfigured: 0 } }),
    );
    const item = result.find((r) => r.dimension === "Overdue cadence cycles");
    expect(item?.severity).toBe("CRITICAL");
  });

  it("overdue < 3 produces HIGH not CRITICAL", () => {
    const result = buildRetainerReadinessRemediation(
      baseInput({ queueCounts: { due: 0, overdue: 2, skipped: 0, escalated: 0, notConfigured: 0 } }),
    );
    const item = result.find((r) => r.dimension === "Overdue cadence cycles");
    expect(item?.severity).toBe("HIGH");
  });

  it("email transport TRANSPORT_PENDING produces FAIL with owner founder", () => {
    const result = buildRetainerReadinessRemediation(
      baseInput({
        runtime: {
          ...baseInput().runtime,
          emailTransportStatus: "TRANSPORT_PENDING",
        },
      }),
    );
    const item = result.find((r) => r.dimension === "Email transport");
    expect(item?.status).toBe("FAIL");
    expect(item?.owner).toBe("founder");
  });

  it("verification queue CRITICAL SLA links to /admin/outcome-verification", () => {
    const result = buildRetainerReadinessRemediation(
      baseInput({
        verificationQueuePosture: {
          reviewSlaBand: "CRITICAL",
          pendingCount: 3,
          criticalPendingCount: 3,
          overdueReviewCount: 1,
          oldestPendingAge: 14,
        },
      }),
    );
    const item = result.find((r) => r.dimension === "Outcome verification SLA");
    expect(item?.status).toBe("FAIL");
    expect(item?.severity).toBe("CRITICAL");
    expect(item?.actionHref).toBe("/admin/outcome-verification");
  });
});
