import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  recordFunnelEvent: vi.fn(),
}));

vi.mock("@/lib/server/security/rate-limit-provider", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/security/rate-limit-provider")>("@/lib/server/security/rate-limit-provider");
  return {
    ...actual,
    consumeRateLimit: mocks.consumeRateLimit,
  };
});

vi.mock("@/lib/demo/funnel-event-store.composed", async () => {
  const actual = await vi.importActual<typeof import("@/lib/demo/funnel-event-store.shared")>("@/lib/demo/funnel-event-store.shared");
  return {
    ...actual,
    recordFunnelEvent: mocks.recordFunnelEvent,
  };
});

import handler from "@/pages/api/demo/funnel-event";

function req(body: Record<string, unknown> = {}, method = "POST", contentType = "application/json") {
  return {
    method,
    headers: { "content-type": contentType, "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    socket: { remoteAddress: "127.0.0.1" },
    body,
  } as unknown as NextApiRequest;
}

function res() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    setHeader: vi.fn((key: string, value: string | number) => {
      response.headers[key] = String(value);
    }),
    status: vi.fn((code: number) => {
      response.statusCode = code;
      return response;
    }),
    json: vi.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
  };
  return response as unknown as NextApiResponse & typeof response;
}

const validBody = {
  eventType: "SIGNAL_COMPLETED",
  sessionId: "session-demo-1",
  sourceRoute: "/decision-instruments/signal",
  recommendationId: "rec_demo_123456",
  decisionStatement: "confidential text that must not be persisted",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.consumeRateLimit.mockResolvedValue({
    allowed: true,
    remaining: 59,
    limit: 60,
    resetAt: Date.now() + 60_000,
    retryAfterMs: 0,
    backend: "postgres",
  });
  mocks.recordFunnelEvent.mockResolvedValue({ eventId: "fev_test_1" });
});

describe("POST /api/demo/funnel-event", () => {
  it("uses the shared rate-limit provider with hashed IP and bounded session identity", async () => {
    const response = res();
    await handler(req(validBody), response);

    expect(response.status).toHaveBeenCalledWith(201);
    expect(mocks.consumeRateLimit).toHaveBeenCalledWith(expect.objectContaining({
      limit: 60,
      windowMs: 60_000,
      failClosed: true,
      key: expect.stringMatching(/^demo-funnel-event:[0-9a-f]{16}:session-demo-1:\d{10}$/),
    }));
    expect(JSON.stringify(mocks.consumeRateLimit.mock.calls)).not.toContain("203.0.113.9");
    expect(response.headers["X-RateLimit-Backend"]).toBe("postgres");
  });

  it("does not persist arbitrary confidential payload fields", async () => {
    const response = res();
    await handler(req(validBody), response);

    expect(mocks.recordFunnelEvent).toHaveBeenCalledWith(expect.not.objectContaining({
      decisionStatement: expect.anything(),
    }));
    expect(JSON.stringify(mocks.recordFunnelEvent.mock.calls)).not.toContain("confidential text");
  });

  it("returns 429 and does not record when distributed limiter denies", async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      limit: 60,
      resetAt: Date.now() + 30_000,
      retryAfterMs: 30_000,
      backend: "postgres",
    });

    const response = res();
    await handler(req(validBody), response);

    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.headers["Retry-After"]).toBe("30");
    expect(mocks.recordFunnelEvent).not.toHaveBeenCalled();
  });

  it("rejects non-json requests before consuming rate limit", async () => {
    const response = res();
    await handler(req(validBody, "POST", "text/plain"), response);
    expect(response.status).toHaveBeenCalledWith(415);
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled();
  });

  it("rejects unknown event types before consuming rate limit", async () => {
    const response = res();
    await handler(req({ ...validBody, eventType: "BOGUS" }), response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled();
  });
});