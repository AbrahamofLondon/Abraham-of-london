/**
 * tests/analytics/launch-event-api.test.ts
 *
 * Regression tests for the /api/analytics/launch-event receiver.
 *
 * Proves:
 *   - All conversion/revenue events are accepted.
 *   - Unknown event names are rejected.
 *   - Extra unexpected fields are rejected.
 *   - Blocked raw-text fields are rejected.
 *   - Safe metadata (productCode, route, surface, timestamp) is accepted.
 *   - No raw user content is required.
 *
 * Mocks Prisma — never hits a real database.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

// ── Hoisted mocks (must be before any vi.mock) ───────────────────────────────

const { mockDiagnosticRecordCreate, mockResolveIdentity } = vi.hoisted(() => ({
  mockDiagnosticRecordCreate: vi.fn(),
  mockResolveIdentity: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    diagnosticRecord: {
      create: mockDiagnosticRecordCreate,
    },
  },
}));

vi.mock("@/lib/auth/resolve-identity", () => ({
  resolveIdentity: mockResolveIdentity,
}));

// ── Import handler after mocks ───────────────────────────────────────────────

import handler from "@/pages/api/analytics/launch-event";

// ── Helpers ──────────────────────────────────────────────────────────────────

function createReq(body: unknown): NextApiRequest {
  return { method: "POST", body } as unknown as NextApiRequest;
}

function createRes(): { res: NextApiResponse; status: vi.Mock; json: vi.Mock } {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { res: { status, json } as unknown as NextApiResponse, status, json };
}

const MINIMAL_VALID_PAYLOAD = {
  eventName: "decision_pressure_to_boardroom",
  surface: "/decision-pressure",
  timestamp: new Date().toISOString(),
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("launch-event API receiver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveIdentity.mockResolvedValue(null);
    mockDiagnosticRecordCreate.mockResolvedValue({});
  });

  // ── 1–7: Accepts all conversion/revenue events ──────────────────────────

  const CONVERSION_EVENTS = [
    "decision_pressure_to_boardroom",
    "products_to_boardroom",
    "boardroom_to_checkout",
    "checkout_session_created",
    "boardroom_checkout_completed",
    "gmi_full_report_purchase_completed",
    "enterprise_scan_completed",
  ] as const;

  for (const eventName of CONVERSION_EVENTS) {
    it(`accepts ${eventName}`, async () => {
      const { res, status, json } = createRes();
      await handler(
        createReq({ ...MINIMAL_VALID_PAYLOAD, eventName }),
        res,
      );

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ ok: true });
      expect(mockDiagnosticRecordCreate).toHaveBeenCalledTimes(1);
    });
  }

  // ── 8. Rejects unknown eventName ────────────────────────────────────────

  it("rejects unknown eventName", async () => {
    const { res, status, json } = createRes();
    await handler(
      createReq({
        ...MINIMAL_VALID_PAYLOAD,
        eventName: "nonexistent_event_12345",
      }),
      res,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Invalid payload" }),
    );
    expect(mockDiagnosticRecordCreate).not.toHaveBeenCalled();
  });

  // ── 9. Rejects extra unexpected field ───────────────────────────────────

  it("rejects extra unexpected field", async () => {
    const { res, status, json } = createRes();
    await handler(
      createReq({
        ...MINIMAL_VALID_PAYLOAD,
        extraField: "should not be here",
      }),
      res,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Invalid payload" }),
    );
    expect(mockDiagnosticRecordCreate).not.toHaveBeenCalled();
  });

  // ── 10. Rejects blocked raw-text fields ─────────────────────────────────

  const BLOCKED_FIELD_CASES = ["decisionText", "rawText", "userInput"] as const;

  for (const field of BLOCKED_FIELD_CASES) {
    it(`rejects blocked field: ${field}`, async () => {
      const { res, status, json } = createRes();
      await handler(
        createReq({
          ...MINIMAL_VALID_PAYLOAD,
          [field]: "some raw user input",
        }),
        res,
      );

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ error: `Blocked field: ${field}` }),
      );
      expect(mockDiagnosticRecordCreate).not.toHaveBeenCalled();
    });
  }

  // ── 11. Accepts safe metadata ───────────────────────────────────────────

  it("accepts safe metadata: productCode, route, surface, timestamp", async () => {
    const { res, status, json } = createRes();
    await handler(
      createReq({
        eventName: "boardroom_checkout_completed",
        surface: "/api/billing/webhook",
        productCode: "boardroom-brief",
        route: "/boardroom-brief",
        timestamp: new Date().toISOString(),
      }),
      res,
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ ok: true });
    expect(mockDiagnosticRecordCreate).toHaveBeenCalledTimes(1);

    // Verify the stored payload contains the safe metadata
    const createCall = mockDiagnosticRecordCreate.mock.calls[0][0];
    const stored = JSON.parse(createCall.data.responsesJson);
    expect(stored.productCode).toBe("boardroom-brief");
    expect(stored.route).toBe("/boardroom-brief");
    expect(stored.surface).toBe("/api/billing/webhook");
    expect(stored.timestamp).toBeTruthy();
  });

  // ── 12. Does not require raw user content ───────────────────────────────

  it("succeeds with only eventName, surface, and timestamp", async () => {
    const { res, status, json } = createRes();
    await handler(
      createReq({
        eventName: "enterprise_scan_completed",
        surface: "/enterprise-decision-scan",
        timestamp: new Date().toISOString(),
      }),
      res,
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ ok: true });
    expect(mockDiagnosticRecordCreate).toHaveBeenCalledTimes(1);
  });

  // ── Additional safety checks ────────────────────────────────────────────

  it("rejects GET requests", async () => {
    const { res, status, json } = createRes();
    await handler(
      { method: "GET", body: {} } as unknown as NextApiRequest,
      res,
    );

    expect(status).toHaveBeenCalledWith(405);
  });

  it("does not persist when Prisma create throws (best-effort)", async () => {
    mockDiagnosticRecordCreate.mockRejectedValue(new Error("DB down"));

    const { res, status, json } = createRes();
    await handler(createReq(MINIMAL_VALID_PAYLOAD), res);

    // Should still return 200 — instrumentation is best-effort
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ ok: true });
  });

  it("persisted record contains diagnosticType=launch_event and verdict=eventName", async () => {
    const { res } = createRes();
    await handler(
      createReq({
        eventName: "products_to_boardroom",
        surface: "/products",
        timestamp: new Date().toISOString(),
      }),
      res,
    );

    expect(mockDiagnosticRecordCreate).toHaveBeenCalledTimes(1);
    const createCall = mockDiagnosticRecordCreate.mock.calls[0][0];
    expect(createCall.data.diagnosticType).toBe("launch_event");
    expect(createCall.data.verdict).toBe("products_to_boardroom");
  });
});
