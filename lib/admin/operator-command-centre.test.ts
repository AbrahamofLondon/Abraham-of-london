import { describe, expect, it } from "vitest";

import { buildOperatorCommandCentreSummary, groupOperatorQueueCards } from "@/lib/admin/operator-command-centre";
import type { DeliveryRecord } from "@/lib/product/delivery-audit-contract";
import type { ReviewQueuePosture } from "@/lib/product/operator-outcome-review";
import type { SuppressionEvent } from "@/lib/product/suppression-ledger-contract";

const now = new Date();
const dueSoon = new Date(now);
dueSoon.setDate(dueSoon.getDate() + 3);

function cadenceQueue(overrides?: Partial<any>) {
  const due = [{
    cycleId: "cycle_due",
    accountId: "acct_1",
    organisationId: "org_1",
    organisationLabel: "Northwind",
    scheduledFor: dueSoon.toISOString(),
    completedAt: null,
    cadenceState: "DUE_SOON",
    cadenceSource: "scheduled",
    skippedReason: null,
    escalationReason: null,
    evidencePosture: "SYSTEM_INFERRED",
    sourceLabel: "Retained Oversight Cadence",
  }];
  const overdue = [{
    ...due[0],
    cycleId: "cycle_overdue",
    scheduledFor: null,
    cadenceState: "OVERDUE",
  }];

  return {
    due,
    inProgress: [],
    overdue,
    skipped: [],
    escalated: [],
    cadenceBroken: [],
    notConfigured: [],
    all: [...due, ...overdue],
    ...overrides,
  } as any;
}

function delivery(status: DeliveryRecord["status"], clientSafe = true): DeliveryRecord {
  return {
    id: `delivery_${status}_${clientSafe}`,
    artifactType: "OVERSIGHT_BRIEF",
    artifactId: "artifact_1",
    recipientEmail: "client@example.com",
    recipientRole: "CLIENT",
    approvedBy: null,
    deliveredBy: null,
    deliveredAt: null,
    deliveryMethod: "EMAIL",
    status,
    suppressionSummary: "No suppressed content exposed.",
    clientSafe,
    createdAt: now.toISOString(),
  };
}

function suppression(overrides?: Partial<SuppressionEvent>): SuppressionEvent {
  return {
    eventId: "sup_1",
    scopeId: "scope_1",
    scopeType: "ACCOUNT",
    surface: "oversight",
    fieldName: "respondentText",
    evidenceSource: "diagnostic",
    originalPosture: "USER_REPORTED",
    suppressionReason: "privacy risk",
    suppressionRule: "privacy",
    operatorReviewAvailable: true,
    suppressedAt: now.toISOString(),
    suppressedBySystem: true,
    reviewedByOperator: null,
    reviewedAt: null,
    overrideStatus: "NONE",
    overrideReason: null,
    ...overrides,
  };
}

const outcomePosture: ReviewQueuePosture = {
  pendingCount: 4,
  oldestPendingAge: 16,
  criticalPendingCount: 1,
  overdueReviewCount: 2,
  reviewSlaBand: "RED",
};

