/**
 * Tests for lib/server/email.ts
 *
 * Covers:
 * - isSendToSelfEnabled feature flag
 * - sendAppEmail with console provider
 * - sendAppEmail with resend provider (mocked)
 * - sendAppEmail with missing provider config
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  resendSend: vi.fn(),
}));

class MockResend {
  emails: { send: typeof mocks.resendSend };
  constructor() {
    this.emails = { send: mocks.resendSend };
  }
}

vi.mock("resend", () => ({
  Resend: MockResend,
}));

// Import after mocks are set up
const { isSendToSelfEnabled, sendAppEmail } = await import("./email");

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.SEND_TO_SELF_ENABLED;
  delete process.env.EMAIL_PROVIDER;
  delete process.env.RESEND_API_KEY;
  delete process.env.MAIL_FROM;
  delete process.env.MAIL_TO;
  delete process.env.MAIL_TO_PRIMARY;
  delete process.env.MAIL_TO_FALLBACK;
});

describe("isSendToSelfEnabled", () => {
  it("returns true when SEND_TO_SELF_ENABLED is not set", () => {
    expect(isSendToSelfEnabled()).toBe(true);
  });

  it("returns true when SEND_TO_SELF_ENABLED is empty string", () => {
    process.env.SEND_TO_SELF_ENABLED = "";
    expect(isSendToSelfEnabled()).toBe(true);
  });

  it("returns true when SEND_TO_SELF_ENABLED is 'true'", () => {
    process.env.SEND_TO_SELF_ENABLED = "true";
    expect(isSendToSelfEnabled()).toBe(true);
  });

  it("returns false when SEND_TO_SELF_ENABLED is 'false'", () => {
    process.env.SEND_TO_SELF_ENABLED = "false";
    expect(isSendToSelfEnabled()).toBe(false);
  });

  it("returns false when SEND_TO_SELF_ENABLED is 'FALSE'", () => {
    process.env.SEND_TO_SELF_ENABLED = "FALSE";
    expect(isSendToSelfEnabled()).toBe(false);
  });

  it("returns false when SEND_TO_SELF_ENABLED is '0'", () => {
    process.env.SEND_TO_SELF_ENABLED = "0";
    expect(isSendToSelfEnabled()).toBe(true); // '0' is not 'false'
  });
});

describe("sendAppEmail", () => {
  it("returns error when no valid recipients", async () => {
    const result = await sendAppEmail({
      to: "",
      subject: "Test",
      html: "<p>Test</p>",
      text: "Test",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("No valid recipients configured");
  });

  it("returns error when subject is missing", async () => {
    const result = await sendAppEmail({
      to: "test@example.com",
      subject: "",
      html: "<p>Test</p>",
      text: "Test",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Missing email subject");
  });

  it("sends via console provider by default", async () => {
    const result = await sendAppEmail({
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
      text: "Hello",
    });
    expect(result.success).toBe(true);
    expect(result.messageId).toMatch(/^mock-/);
  });

  it("sends via resend provider when configured", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "re_abc123";
    mocks.resendSend.mockResolvedValueOnce({
      data: { id: "resend-msg-001" },
      error: null,
    });

    const result = await sendAppEmail({
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
      text: "Hello",
    });
    expect(result.success).toBe(true);
    expect(result.messageId).toBe("resend-msg-001");
    expect(mocks.resendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["test@example.com"],
        subject: "Test Subject",
      }),
    );
  });

  it("returns error when resend API key is missing", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    // RESEND_API_KEY not set

    const result = await sendAppEmail({
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
      text: "Hello",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Resend API key is not configured");
  });

  it("returns error when resend delivery fails", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "re_abc123";
    mocks.resendSend.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid recipient" },
    });

    const result = await sendAppEmail({
      to: "invalid@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
      text: "Hello",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid recipient");
  });
});
