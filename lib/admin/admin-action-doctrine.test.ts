import { describe, it, expect } from "vitest";
import {
  extractDoctrineSignals,
  buildDoctrineRecommendations,
  buildOperatorDoctrine,
} from "./admin-action-doctrine";
import type { OperatorQueueCard, OperatorMetric } from "@/lib/admin/operator-command-centre";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function metric(label: string, value: number | null, tone: OperatorMetric["tone"] = "neutral"): OperatorMetric {
  return { label, value, tone };
}

function cadenceCard(overrides: Partial<OperatorQueueCard> = {}): OperatorQueueCard {
  return {
    id: "retained-cadence",
    title: "Retained cadence",
    href: "/admin/retained-cadence",
    description: "",
    status: "available",
    priority: "normal",
    metrics: [
      metric("Due this week", 0, "good"),
      metric("Overdue", 0, "good"),
      metric("Next due", null),
    ],
    ...overrides,
  };
}

function deliveryCard(overrides: Partial<OperatorQueueCard> = {}): OperatorQueueCard {
  return {
    id: "delivery-queue",
    title: "Delivery queue",
    href: "/admin/delivery-queue",
    description: "",
    status: "available",
    priority: "normal",
    metrics: [
      metric("Pending approval/send", 0, "good"),
      metric("Failed", 0, "good"),
      metric("Safe to approve", 0, "good"),
    ],
    ...overrides,
  };
}

function suppressionCard(overrides: Partial<OperatorQueueCard> = {}): OperatorQueueCard {
  return {
    id: "suppression-ledger",
    title: "Suppression ledger",
    href: "/admin/suppression-ledger",
    description: "",
    status: "available",
    priority: "normal",
    metrics: [
      metric("Unresolved", 0, "good"),
      metric("High-risk", 0, "good"),
    ],
    ...overrides,
  };
}

function outcomeCard(overrides: Partial<OperatorQueueCard> = {}): OperatorQueueCard {
  return {
    id: "outcome-verification",
    title: "Outcome verification",
    href: "/admin/outcome-verification",
    description: "",
    status: "available",
    priority: "normal",
    metrics: [
      metric("Pending", 0, "good"),
      metric("Overdue", 0, "good"),
      metric("Critical", 0, "neutral"),
    ],
    ...overrides,
  };
}

function oversightCard(overrides: Partial<OperatorQueueCard> = {}): OperatorQueueCard {
  return {
    id: "oversight-reviews",
    title: "Oversight reviews",
    href: "/admin/oversight-review",
    description: "",
    status: "available",
    priority: "normal",
    metrics: [
      metric("Pending", null),
      metric("Suppressed", 0, "neutral"),
    ],
    ...overrides,
  };
}

function readinessCard(overrides: Partial<OperatorQueueCard> = {}): OperatorQueueCard {
  return {
    id: "retainer-readiness",
    title: "Retainer readiness",
    href: "/admin/retainer-readiness",
    description: "",
    status: "available",
    priority: "normal",
    metrics: [
      metric("Accounts not ready", 0, "good"),
      metric("Readiness warnings", 0, "good"),
    ],
    ...overrides,
  };
}

function allHealthyCards(): OperatorQueueCard[] {
  return [cadenceCard(), deliveryCard(), suppressionCard(), outcomeCard(), oversightCard(), readinessCard()];
}

// ─── extractDoctrineSignals ───────────────────────────────────────────────────

describe("extractDoctrineSignals — empty / healthy", () => {
  it("no signals for all-healthy cards", () => {
    const signals = extractDoctrineSignals(allHealthyCards());
    expect(signals).toHaveLength(0);
  });

  it("returns empty array for empty card list", () => {
    expect(extractDoctrineSignals([])).toHaveLength(0);
  });
});

