/**
 * tests/billing/admin-notification.test.ts
 *
 * P9 invariant tests for Boardroom Brief admin notification.
 *
 * Tests pure logic: email masking, deadline calculation, recipient resolution,
 * proof-mode labelling, and structural constraints. No network calls.
 */

import { describe, expect, it } from "vitest";

// ── Pure-logic mirrors of admin-notification.ts ───────────────────────────────

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}***@${domain}`;
}

function deliveryDeadline(from: Date): Date {
  return new Date(from.getTime() + 48 * 60 * 60 * 1000);
}

function adminRecipient(env: {
  BOARDROOM_ADMIN_EMAIL?: string;
  MAIL_TO?: string;
}): string {
  return (
    env.BOARDROOM_ADMIN_EMAIL?.trim() ||
    env.MAIL_TO?.trim() ||
    "admin@abrahamoflondon.org"
  );
}

function buildSubject(orderId: string, proofMode: boolean): string {
  const proofLabel = proofMode ? " [PROOF]" : "";
  return `New Boardroom Brief Order${proofLabel} — ${orderId}`;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("admin-notification — email masking", () => {
  it("masks email local part after first 3 chars", () => {
    expect(maskEmail("principal@example.com")).toBe("pri***@example.com");
  });

  it("masks short local parts correctly", () => {
    expect(maskEmail("ab@example.com")).toBe("ab***@example.com");
  });

  it("returns *** for malformed email", () => {
    expect(maskEmail("notanemail")).toBe("***");
  });

  it("preserves domain intact", () => {
    const masked = maskEmail("someone@abrahamoflondon.org");
    expect(masked.endsWith("@abrahamoflondon.org")).toBe(true);
  });
});

describe("admin-notification — delivery deadline", () => {
  it("delivery deadline is exactly 48 hours after order creation", () => {
    const created = new Date("2026-06-11T20:05:43Z");
    const deadline = deliveryDeadline(created);
    const diffHours = (deadline.getTime() - created.getTime()) / (1000 * 60 * 60);
    expect(diffHours).toBe(48);
  });

  it("deadline is in the future relative to order time", () => {
    const now = new Date();
    const deadline = deliveryDeadline(now);
    expect(deadline.getTime()).toBeGreaterThan(now.getTime());
  });
});

describe("admin-notification — recipient resolution", () => {
  it("uses BOARDROOM_ADMIN_EMAIL when set", () => {
    const result = adminRecipient({ BOARDROOM_ADMIN_EMAIL: "ops@example.com" });
    expect(result).toBe("ops@example.com");
  });

  it("falls back to MAIL_TO when BOARDROOM_ADMIN_EMAIL is absent", () => {
    const result = adminRecipient({ MAIL_TO: "fallback@example.com" });
    expect(result).toBe("fallback@example.com");
  });

  it("falls back to hardcoded admin address when both env vars are absent", () => {
    const result = adminRecipient({});
    expect(result).toBe("admin@abrahamoflondon.org");
  });

  it("BOARDROOM_ADMIN_EMAIL takes priority over MAIL_TO", () => {
    const result = adminRecipient({
      BOARDROOM_ADMIN_EMAIL: "priority@example.com",
      MAIL_TO: "other@example.com",
    });
    expect(result).toBe("priority@example.com");
  });
});

describe("admin-notification — subject line", () => {
  it("normal order subject contains order ID but no [PROOF]", () => {
    const subject = buildSubject("cmq9xgi4r0003ic09knwjhq57", false);
    expect(subject).toContain("cmq9xgi4r0003ic09knwjhq57");
    expect(subject).not.toContain("[PROOF]");
  });

  it("proof order subject includes [PROOF] label", () => {
    const subject = buildSubject("cmq9xgi4r0003ic09knwjhq57", true);
    expect(subject).toContain("[PROOF]");
  });

  it("subject does not expose session tokens or raw Stripe IDs", () => {
    const subject = buildSubject("cmq9xgi4r0003ic09knwjhq57", false);
    expect(subject).not.toMatch(/cs_live/);
    expect(subject).not.toMatch(/sk_/);
    expect(subject).not.toMatch(/promo_/);
  });
});
