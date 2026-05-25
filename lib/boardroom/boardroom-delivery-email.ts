/**
 * lib/boardroom/boardroom-delivery-email.ts
 *
 * Sends the secure boardroom dossier delivery email to the client.
 * Wraps sendEmail() with boardroom-specific template and audit contract.
 *
 * Rules:
 * - Never logs the raw token or delivery URL in plaintext audit logs
 * - Always sends from the authorised FROM address
 * - Returns ok/error — caller decides whether to abort or continue
 */

import "server-only";

import { sendEmail } from "@/lib/email/core/sendEmail";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BoardroomDeliveryEmailInput = {
  to: string;
  clientName?: string | null;
  dossierTitle: string;
  deliveryUrl: string;
  expiresAt: Date;
  dossierId: string;
  tokenId: string;
};

export type BoardroomDeliveryEmailResult = {
  ok: boolean;
  error?: string;
  emailId?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatExpiry(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

function buildHtml(input: BoardroomDeliveryEmailInput): string {
  const greeting = input.clientName ? `Dear ${input.clientName},` : "Dear Principal,";
  const expiryStr = formatExpiry(input.expiresAt);

  return `<!DOCTYPE html>
<html>
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#0b0a09;font-family:Georgia,serif;color:#f2f1ee;">
    <div style="max-width:540px;margin:0 auto;padding:48px 24px;">
      <div style="border-bottom:1px solid rgba(201,169,110,0.2);padding-bottom:16px;margin-bottom:32px;">
        <span style="font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.4em;color:#c9a96e;">
          Abraham of London · Decision Authority Infrastructure
        </span>
      </div>

      <h1 style="font-size:22px;font-weight:300;margin:0 0 8px;color:#f2f1ee;">
        Boardroom Dossier Ready
      </h1>
      <p style="font-size:13px;color:rgba(201,169,110,0.7);margin:0 0 32px;font-family:monospace;text-transform:uppercase;letter-spacing:0.15em;">
        ${input.dossierTitle}
      </p>

      <p style="font-size:15px;line-height:1.75;color:rgba(242,241,238,0.75);margin:0 0 24px;">
        ${greeting}
      </p>
      <p style="font-size:15px;line-height:1.75;color:rgba(242,241,238,0.75);margin:0 0 24px;">
        Your Boardroom Dossier has been prepared and released through the governed delivery process.
        Use the secure access link below to review your briefing.
      </p>

      <p style="margin:32px 0;">
        <a href="${input.deliveryUrl}"
           style="display:inline-block;padding:14px 32px;border:1px solid rgba(201,169,110,0.4);
                  background:rgba(201,169,110,0.1);color:#c9a96e;font-family:monospace;
                  font-size:11px;text-transform:uppercase;letter-spacing:0.28em;text-decoration:none;">
          Access Boardroom Dossier →
        </a>
      </p>

      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
                  padding:16px 20px;margin:32px 0;border-radius:2px;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;
                  color:rgba(242,241,238,0.4);font-family:monospace;">Access terms</p>
        <ul style="margin:0;padding:0 0 0 16px;color:rgba(242,241,238,0.6);font-size:13px;line-height:1.8;">
          <li>This link is personal and bound to your briefing.</li>
          <li>Do not forward or share this email.</li>
          <li>Access expires: <strong style="color:rgba(242,241,238,0.85);">${expiryStr}</strong></li>
          <li>If your link expires, contact your Abraham of London representative.</li>
        </ul>
      </div>

      <p style="font-size:12px;color:rgba(242,241,238,0.3);line-height:1.6;margin-top:40px;">
        This is a governed delivery from Abraham of London. The dossier is confidential
        and intended solely for the named recipient. Unauthorised access or forwarding
        is a breach of the engagement terms.
      </p>

      <div style="border-top:1px solid rgba(201,169,110,0.12);padding-top:16px;margin-top:32px;">
        <span style="font-size:10px;color:rgba(242,241,238,0.2);font-family:monospace;">
          Abraham of London · Decision Authority Infrastructure
        </span>
      </div>
    </div>
  </body>
</html>`;
}

function buildText(input: BoardroomDeliveryEmailInput): string {
  const greeting = input.clientName ? `Dear ${input.clientName},` : "Dear Principal,";
  const expiryStr = formatExpiry(input.expiresAt);

  return [
    greeting,
    "",
    "Your Boardroom Dossier has been prepared and released through the governed delivery process.",
    "",
    `Dossier: ${input.dossierTitle}`,
    `Access link: ${input.deliveryUrl}`,
    "",
    "Access terms:",
    "  • This link is personal and bound to your briefing.",
    "  • Do not forward or share this email.",
    `  • Access expires: ${expiryStr}`,
    "  • If your link expires, contact your Abraham of London representative.",
    "",
    "This is a governed delivery from Abraham of London.",
    "The dossier is confidential and intended solely for the named recipient.",
    "",
    "Abraham of London · Decision Authority Infrastructure",
  ].join("\n");
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Send a boardroom dossier delivery email.
 * Returns ok/error — never throws.
 */
export async function sendBoardroomDeliveryEmail(
  input: BoardroomDeliveryEmailInput,
): Promise<BoardroomDeliveryEmailResult> {
  try {
    const result = await sendEmail({
      type: "TRANSACTIONAL",
      to: input.to,
      subject: `Boardroom Dossier Ready — ${input.dossierTitle}`,
      html: buildHtml(input),
      text: buildText(input),
      meta: {
        source: "boardroom-delivery",
        journeyId: input.dossierId,
      },
    });

    return {
      ok: result.ok,
      error: result.error,
      emailId: result.id,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "EMAIL_DISPATCH_FAILED",
    };
  }
}
