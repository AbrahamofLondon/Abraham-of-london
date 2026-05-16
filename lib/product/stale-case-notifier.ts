/**
 * lib/product/stale-case-notifier.ts
 *
 * Stale case email notification service.
 *
 * Sends a single, actionable email when a governed case crosses a staleness
 * threshold (WATCH / ALERT / CRITICAL). Includes a signed return link,
 * duplicate-send protection, mute/extend respect, and audit event logging.
 *
 * One-action email copy: each email has one primary CTA (return link).
 * No marketing. No follow-ups unless band escalates.
 *
 * Dedup logic:
 *   A notification is skipped if one was already sent for the same
 *   (caseId, userEmail, band) and fewer than RESEND_INTERVAL_DAYS have passed.
 *   Escalation to a higher band breaks the window and always sends.
 *
 * Mute/extend:
 *   If the StaleCaseNotification row has muted=true, skip permanently.
 *   If extendedUntil is set and is in the future, skip until then.
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendAppEmail } from "@/lib/server/email";
import type { StalenessBand, StaleCaseResult } from "./stale-governed-case-detector";

// ─── Config ───────────────────────────────────────────────────────────────────

const RESEND_INTERVAL_DAYS: Record<StalenessBand, number> = {
  WATCH: 14,
  ALERT: 7,
  CRITICAL: 3,
};

const BAND_LABEL: Record<StalenessBand, string> = {
  WATCH: "Needs attention",
  ALERT: "Overdue",
  CRITICAL: "Critical — accountability risk",
};

// ─── Signed return link ───────────────────────────────────────────────────────

function getReturnLinkSecret(): string {
  return (
    process.env.STALE_CASE_LINK_SECRET ||
    process.env.ACTION_TOKEN_SECRET ||
    process.env.JWT_SECRET ||
    "dev-stale-case-link-secret"
  );
}

export function issueReturnLinkToken(caseId: string, email: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const secret = getReturnLinkSecret();
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${caseId}:${email}:${issuedAt}`)
    .digest("hex");
  const payload = { caseId, email, issuedAt, sig };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function verifyReturnLinkToken(token: string): { caseId: string; email: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).caseId !== "string" ||
      typeof (parsed as Record<string, unknown>).email !== "string" ||
      typeof (parsed as Record<string, unknown>).issuedAt !== "number" ||
      typeof (parsed as Record<string, unknown>).sig !== "string"
    ) return null;

    const { caseId, email, issuedAt, sig } = parsed as { caseId: string; email: string; issuedAt: number; sig: string };
    const secret = getReturnLinkSecret();
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${caseId}:${email}:${issuedAt}`)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

    // Token valid for 90 days
    if (Math.floor(Date.now() / 1000) - issuedAt > 90 * 24 * 60 * 60) return null;

    return { caseId, email };
  } catch {
    return null;
  }
}

// ─── Dedup guard ─────────────────────────────────────────────────────────────

async function isDuplicate(
  caseId: string,
  userEmail: string,
  band: StalenessBand,
): Promise<boolean> {
  const existing = await prisma.staleCaseNotification.findUnique({
    where: {
      stale_case_notification_window: { caseId, userEmail, band },
    },
  });

  if (!existing) return false;

  // Permanently muted
  if (existing.muted) return true;

  // User extended the snooze
  if (existing.extendedUntil && existing.extendedUntil > new Date()) return true;

  // Within resend interval
  const intervalMs = RESEND_INTERVAL_DAYS[band] * 24 * 60 * 60 * 1000;
  if (Date.now() - existing.sentAt.getTime() < intervalMs) return true;

  return false;
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildEmailHtml(
  c: StaleCaseResult,
  returnUrl: string,
): string {
  const GOLD = "#C9A96E";
  const bandLabel = BAND_LABEL[c.band];
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return [
    `<!DOCTYPE html><html><body style="font-family: Georgia, serif; background: #030305; color: #EAEAEA; padding: 32px; max-width: 560px; margin: 0 auto;">`,
    `<p style="font-family: 'JetBrains Mono', monospace; font-size: 7px; letter-spacing: 0.28em; text-transform: uppercase; color: ${GOLD}70; margin-bottom: 16px;">Governed Case Alert</p>`,
    `<h1 style="font-size: 18px; font-weight: 400; color: ${GOLD}; margin-bottom: 8px; line-height: 1.3;">${esc(c.headline)}</h1>`,
    `<p style="font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.50); margin-bottom: 20px;">${esc(c.consequence)}</p>`,
    `<a href="${returnUrl}" style="display: inline-block; padding: 10px 20px; background: ${GOLD}14; border: 1px solid ${GOLD}40; color: ${GOLD}; font-size: 13px; text-decoration: none; margin-bottom: 24px;">Review case now</a>`,
    `<hr style="border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 20px 0;" />`,
    `<p style="font-size: 11px; line-height: 1.5; color: rgba(255,255,255,0.22);">`,
    `Status: <strong>${esc(bandLabel)}</strong> &middot; ${c.daysInactive} days since last activity.`,
    `</p>`,
    `<p style="font-size: 11px; line-height: 1.5; color: rgba(255,255,255,0.15); margin-top: 8px;">`,
    `This alert was sent because your governed case has been inactive beyond the governed threshold. `,
    `No marketing. No subscription. Operational notice only. Abraham of London.`,
    `</p>`,
    `</body></html>`,
  ].join("\n");
}

function buildEmailText(c: StaleCaseResult, returnUrl: string): string {
  return [
    `Governed Case Alert — ${BAND_LABEL[c.band]}`,
    ``,
    c.headline,
    ``,
    c.consequence,
    ``,
    `Review case now: ${returnUrl}`,
    ``,
    `---`,
    `${c.daysInactive} days since last activity.`,
    `No marketing. No subscription. Operational notice only. Abraham of London.`,
  ].join("\n");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type NotifyResult = {
  caseId: string;
  band: StalenessBand;
  sent: boolean;
  reason: "SENT" | "DUPLICATE" | "MUTED" | "SEND_FAILED";
};

/**
 * Attempt to send a stale case notification for a single case.
 * Returns a result indicating whether the email was sent or skipped.
 */
