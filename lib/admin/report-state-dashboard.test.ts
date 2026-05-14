/**
 * lib/admin/report-state-dashboard.test.ts
 *
 * Tests for the unified report state dashboard.
 * Verifies independent section failure, metric accuracy, and no raw data exposure.
 */

import { describe, expect, it } from "vitest";
import { buildReportStateDashboard } from "@/lib/admin/report-state-dashboard";
import type { DeliveryRecord } from "@/lib/product/delivery-audit-contract";

const now = new Date().toISOString();

function delivery(overrides: Partial<DeliveryRecord>): DeliveryRecord {
  return {
    id: "delivery_1",
    artifactType: "OVERSIGHT_BRIEF",
    artifactId: "artifact_1",
    recipientEmail: "client@example.com",
    recipientRole: "CLIENT",
    approvedBy: null,
    deliveredBy: null,
    deliveredAt: null,
    deliveryMethod: "EMAIL",
    status: "QUEUED",
    suppressionSummary: "No suppressed content exposed.",
    clientSafe: true,
    createdAt: now,
    ...overrides,
  };
}

describe("report state dashboard", () => {
  it("returns all four sections", async () => {
    const dashboard = await buildReportStateDashboard({
      loadDeliveries: async () => [],
      loadPdfStatus: async () => ({ total: 10, existing: 10, missing: 0 }),
      loadExecutiveReportCount: async () => 5,
      loadOversightBriefCount: async () => 3,
    });

    expect(dashboard.sections).toHaveLength(4);
    expect(dashboard.sections.map((s) => s.id)).toEqual([
      "report-production",
      "delivery-state",
      "pdf-export-state",
      "executive-reports",
    ]);
  });

  it("counts delivery states correctly", async () => {
    const dashboard = await buildReportStateDashboard({
      loadDeliveries: async () => [
        delivery({ status: "QUEUED", clientSafe: true }),
        delivery({ status: "TRANSPORT_PENDING", clientSafe: true }),
        delivery({ status: "DELIVERED" }),
        delivery({ status: "FAILED" }),
        delivery({ status: "QUEUED", clientSafe: false }),
      ],
      loadPdfStatus: async () => ({ total: 5, existing: 4, missing: 1 }),
      loadExecutiveReportCount: async () => 3,
      loadOversightBriefCount: async () => 2,
    });

    const deliverySection = dashboard.sections.find((s) => s.id === "delivery-state")!;
    expect(deliverySection.status).toBe("available");

    const pendingMetric = deliverySection.metrics.find((m) => m.label === "Pending approval/send")!;
    expect(pendingMetric.value).toBe(3);

    const sentMetric = deliverySection.metrics.find((m) => m.label === "Sent")!;
    expect(sentMetric.value).toBe(1);

    const failedMetric = deliverySection.metrics.find((m) => m.label === "Failed")!;
    expect(failedMetric.value).toBe(1);

    const suppressedMetric = deliverySection.metrics.find((m) => m.label === "Suppressed")!;
    expect(suppressedMetric.value).toBe(1);

    const safeMetric = deliverySection.metrics.find((m) => m.label === "Safe to approve")!;
    expect(safeMetric.value).toBe(2);
  });

  it("marks delivery section unavailable when loader throws", async () => {
    const dashboard = await buildReportStateDashboard({
      loadDeliveries: async () => {
        throw new Error("delivery source unavailable");
      },
      loadPdfStatus: async () => ({ total: 5, existing: 5, missing: 0 }),
      loadExecutiveReportCount: async () => 2,
      loadOversightBriefCount: async () => 1,
    });

    const deliverySection = dashboard.sections.find((s) => s.id === "delivery-state")!;
    expect(deliverySection.status).toBe("unavailable");
    expect(deliverySection.metrics.every((m) => m.value === null)).toBe(true);
  });

  it("marks PDF section unavailable when loader throws", async () => {
    const dashboard = await buildReportStateDashboard({
      loadDeliveries: async () => [],
      loadPdfStatus: async () => {
        throw new Error("pdf source unavailable");
      },
      loadExecutiveReportCount: async () => 2,
      loadOversightBriefCount: async () => 1,
    });

    const pdfSection = dashboard.sections.find((s) => s.id === "pdf-export-state")!;
    expect(pdfSection.status).toBe("unavailable");
    expect(pdfSection.metrics.every((m) => m.value === null)).toBe(true);
  });

  it("marks production section unavailable when both report loaders throw", async () => {
    const dashboard = await buildReportStateDashboard({
      loadDeliveries: async () => [],
      loadPdfStatus: async () => ({ total: 0, existing: 0, missing: 0 }),
      loadExecutiveReportCount: async () => {
        throw new Error("executive source unavailable");
      },
      loadOversightBriefCount: async () => {
        throw new Error("oversight source unavailable");
      },
    });

    const productionSection = dashboard.sections.find((s) => s.id === "report-production")!;
    expect(productionSection.status).toBe("unavailable");
    expect(productionSection.metrics.every((m) => m.value === null)).toBe(true);
  });

  it("does not expose raw delivery records in the contract", async () => {
    const dashboard = await buildReportStateDashboard({
      loadDeliveries: async () => [
        delivery({ recipientEmail: "client@example.com", status: "QUEUED" }),
      ],
      loadPdfStatus: async () => ({ total: 1, existing: 1, missing: 0 }),
      loadExecutiveReportCount: async () => 1,
      loadOversightBriefCount: async () => 0,
    });

    const serialized = JSON.stringify(dashboard);
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("recipientEmail");
  });

  it("generates a timestamp", async () => {
    const dashboard = await buildReportStateDashboard({
      loadDeliveries: async () => [],
      loadPdfStatus: async () => ({ total: 0, existing: 0, missing: 0 }),
      loadExecutiveReportCount: async () => 0,
      loadOversightBriefCount: async () => 0,
    });

    expect(dashboard.generatedAt).toBeTruthy();
    expect(() => new Date(dashboard.generatedAt)).not.toThrow();
  });

  it("each section has at least one action", async () => {
    const dashboard = await buildReportStateDashboard({
      loadDeliveries: async () => [],
      loadPdfStatus: async () => ({ total: 0, existing: 0, missing: 0 }),
      loadExecutiveReportCount: async () => 0,
      loadOversightBriefCount: async () => 0,
    });

    for (const section of dashboard.sections) {
      expect(section.actions.length).toBeGreaterThan(0);
    }
  });
});
