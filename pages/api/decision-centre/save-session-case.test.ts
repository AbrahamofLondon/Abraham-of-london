import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

vi.mock("@/lib/auth/resolve-identity", () => ({
  resolveIdentity: vi.fn(),
}));

vi.mock("@/lib/diagnostics/journey-store", () => ({
  persistDiagnosticStage: vi.fn(),
}));

vi.mock("@/lib/diagnostics/evidence-graph", () => ({
  extractCanonicalDecisionObject: vi.fn(() => ({
    sourceStage: "purpose_alignment",
    decisionKey: "decision_1",
    decisionText: "Whether to proceed",
    confidence: 0.5,
    normalized: {
      avoidedOrFaced: true,
      hasConstraint: false,
      hasPriorAttempt: false,
      hasDelayCost: false,
      hasStakeholder: false,
      hasCompetingObligation: false,
      hasInstitutionalConsequence: false,
      extractedAt: "2026-05-15T00:00:00.000Z",
    },
  })),
}));

import handler from "./save-session-case";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";

function createRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as NextApiResponse & { statusCode: number; body: unknown };
}

function createReq(body: unknown): NextApiRequest {
  return {
    method: "POST",
    body,
  } as NextApiRequest;
}

describe("POST /api/decision-centre/save-session-case", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests with a useful auth-required response", async () => {
    vi.mocked(resolveIdentity).mockResolvedValue({
      authenticated: false,
      subjectId: null,
      email: null,
    } as never);

    const res = createRes();
    await handler(createReq({ source: "FAST_DIAGNOSTIC" }), res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      ok: false,
      reason: "AUTH_REQUIRED",
      message: "Sign in to save this case in Decision Centre.",
    });
  });

  it("accepts authenticated client-safe payloads and returns an account case reference", async () => {
    vi.mocked(resolveIdentity).mockResolvedValue({
      authenticated: true,
      subjectId: "user_1",
      email: "user@example.com",
    } as never);
    vi.mocked(persistDiagnosticStage).mockResolvedValue({
      journeyKey: "journey_user_1",
    } as never);

    const res = createRes();
    await handler(createReq({
      source: "FAST_DIAGNOSTIC",
      caseRef: "case_fast_1",
      decisionLabel: "Whether to proceed",
      nextGovernanceMove: "Assign one owner.",
    }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, caseRef: "journey_user_1" });
    expect(persistDiagnosticStage).toHaveBeenCalledTimes(1);
  });

  it("rejects raw internal fields outside the accepted client-safe contract", async () => {
    vi.mocked(resolveIdentity).mockResolvedValue({
      authenticated: true,
      subjectId: "user_1",
      email: "user@example.com",
    } as never);

    const res = createRes();
    await handler(createReq({
      source: "FAST_DIAGNOSTIC",
      decisionLabel: "Whether to proceed",
      provenanceHash: "should-not-be-accepted",
    }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      reason: "INVALID_REQUEST",
      message: "Only client-safe session case fields may be saved.",
    });
    expect(persistDiagnosticStage).not.toHaveBeenCalled();
  });
});
