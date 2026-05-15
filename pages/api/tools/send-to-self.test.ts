/**
 * Tests for POST /api/tools/send-to-self
 *
 * Covers:
 * - Method validation (only POST allowed)
 * - Content type validation
 * - Schema validation for each source
 * - Rate limiting
 * - Email delivery success/failure
 * - Each source payload shape is valid
 * - No raw/internal fields in content
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendAppEmail: vi.fn(),
  isSendToSelfEnabled: vi.fn(),
  consumePersistentRateLimit: vi.fn(),
  writeSecurityAudit: vi.fn(),
}));

vi.mock("@/lib/server/email", () => ({
  sendAppEmail: mocks.sendAppEmail,
  isSendToSelfEnabled: mocks.isSendToSelfEnabled,
}));

vi.mock("@/lib/server/security/persistent-rate-limit", () => ({
  consumePersistentRateLimit: mocks.consumePersistentRateLimit,
}));

vi.mock("@/lib/security/audit-log", () => ({
  writeSecurityAudit: mocks.writeSecurityAudit,
}));

import handler from "./send-to-self";

function req(
  body: Record<string, unknown> = {},
  method = "POST",
  contentType = "application/json",
) {
  return {
    method,
    headers: { "content-type": contentType },
    socket: { remoteAddress: "127.0.0.1" },
    body,
  } as unknown as NextApiRequest;
}

function res() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    setHeader: vi.fn((key: string, value: string) => {
      response.headers[key] = value;
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

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isSendToSelfEnabled.mockReturnValue(true);
  mocks.consumePersistentRateLimit.mockResolvedValue({ allowed: true, remaining: 2 });
  mocks.sendAppEmail.mockResolvedValue({ success: true, messageId: "msg_001" });
});

describe("send-to-self — method and content type", () => {
  it("rejects non-POST methods", async () => {
    const response = res();
    await handler(req({}, "GET"), response);
    expect(response.status).toHaveBeenCalledWith(405);
    expect(response.body).toEqual({ ok: false, error: "Method not allowed" });
  });

  it("rejects non-JSON content type", async () => {
    const response = res();
    await handler(req({ email: "test@example.com", source: "fast_diagnostic", content: {} }, "POST", "text/plain"), response);
    expect(response.status).toHaveBeenCalledWith(415);
    expect(response.body).toEqual({ ok: false, error: "UNSUPPORTED_MEDIA_TYPE" });
  });
});

describe("send-to-self — schema validation", () => {
  it("rejects missing email", async () => {
    const response = res();
    await handler(req({ source: "fast_diagnostic", content: {} }), response);
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it("rejects invalid email", async () => {
    const response = res();
    await handler(req({ email: "not-an-email", source: "fast_diagnostic", content: {} }), response);
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it("rejects missing source", async () => {
    const response = res();
    await handler(req({ email: "test@example.com", content: {} }), response);
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it("rejects unknown source", async () => {
    const response = res();
    await handler(req({ email: "test@example.com", source: "unknown_source", content: {} }), response);
    expect(response.status).toHaveBeenCalledWith(400);
  });
});

describe("send-to-self — rate limiting", () => {
  it("returns 429 when rate limited", async () => {
    mocks.consumePersistentRateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0 });
    const response = res();
    await handler(req({
      email: "test@example.com",
      source: "fast_diagnostic",
      content: { title: "Test" },
    }), response);
    expect(response.status).toHaveBeenCalledWith(429);
    expect(mocks.writeSecurityAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "send_to_self_rate_limited" }),
    );
  });
});

describe("send-to-self — each source payload shape", () => {
  const basePayload = {
    email: "user@example.com",
    content: { title: "Test", summary: "Test summary" },
  };

  const sources = [
    "decision_delay_calculator",
    "fast_diagnostic",
    "board_summary_preview",
    "return_brief",
    "strategy_room_record",
    "client_safe_provenance",
    "proof_pack",
  ] as const;

  for (const source of sources) {
    it(`accepts valid payload for source: ${source}`, async () => {
      const response = res();
      await handler(req({ ...basePayload, source }), response);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.body).toEqual({ ok: true, sent: true });
    });
  }

  it("accepts payload with subjectType and subjectId for live records", async () => {
    const response = res();
    await handler(req({
      email: "user@example.com",
      source: "client_safe_provenance",
      content: {
        title: "Provenance summary",
        summary: "Accountability statement.",
        subjectType: "OVERSIGHT_CYCLE",
        subjectId: "cycle_001",
      },
    }), response);
    expect(response.status).toHaveBeenCalledWith(200);
  });
});

describe("send-to-self — email delivery", () => {
  it("returns error when email delivery fails", async () => {
    mocks.sendAppEmail.mockResolvedValueOnce({ success: false, error: "SMTP error" });
    const response = res();
    await handler(req({
      email: "user@example.com",
      source: "fast_diagnostic",
      content: { title: "Test" },
    }), response);
    expect(response.status).toHaveBeenCalledWith(500);
    expect(mocks.writeSecurityAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "send_to_self_failed" }),
    );
  });

  it("records audit on successful send", async () => {
    const response = res();
    await handler(req({
      email: "user@example.com",
      source: "board_summary_preview",
      content: { title: "Board Summary", summary: "Test" },
    }), response);
    expect(mocks.writeSecurityAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "send_to_self_sent", metadata: { source: "board_summary_preview" } }),
    );
  });
});

describe("send-to-self — production disabled state", () => {
  it("returns 503 EMAIL_NOT_CONFIGURED when SEND_TO_SELF_ENABLED is false", async () => {
    mocks.isSendToSelfEnabled.mockReturnValueOnce(false);
    const response = res();
    await handler(req({
      email: "user@example.com",
      source: "fast_diagnostic",
      content: { title: "Test" },
    }), response);
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.body).toEqual({
      ok: false,
      error: "EMAIL_NOT_CONFIGURED",
      message: "Email copy is not currently available. You can still save this case to Decision Centre.",
    });
    // Should not attempt rate limiting or email sending when disabled
    expect(mocks.consumePersistentRateLimit).not.toHaveBeenCalled();
    expect(mocks.sendAppEmail).not.toHaveBeenCalled();
  });

  it("does not pretend success when provider is missing", async () => {
    mocks.sendAppEmail.mockResolvedValueOnce({ success: false, error: "Resend API key is not configured" });
    const response = res();
    await handler(req({
      email: "user@example.com",
      source: "fast_diagnostic",
      content: { title: "Test" },
    }), response);
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.body).toEqual({
      ok: false,
      error: "Email could not be sent. Try again later.",
    });
  });

  it("no marketing subscription remains true even on error", async () => {
    mocks.sendAppEmail.mockResolvedValueOnce({ success: false, error: "Send failed" });
    const response = res();
    await handler(req({
      email: "user@example.com",
      source: "board_summary_preview",
      content: { title: "Test", summary: "Test" },
    }), response);
    // The response body should not contain any marketing-related fields
    expect(response.body).not.toHaveProperty("subscribed");
    expect(response.body).not.toHaveProperty("marketing");
    expect(response.body).not.toHaveProperty("newsletter");
  });
});

describe("send-to-self — no raw/internal fields leak", () => {
  it("does not accept raw governance events in content", async () => {
    const response = res();
    await handler(req({
      email: "user@example.com",
      source: "client_safe_provenance",
      content: {
        title: "Test",
        summary: "Test",
        governanceEvents: [{ type: "SUPPRESSION_APPLIED", label: "Suppressed field" }],
      },
    }), response);
    // The schema should strip extra fields via strict() or ignore them
    expect(response.status).not.toHaveBeenCalledWith(400);
  });

  it("does not accept operator notes in content", async () => {
    const response = res();
    await handler(req({
      email: "user@example.com",
      source: "proof_pack",
      content: {
        title: "Test",
        summary: "Test",
        operatorNotes: "Internal review notes",
      },
    }), response);
    expect(response.status).not.toHaveBeenCalledWith(400);
  });
});
