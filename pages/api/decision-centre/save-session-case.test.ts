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
  return { method: "POST", body } as NextApiRequest;
}

const AUTHED_IDENTITY = {
  authenticated: true,
  subjectId: "user_1",
  email: "user@example.com",
} as never;

const JOURNEY_RESULT = { journeyKey: "journey_user_1" } as never;

describe("POST /api/decision-centre/save-session-case", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Auth gate ───────────────────────────────────────────────────────────────

  it("returns AUTH_REQUIRED with account-creation copy for unauthenticated requests", async () => {
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
      message: "Create a free account to keep this decision live.",
    });
  });

  // ── FAST_DIAGNOSTIC ─────────────────────────────────────────────────────────

  it("persists a FAST_DIAGNOSTIC case and returns the account case reference", async () => {
    vi.mocked(resolveIdentity).mockResolvedValue(AUTHED_IDENTITY);
    vi.mocked(persistDiagnosticStage).mockResolvedValue(JOURNEY_RESULT);

    const res = createRes();
    await handler(
      createReq({
        source: "FAST_DIAGNOSTIC",
        caseRef: "case_fast_1",
        decisionLabel: "Whether to proceed",
        condition: "Authority unclear",
        nextGovernanceMove: "Assign one owner.",
        comparisonBand: "Above observed median",
        comparisonMaturityLevel: "3",
      }),
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, caseRef: "journey_user_1" });
    expect(persistDiagnosticStage).toHaveBeenCalledTimes(1);

    const call = vi.mocked(persistDiagnosticStage).mock.calls[0]![0];
    expect(call.stage).toBe("purpose_alignment");
    expect(call.payload).toMatchObject({
      _type: "session_case_carry_forward",
      source: "FAST_DIAGNOSTIC",
      sourceCaseRef: "case_fast_1",
      decisionLabel: "Whether to proceed",
      condition: "Authority unclear",
      nextGovernanceMove: "Assign one owner.",
      comparisonBand: "Above observed median",
      comparisonMaturityLevel: "3",
    });
    // Governed decision object is passed so DC title is derivable
    expect(call.decisionObject).not.toBeNull();
  });

  // ── DECISION_DELAY_CALCULATOR ───────────────────────────────────────────────

  it("persists a DECISION_DELAY_CALCULATOR case with flat raw inputs", async () => {
    vi.mocked(resolveIdentity).mockResolvedValue(AUTHED_IDENTITY);
    vi.mocked(persistDiagnosticStage).mockResolvedValue(JOURNEY_RESULT);

    const res = createRes();
    await handler(
      createReq({
        source: "DECISION_DELAY_CALCULATOR",
        weeklyCost: 5000,
        delayWeeks: 3,
        exposureType: "revenue",
        estimateConfidence: "rough",
        createdAt: "2026-05-15T00:00:00.000Z",
      }),
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, caseRef: "journey_user_1" });

    const call = vi.mocked(persistDiagnosticStage).mock.calls[0]![0];
    expect(call.stage).toBe("purpose_alignment");
    expect(call.payload).toMatchObject({
      _type: "session_case_carry_forward",
      source: "DECISION_DELAY_CALCULATOR",
      // decisionLabel is intentionally omitted for calculator cases
      decisionLabel: null,
      weeklyCost: 5000,
      delayWeeks: 3,
      exposureType: "revenue",
      estimateConfidence: "rough",
    });
  });

  // Computed exposure outputs are display-only — not stored in the governed record
  it("rejects DECISION_DELAY_CALCULATOR payloads that include computed outputs", async () => {
    vi.mocked(resolveIdentity).mockResolvedValue(AUTHED_IDENTITY);

    const res = createRes();
    await handler(
      createReq({
        source: "DECISION_DELAY_CALCULATOR",
        weeklyCost: 5000,
        delayWeeks: 3,
        // thirtyDayExposure is a computed output, not part of the schema
        thirtyDayExposure: 21429,
      }),
      res,
    );

    expect(res.statusCode).toBe(400);
    expect((res.body as { reason: string }).reason).toBe("INVALID_REQUEST");
    expect(persistDiagnosticStage).not.toHaveBeenCalled();
  });

  // ── Schema guard ────────────────────────────────────────────────────────────

  it("rejects raw internal fields outside the accepted client-safe contract", async () => {
    vi.mocked(resolveIdentity).mockResolvedValue(AUTHED_IDENTITY);

    const res = createRes();
    await handler(
      createReq({
        source: "FAST_DIAGNOSTIC",
        decisionLabel: "Whether to proceed",
        provenanceHash: "should-not-be-accepted",
      }),
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      reason: "INVALID_REQUEST",
      message: "Only client-safe session case fields may be saved.",
    });
    expect(persistDiagnosticStage).not.toHaveBeenCalled();
  });

  // ── Decision Centre visibility ──────────────────────────────────────────────
  //
  // Verifies that a successful save calls persistDiagnosticStage with the
  // shape required for Decision Centre to show the case:
  //   - stage: "purpose_alignment"     (DC reads this stage to build the case)
  //   - _type: "session_case_carry_forward"
  //   - decisionObject present         (DC derives case title from this)
  //   - email and subjectId threaded   (DC filters cases by email)

  it("saves with the payload shape Decision Centre needs to surface the case", async () => {
    vi.mocked(resolveIdentity).mockResolvedValue(AUTHED_IDENTITY);
    vi.mocked(persistDiagnosticStage).mockResolvedValue({
      journeyKey: "journey_user_1",
    } as never);

    const res = createRes();
    await handler(
      createReq({
        source: "FAST_DIAGNOSTIC",
        caseRef: "case_fast_1",
        decisionLabel: "Whether to restructure",
        condition: "No binding owner",
        nextGovernanceMove: "Assign one accountable owner.",
      }),
      res,
    );

    expect(res.statusCode).toBe(200);

    const call = vi.mocked(persistDiagnosticStage).mock.calls[0]![0];

    // DC queries journey by email — must be threaded through
    expect(call.email).toBe("user@example.com");
    expect(call.subjectId).toBe("user_1");

    // DC reads purpose_alignment stage to build a LivingCase
    expect(call.stage).toBe("purpose_alignment");
    expect((call.payload as { _type: string })._type).toBe("session_case_carry_forward");

    // DC derives case title from decisionObject.decisionText
    expect(call.decisionObject).toBeDefined();
    expect(call.decisionObject).not.toBeNull();
  });
});