describe("extractDoctrineSignals — cadence", () => {
  it("overdue cadence emits CRITICAL OVERDUE signal", () => {
    const cards = [cadenceCard({ metrics: [metric("Overdue", 3, "risk"), metric("Due this week", 0, "good"), metric("Next due", null)] })];
    const signals = extractDoctrineSignals(cards);
    const sig = signals.find((s) => s.source === "CADENCE" && s.status === "OVERDUE");
    expect(sig).toBeDefined();
    expect(sig?.severity).toBe("CRITICAL");
  });

  it("due this week emits HIGH signal", () => {
    const cards = [cadenceCard({ metrics: [metric("Overdue", 0, "good"), metric("Due this week", 2, "attention"), metric("Next due", null)] })];
    const signals = extractDoctrineSignals(cards);
    const sig = signals.find((s) => s.source === "CADENCE" && s.status === "DUE_THIS_WEEK");
    expect(sig).toBeDefined();
    expect(sig?.severity).toBe("HIGH");
  });

  it("overdue=0 and due=0 emits no cadence signals", () => {
    const signals = extractDoctrineSignals([cadenceCard()]);
    expect(signals.filter((s) => s.source === "CADENCE")).toHaveLength(0);
  });
});

describe("extractDoctrineSignals — delivery", () => {
  it("failed delivery emits HIGH FAILED signal", () => {
    const cards = [deliveryCard({ metrics: [metric("Failed", 2, "risk"), metric("Pending approval/send", 0), metric("Safe to approve", 0)] })];
    const sigs = extractDoctrineSignals(cards);
    const sig = sigs.find((s) => s.source === "DELIVERY" && s.status === "FAILED");
    expect(sig).toBeDefined();
    expect(sig?.severity).toBe("HIGH");
  });

  it("safe to approve emits MEDIUM READY_TO_APPROVE signal", () => {
    const cards = [deliveryCard({ metrics: [metric("Failed", 0), metric("Pending approval/send", 3), metric("Safe to approve", 2)] })];
    const sigs = extractDoctrineSignals(cards);
    expect(sigs.find((s) => s.status === "READY_TO_APPROVE")).toBeDefined();
  });
});

describe("extractDoctrineSignals — suppression", () => {
  it("high-risk suppression emits HIGH signal", () => {
    const cards = [suppressionCard({ metrics: [metric("Unresolved", 5), metric("High-risk", 2, "risk")] })];
    const sigs = extractDoctrineSignals(cards);
    const sig = sigs.find((s) => s.source === "SUPPRESSION" && s.status === "HIGH_RISK_UNRESOLVED");
    expect(sig?.severity).toBe("HIGH");
  });

  it("unresolved (no high-risk) emits MEDIUM signal", () => {
    const cards = [suppressionCard({ metrics: [metric("Unresolved", 3), metric("High-risk", 0)] })];
    const sigs = extractDoctrineSignals(cards);
    expect(sigs.find((s) => s.status === "UNRESOLVED")?.severity).toBe("MEDIUM");
  });
});

describe("extractDoctrineSignals — unavailable cards", () => {
  it("unavailable card emits MEDIUM UNAVAILABLE signal", () => {
    const cards = [cadenceCard({ status: "unavailable" })];
    const sigs = extractDoctrineSignals(cards);
    expect(sigs[0]?.status).toBe("UNAVAILABLE");
    expect(sigs[0]?.severity).toBe("MEDIUM");
  });

  it("unavailable card does NOT produce false OVERDUE signal", () => {
    const cards = [cadenceCard({ status: "unavailable" })];
    const sigs = extractDoctrineSignals(cards);
    expect(sigs.some((s) => s.status === "OVERDUE")).toBe(false);
  });
});

// ─── buildDoctrineRecommendations ────────────────────────────────────────────

describe("buildDoctrineRecommendations — empty", () => {
  it("no signals → no recommendations", () => {
    expect(buildDoctrineRecommendations([])).toHaveLength(0);
  });
});

describe("buildDoctrineRecommendations — priority ordering", () => {
  it("CRITICAL sorts before HIGH before MEDIUM before LOW", () => {
    const recs = buildOperatorDoctrine([
      cadenceCard({ metrics: [metric("Overdue", 2, "risk"), metric("Due this week", 0), metric("Next due", null)] }),
      deliveryCard({ metrics: [metric("Failed", 1, "risk"), metric("Pending approval/send", 0), metric("Safe to approve", 0)] }),
      suppressionCard({ metrics: [metric("Unresolved", 3), metric("High-risk", 0)] }),
    ]);
    const priorities = recs.map((r) => r.priority);
    for (let i = 1; i < priorities.length; i++) {
      const orderMap = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      expect(orderMap[priorities[i - 1]!]).toBeLessThanOrEqual(orderMap[priorities[i]!]);
    }
  });

  it("overdue cadence outranks healthy report state", () => {
    const recs = buildOperatorDoctrine([
      cadenceCard({ metrics: [metric("Overdue", 1, "risk"), metric("Due this week", 0), metric("Next due", null)] }),
      deliveryCard(), // healthy
    ]);
    const first = recs[0];
    expect(first?.id).toBe("cadence-overdue");
    expect(first?.priority).toBe("CRITICAL");
  });
});