describe("operator command centre summary", () => {
  it("summarises real queue values from injected loaders", async () => {
    const summary = await buildOperatorCommandCentreSummary({
      loadCadenceQueue: async () => cadenceQueue(),
      loadDeliveries: async () => [
        delivery("QUEUED", true),
        delivery("TRANSPORT_PENDING", true),
        delivery("FAILED", true),
      ],
      loadSuppressions: async () => [suppression()],
      loadOutcomePosture: async () => outcomePosture,
    });

    expect(summary.cards.find((card) => card.id === "retained-cadence")?.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Due this week", value: 1 }),
        expect.objectContaining({ label: "Overdue", value: 1 }),
      ]),
    );
    expect(summary.cards.find((card) => card.id === "delivery-queue")?.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Pending approval/send", value: 2 }),
        expect.objectContaining({ label: "Failed", value: 1 }),
        expect.objectContaining({ label: "Safe to approve", value: 2 }),
      ]),
    );
    expect(summary.headlines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Overdue", value: 3 }),
        expect.objectContaining({ label: "Blocked", value: 2 }),
      ]),
    );
    expect(summary.actionGroups.find((group) => group.id === "do-first")?.cards.map((card) => card.id)).toEqual(
      expect.arrayContaining(["retained-cadence", "delivery-queue", "outcome-verification"]),
    );
  });

  it("marks failed queue loaders unavailable instead of returning fake zeroes", async () => {
    const summary = await buildOperatorCommandCentreSummary({
      loadCadenceQueue: async () => cadenceQueue({ overdue: [], all: [] }),
      loadDeliveries: async () => {
        throw new Error("delivery source unavailable");
      },
      loadSuppressions: async () => [],
      loadOutcomePosture: async () => ({
        pendingCount: 0,
        oldestPendingAge: 0,
        criticalPendingCount: 0,
        overdueReviewCount: 0,
        reviewSlaBand: "GREEN",
      }),
    });

    const deliveryCard = summary.cards.find((card) => card.id === "delivery-queue");

    expect(deliveryCard?.status).toBe("unavailable");
    expect(deliveryCard?.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Pending approval/send", value: null, detail: "Unavailable" }),
      ]),
    );
    expect(summary.cards.find((card) => card.id === "outcome-verification")?.status).toBe("available");
    expect(summary.actionGroups.find((group) => group.id === "unavailable")?.cards.map((card) => card.id)).toContain("delivery-queue");
  });

  it("does not expose raw queue records in the page summary contract", async () => {
    const summary = await buildOperatorCommandCentreSummary({
      loadCadenceQueue: async () => cadenceQueue(),
      loadDeliveries: async () => [delivery("QUEUED", true)],
      loadSuppressions: async () => [suppression()],
      loadOutcomePosture: async () => outcomePosture,
    });

    expect(JSON.stringify(summary)).not.toContain("client@example.com");
    expect(JSON.stringify(summary)).not.toContain("respondentText");
    expect(JSON.stringify(summary)).not.toContain("responsesJson");
  });

  it("groups queues into do first, watch, healthy, and unavailable without inventing state", () => {
    const cards: Parameters<typeof groupOperatorQueueCards>[0] = [
      {
        id: "retained-cadence",
        title: "Retained cadence",
        href: "/admin/retained-cadence",
        description: "Cadence",
        status: "available",
        metrics: [],
        priority: "risk",
      },
      {
        id: "delivery-queue",
        title: "Delivery queue",
        href: "/admin/delivery-queue",
        description: "Delivery",
        status: "available",
        metrics: [],
        priority: "attention",
      },
      {
        id: "retainer-readiness",
        title: "Retainer readiness",
        href: "/admin/retainer-readiness",
        description: "Readiness",
        status: "available",
        metrics: [],
        priority: "normal",
      },
      {
        id: "outcome-verification",
        title: "Outcome verification",
        href: "/admin/outcome-verification",
        description: "Outcome",
        status: "unavailable",
        metrics: [],
        priority: "normal",
      },
    ];
    const groups = groupOperatorQueueCards(cards);

    expect(groups.map((group) => group.id)).toEqual(["do-first", "watch", "healthy", "unavailable"]);
    expect(groups.find((group) => group.id === "do-first")?.cards.map((card) => card.id)).toEqual(["retained-cadence"]);
    expect(groups.find((group) => group.id === "watch")?.cards.map((card) => card.id)).toEqual(["delivery-queue"]);
    expect(groups.find((group) => group.id === "healthy")?.cards.map((card) => card.id)).toEqual(["retainer-readiness"]);
    expect(groups.find((group) => group.id === "unavailable")?.cards.map((card) => card.id)).toEqual(["outcome-verification"]);
  });
});
