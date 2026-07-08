import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  savePilotIntake: vi.fn(),
  getPilotIntakeByStatusSecret: vi.fn(),
  getPilotIntakeByRef: vi.fn(),
  consumeRateLimit: vi.fn(),
  recordFunnelEvent: vi.fn(),
}));

const record = {
  reference: "pilot_0123456789abcdef0123456789abcdef",
  createdAt: "2026-07-08T10:00:00.000Z",
  updatedAt: "2026-07-08T10:00:00.000Z",
  intake: { existingEvidence: "evidence" },
  qualification: { status: "POTENTIALLY_SUITABLE", reasons: [], missingFields: [] },
  reviewStatus: "POTENTIALLY_SUITABLE",
  owner: null,
  operatorNote: null,
  requestedInformation: null,
  finalDecision: null,
  fingerprint: "fp",
  statusSecretHash: "a".repeat(64),
  statusSecretExpiresAt: "2026-08-08T10:00:00.000Z",
  statusSecretRevokedAt: null,
  statusSecret: "pstat_" + "b".repeat(64),
};

vi.mock("@/lib/engagements/pilot-intake-store.composed", async () => {
  const actual = await vi.importActual<typeof import("@/lib/engagements/pilot-intake-store.shared")>("@/lib/engagements/pilot-intake-store.shared");
  return { ...actual, savePilotIntake: mocks.savePilotIntake, getPilotIntakeByStatusSecret: mocks.getPilotIntakeByStatusSecret, getPilotIntakeByRef: mocks.getPilotIntakeByRef };
});
vi.mock("@/lib/server/security/rate-limit-provider", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/security/rate-limit-provider")>("@/lib/server/security/rate-limit-provider");
  return { ...actual, consumeRateLimit: mocks.consumeRateLimit };
});
vi.mock("@/lib/demo/funnel-event-store.composed", () => ({ recordFunnelEvent: mocks.recordFunnelEvent }));

import intakeHandler from "@/pages/api/engagements/operator-pilot";
import statusSessionHandler from "@/pages/api/engagements/operator-pilot-status-session";
import statusHandler from "@/pages/api/engagements/operator-pilot-status";
import { createPilotStatusSessionValue, PILOT_STATUS_COOKIE } from "@/lib/engagements/pilot-status-security";

function req(body: Record<string, unknown> = {}, method = "POST", contentType = "application/json", cookie?: string) {
  return { method, headers: { "content-type": contentType, "x-forwarded-for": "203.0.113.9", ...(cookie ? { cookie } : {}) }, socket: { remoteAddress: "127.0.0.1" }, body, query: {} } as unknown as NextApiRequest;
}
function res() {
  const response = { statusCode: 200, body: undefined as unknown, headers: {} as Record<string, string>, setHeader: vi.fn((key: string, value: string | number | string[]) => { response.headers[key] = Array.isArray(value) ? value.join("; ") : String(value); }), status: vi.fn((code: number) => { response.statusCode = code; return response; }), json: vi.fn((body: unknown) => { response.body = body; return response; }) };
  return response as unknown as NextApiResponse & typeof response;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.savePilotIntake.mockResolvedValue(record);
  mocks.getPilotIntakeByStatusSecret.mockResolvedValue(record);
  mocks.getPilotIntakeByRef.mockResolvedValue(record);
  mocks.consumeRateLimit.mockResolvedValue({ allowed: true, remaining: 11, limit: 12, resetAt: Date.now() + 60_000, retryAfterMs: 0, backend: "postgres" });
});

describe("Operator Pilot secure status APIs", () => {
  it("does not allow old query-reference GET lookup", async () => {
    const response = res();
    await intakeHandler({ ...req({}, "GET"), query: { ref: record.reference } } as any, response);
    expect(response.status).toHaveBeenCalledWith(405);
    expect(mocks.getPilotIntakeByRef).not.toHaveBeenCalled();
  });

  it("returns one-time status access on submission", async () => {
    const response = res();
    await intakeHandler(req({ organisation: "Acme Ltd", role: "CEO", authorityToEngage: true, decisionDomain: "supply chain", materiality: "HIGH", decisionStage: "FRAMING", affectedStakeholders: "ops", existingEvidence: "Detailed operating evidence with supplier concentration and timing pressure", knownContradictions: "cost versus resilience", governanceSensitivity: "SOME", confidentialityRequired: false, desiredOutcome: "governed decision", willingToParticipateInCheckpoints: true, contactEmail: "a@example.com" }), response);
    expect(response.status).toHaveBeenCalledWith(201);
    expect((response.body as any).statusAccess.secret).toMatch(/^pstat_/);
    expect((response.body as any).statusAccess.statusUrl).toBe("/engagements/operator-pilot-status");
  });


  it("passes request idempotency key into the Pilot store", async () => {
    const response = res();
    await intakeHandler(req({ organisation: "Acme Ltd", role: "CEO", authorityToEngage: true, decisionDomain: "supply chain", materiality: "HIGH", decisionStage: "FRAMING", affectedStakeholders: "ops", existingEvidence: "Detailed operating evidence with supplier concentration and timing pressure", knownContradictions: "cost versus resilience", governanceSensitivity: "SOME", confidentialityRequired: false, desiredOutcome: "governed decision", willingToParticipateInCheckpoints: true, contactEmail: "a@example.com", idempotencyKey: "pilot-request-key-001" }), response);
    expect(mocks.savePilotIntake).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), { idempotencyKey: "pilot-request-key-001" });
    expect((response.body as any).duplicateClassification).toBe("NEW_INTAKE");
  });

  it("returns a typed conflict when an idempotency key is reused for changed content", async () => {
    mocks.savePilotIntake.mockRejectedValueOnce(new Error("PILOT_IDEMPOTENCY_CONFLICT"));
    const response = res();
    await intakeHandler(req({ organisation: "Acme Ltd", role: "CEO", authorityToEngage: true, decisionDomain: "supply chain", materiality: "HIGH", decisionStage: "FRAMING", affectedStakeholders: "ops", existingEvidence: "Detailed operating evidence with supplier concentration and timing pressure", knownContradictions: "cost versus resilience", governanceSensitivity: "SOME", confidentialityRequired: false, desiredOutcome: "governed decision", willingToParticipateInCheckpoints: true, contactEmail: "a@example.com", idempotencyKey: "pilot-request-key-001" }), response);
    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.body).toMatchObject({ code: "PILOT_IDEMPOTENCY_CONFLICT" });
  });
  it("validates status secret by POST body and sets HttpOnly cookie", async () => {
    const response = res();
    await statusSessionHandler(req({ secret: record.statusSecret }), response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(mocks.getPilotIntakeByStatusSecret).toHaveBeenCalledWith(record.statusSecret, { ip: "203.0.113.9" });
    expect(response.headers["Set-Cookie"]).toContain("HttpOnly");
    expect(response.headers["Set-Cookie"]).not.toContain(record.statusSecret);
  });

  it("reads status from HttpOnly session cookie without query secret", async () => {
    const cookie = `${PILOT_STATUS_COOKIE}=${createPilotStatusSessionValue(record.reference)}`;
    const response = res();
    await statusHandler(req({}, "GET", "application/json", cookie), response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect((response.body as any).status.reference).toBe(record.reference);
  });
});