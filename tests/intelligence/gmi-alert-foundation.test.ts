/**
 * P10 — Alert Foundation Tests
 * dashboard_only delivery is active. Email/webhook delivery is disabled.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    gmiAlertRule: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  createAlertRule,
  EMAIL_DELIVERY_ENABLED,
  getAlertRulesByEdition,
  WEBHOOK_DELIVERY_ENABLED,
} from "@/lib/intelligence/gmi-alert-rule-service";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("delivery flags", () => {
  it("EMAIL_DELIVERY_ENABLED is false", () => {
    expect(EMAIL_DELIVERY_ENABLED).toBe(false);
  });

  it("WEBHOOK_DELIVERY_ENABLED is false", () => {
    expect(WEBHOOK_DELIVERY_ENABLED).toBe(false);
  });
});

describe("createAlertRule", () => {
  it("creates a rule with dashboard_only delivery", async () => {
    const mockRule = {
      id: "rule_001",
      editionId: "GMI-Q2-2026",
      linkedCallId: null,
      linkedFalsificationRuleId: null,
      alertType: "threshold_breach",
      triggerCondition: "score drops below 2",
      severity: "medium",
      status: "draft",
      deliveryMode: "dashboard_only",
      lastEvaluatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.gmiAlertRule.create).mockResolvedValueOnce(mockRule as any);

    const result = await createAlertRule({
      editionId: "GMI-Q2-2026",
      alertType: "threshold_breach",
      triggerCondition: "score drops below 2",
      deliveryMode: "dashboard_only",
    });

    expect(result.deliveryMode).toBe("dashboard_only");
    expect(result.status).toBe("draft");
  });

  it("status defaults to draft", async () => {
    const mockRule = {
      id: "rule_002",
      editionId: "GMI-Q2-2026",
      linkedCallId: null,
      linkedFalsificationRuleId: null,
      alertType: "falsification_triggered",
      triggerCondition: "falsification condition met",
      severity: "high",
      status: "draft",
      deliveryMode: "dashboard_only",
      lastEvaluatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.gmiAlertRule.create).mockResolvedValueOnce(mockRule as any);

    const result = await createAlertRule({
      editionId: "GMI-Q2-2026",
      alertType: "falsification_triggered",
      triggerCondition: "falsification condition met",
      severity: "high",
    });

    expect(result.status).toBe("draft");
  });

  it("email_future rule can be stored but EMAIL_DELIVERY_ENABLED remains false", async () => {
    const mockRule = {
      id: "rule_003",
      editionId: "GMI-Q2-2026",
      linkedCallId: null,
      linkedFalsificationRuleId: null,
      alertType: "weekly_digest",
      triggerCondition: "every Monday",
      severity: "low",
      status: "draft",
      deliveryMode: "email_future",
      lastEvaluatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.gmiAlertRule.create).mockResolvedValueOnce(mockRule as any);

    // Rule can be stored — delivery is just not wired yet
    const result = await createAlertRule({
      editionId: "GMI-Q2-2026",
      alertType: "weekly_digest",
      triggerCondition: "every Monday",
      deliveryMode: "email_future",
    });

    expect(result.deliveryMode).toBe("email_future");
    // But the global flag is still false — no emails will actually send
    expect(EMAIL_DELIVERY_ENABLED).toBe(false);
  });

  it("alert rule can link to a specific call", async () => {
    const mockRule = {
      id: "rule_004",
      editionId: "GMI-Q2-2026",
      linkedCallId: "call_abc",
      linkedFalsificationRuleId: null,
      alertType: "call_status_change",
      triggerCondition: "call status changes to DISCONFIRMED",
      severity: "high",
      status: "active",
      deliveryMode: "dashboard_only",
      lastEvaluatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.gmiAlertRule.create).mockResolvedValueOnce(mockRule as any);

    const result = await createAlertRule({
      editionId: "GMI-Q2-2026",
      linkedCallId: "call_abc",
      alertType: "call_status_change",
      triggerCondition: "call status changes to DISCONFIRMED",
      severity: "high",
      status: "active",
    });

    expect(result.linkedCallId).toBe("call_abc");
  });
});

describe("getAlertRulesByEdition", () => {
  it("returns array of alert rules", async () => {
    const mockRules = [
      { id: "rule_001", editionId: "GMI-Q2-2026", deliveryMode: "dashboard_only" },
      { id: "rule_002", editionId: "GMI-Q2-2026", deliveryMode: "dashboard_only" },
    ];
    vi.mocked(prisma.gmiAlertRule.findMany).mockResolvedValueOnce(mockRules as any);

    const result = await getAlertRulesByEdition("GMI-Q2-2026");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  it("returns empty array when no rules exist", async () => {
    vi.mocked(prisma.gmiAlertRule.findMany).mockResolvedValueOnce([]);
    const result = await getAlertRulesByEdition("GMI-Q3-2026");
    expect(result).toEqual([]);
  });
});