describe("buildDoctrineRecommendations — specific rules", () => {
  it("failed delivery generates delivery recommendation", () => {
    const recs = buildOperatorDoctrine([
      deliveryCard({ metrics: [metric("Failed", 2, "risk"), metric("Pending approval/send", 0), metric("Safe to approve", 0)] }),
    ]);
    expect(recs.find((r) => r.id === "delivery-failed")).toBeDefined();
  });

  it("unresolved high-risk suppression generates suppression recommendation", () => {
    const recs = buildOperatorDoctrine([
      suppressionCard({ metrics: [metric("Unresolved", 3), metric("High-risk", 2, "risk")] }),
    ]);
    expect(recs.find((r) => r.id === "suppression-high-risk")).toBeDefined();
  });

  it("suppression blocker appears on delivery recommendation when both are present", () => {
    const recs = buildOperatorDoctrine([
      deliveryCard({ metrics: [metric("Failed", 1, "risk"), metric("Pending approval/send", 0), metric("Safe to approve", 0)] }),
      suppressionCard({ metrics: [metric("Unresolved", 3), metric("High-risk", 2, "risk")] }),
    ]);
    const deliveryRec = recs.find((r) => r.id === "delivery-failed");
    expect(deliveryRec?.blockers?.length).toBeGreaterThan(0);
  });

  it("unavailable evidence produces cautious LOW recommendation, not fake pass", () => {
    const recs = buildOperatorDoctrine([
      cadenceCard({ status: "unavailable" }),
    ]);
    const unavailableRec = recs.find((r) => r.id === "data-unavailable");
    expect(unavailableRec).toBeDefined();
    expect(unavailableRec?.priority).toBe("LOW");
    expect(unavailableRec?.evidence.length).toBeGreaterThan(0);
    // Must NOT produce a false "all clear"
    expect(recs.find((r) => r.id === "cadence-overdue")).toBeUndefined();
  });

  it("due-this-week recommendation only fires when not also overdue", () => {
    // Both overdue and due-this-week → only cadence-overdue fires
    const recs = buildOperatorDoctrine([
      cadenceCard({ metrics: [metric("Overdue", 1, "risk"), metric("Due this week", 2), metric("Next due", null)] }),
    ]);
    expect(recs.find((r) => r.id === "cadence-due-this-week")).toBeUndefined();
    expect(recs.find((r) => r.id === "cadence-overdue")).toBeDefined();
  });

  it("delivery ready-to-approve blocked when cadence is overdue", () => {
    const recs = buildOperatorDoctrine([
      cadenceCard({ metrics: [metric("Overdue", 1, "risk"), metric("Due this week", 0), metric("Next due", null)] }),
      deliveryCard({ metrics: [metric("Failed", 0), metric("Pending approval/send", 3), metric("Safe to approve", 2)] }),
    ]);
    // Ready-to-approve rule requires no cadence overdue
    expect(recs.find((r) => r.id === "delivery-ready-to-approve")).toBeUndefined();
    // But cadence recommendation should exist
    expect(recs.find((r) => r.id === "cadence-overdue")).toBeDefined();
  });
});

describe("buildDoctrineRecommendations — all healthy", () => {
  it("all healthy cards produce no recommendations", () => {
    const recs = buildOperatorDoctrine(allHealthyCards());
    expect(recs).toHaveLength(0);
  });
});

describe("buildDoctrineRecommendations — recommendation shape", () => {
  it("each recommendation has required fields", () => {
    const recs = buildOperatorDoctrine([
      cadenceCard({ metrics: [metric("Overdue", 1, "risk"), metric("Due this week", 0), metric("Next due", null)] }),
    ]);
    for (const rec of recs) {
      expect(rec.id).toBeTruthy();
      expect(rec.priority).toMatch(/^(LOW|MEDIUM|HIGH|CRITICAL)$/);
      expect(rec.title).toBeTruthy();
      expect(rec.rationale).toBeTruthy();
      expect(rec.recommendedAction).toBeTruthy();
      expect(Array.isArray(rec.evidence)).toBe(true);
    }
  });
});
