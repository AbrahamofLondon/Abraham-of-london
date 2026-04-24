/**
 * Access Invite Email — sends invitation emails via Resend.
 *
 * Uses the existing Resend infrastructure from lib/email/.
 * Falls back to console logging in development.
 */

import { sendEmail } from "@/lib/email/core/sendEmail";

import type { EntitlementGrant } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InviteEmailInput = {
  recipientEmail: string;
  inviteUrl: string;
  grants: EntitlementGrant[];
  expiresAt?: Date | null;
  senderName?: string;
};

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

function grantSummary(grants: EntitlementGrant[]): string {
  return grants
    .map((g) => {
      const type = g.type === "tier" ? "Tier Access" : g.type === "artifact" ? "Artifact" : "Product";
      return `${type}: ${g.key}`;
    })
    .join("\n  ");
}

function buildSubject(grants: EntitlementGrant[]): string {
  const tierGrant = grants.find((g) => g.type === "tier");
  if (tierGrant) return `Access Invitation — ${tierGrant.key} tier`;
  return "Access Invitation — Abraham of London";
}

function buildPlainText(input: InviteEmailInput): string {
  const expiryLine = input.expiresAt
    ? `\nThis invitation expires on ${input.expiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
    : "";

  return `
You have been granted access to restricted content on Abraham of London.

Entitlements:
  ${grantSummary(input.grants)}

To activate your access, open the following link:
${input.inviteUrl}
${expiryLine}

This invitation is bound to ${input.recipientEmail} and cannot be transferred.
If you did not expect this invitation, you may disregard this email.

Abraham of London
Sovereign Intelligence Platform
`.trim();
}

function buildHtml(input: InviteEmailInput): string {
  const expiryLine = input.expiresAt
    ? `<p style="color:#888;font-size:12px;margin-top:16px;">Expires ${input.expiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>`
    : "";

  const grantRows = input.grants
    .map((g) => {
      const type = g.type === "tier" ? "Tier" : g.type === "artifact" ? "Artifact" : "Product";
      return `<tr><td style="padding:6px 12px;color:#888;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">${type}</td><td style="padding:6px 12px;color:#f2f1ee;font-family:monospace;font-size:12px;">${g.key}</td></tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#0b0a09;font-family:'Georgia',serif;">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px;">
    <div style="border-bottom:1px solid rgba(201,169,110,0.25);padding-bottom:16px;margin-bottom:32px;">
      <span style="font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.4em;color:#c9a96e;">
        Abraham of London
      </span>
    </div>

    <h1 style="font-size:24px;font-weight:300;color:#f2f1ee;margin:0 0 16px;">
      Access Invitation
    </h1>

    <p style="font-size:15px;line-height:1.7;color:rgba(242,241,238,0.72);margin:0 0 24px;">
      You have been granted access to restricted content. The following entitlements are ready to activate.
    </p>

    <table style="width:100%;border-collapse:collapse;border:1px solid rgba(255,255,255,0.1);margin-bottom:24px;">
      ${grantRows}
    </table>

    <a href="${input.inviteUrl}" style="display:inline-block;padding:14px 28px;border:1px solid rgba(201,169,110,0.35);background:rgba(201,169,110,0.12);color:#c9a96e;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.28em;text-decoration:none;">
      Activate Access
    </a>

    ${expiryLine}

    <div style="margin-top:48px;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;">
      <p style="font-size:11px;color:rgba(242,241,238,0.35);line-height:1.6;margin:0;">
        This invitation is bound to <strong style="color:rgba(242,241,238,0.55);">${input.recipientEmail}</strong> and cannot be transferred.
        If you did not expect this invitation, disregard this email.
      </p>
    </div>
  </div>
</body>
</html>
`.trim();
}

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

function fromAddress(): string {
  return (
    process.env.INVITE_FROM_EMAIL ??
    process.env.MAIL_FROM ??
    "Abraham of London <access@abrahamoflondon.org>"
  );
}

export async function sendInviteEmail(
  input: InviteEmailInput,
): Promise<{ ok: boolean; provider: "resend"; error?: string; id?: string }> {
  const subject = buildSubject(input.grants);
  return sendEmail({
    type: "INVITE",
    to: input.recipientEmail,
    subject,
    template: {
      name: "invite",
      data: {
        recipientEmail: input.recipientEmail,
        inviteUrl: input.inviteUrl,
        grants: input.grants,
        expiresAt: input.expiresAt ?? null,
        senderName: input.senderName,
        subject,
      },
    },
    html: buildHtml(input),
    text: buildPlainText(input),
    from: fromAddress(),
    meta: {
      source: "access-invite",
    },
  });
}