export async function notifyStaleCaseEmail(
  c: StaleCaseResult,
  userEmail: string,
  appUrl: string,
): Promise<NotifyResult> {
  const base: Omit<NotifyResult, "sent" | "reason"> = { caseId: c.caseId, band: c.band };

  const duplicate = await isDuplicate(c.caseId, userEmail, c.band);
  if (duplicate) {
    return { ...base, sent: false, reason: "DUPLICATE" };
  }

  // Issue signed return token
  const token = issueReturnLinkToken(c.caseId, userEmail);
  const returnUrl = `${appUrl}/decision-centre/case/${c.caseId}?rt=${token}`;

  const html = buildEmailHtml(c, returnUrl);
  const text = buildEmailText(c, returnUrl);

  const subject = `[${BAND_LABEL[c.band]}] Your governed case needs attention`;

  const result = await sendAppEmail({
    to: userEmail,
    subject,
    html,
    text,
  });

  if (!result.success) {
    console.error("[stale-case-notifier] Email delivery failed", { caseId: c.caseId, error: result.error });
    return { ...base, sent: false, reason: "SEND_FAILED" };
  }

  // Record send to prevent duplicates
  await prisma.staleCaseNotification.upsert({
    where: {
      stale_case_notification_window: { caseId: c.caseId, userEmail, band: c.band },
    },
    create: {
      caseId: c.caseId,
      userEmail,
      band: c.band,
      sentAt: new Date(),
      returnLinkToken: token,
    },
    update: {
      sentAt: new Date(),
      returnLinkToken: token,
      updatedAt: new Date(),
    },
  });

  // Audit event
  try {
    await prisma.auditEvent.create({
      data: {
        actionType: "STALE_CASE_NOTIFICATION_SENT",
        objectType: "GOVERNED_CASE",
        objectId: c.caseId,
        actorType: "system",
        summary: `Stale case notification sent — ${c.band} (${c.daysInactive}d inactive)`,
        metadata: {
          band: c.band,
          daysInactive: c.daysInactive,
        },
      },
    });
  } catch {
    // Non-fatal: audit failure should not block delivery confirmation
  }

  return { ...base, sent: true, reason: "SENT" };
}

/**
 * Mute all future stale notifications for a case.
 * Called when the user clicks "mute" in an email or the UI.
 */
export async function muteStaleCaseNotifications(
  caseId: string,
  userEmail: string,
): Promise<void> {
  await prisma.staleCaseNotification.updateMany({
    where: { caseId, userEmail },
    data: { muted: true, updatedAt: new Date() },
  });
}

/**
 * Extend the snooze window for a case by N days.
 */
export async function extendStaleCaseSnooze(
  caseId: string,
  userEmail: string,
  days: number,
): Promise<void> {
  const extendedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await prisma.staleCaseNotification.updateMany({
    where: { caseId, userEmail },
    data: { extendedUntil, updatedAt: new Date() },
  });
}
