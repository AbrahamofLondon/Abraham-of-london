// app/api/client-portal/send-link/route.ts
// Admin-only: send a magic-link portal access email to a client.
//
// Creates a ClientPortalSession token (30-day default), emails the raw token
// URL to the client, and returns the session record to the admin.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { ClientPortalTokenService } from "@/lib/client-portal/client-portal-token";
import { sendEmail } from "@/lib/email/core/sendEmail";
import { z } from "zod";

const sendLinkSchema = z.object({
  clientEmail: z.string().email().min(1),
  clientName: z.string().optional(),
  expiryDays: z.number().int().min(1).max(90).optional(),
  sendEmail: z.boolean().optional().default(true),
});

function buildPortalEmail(input: {
  clientEmail: string;
  clientName?: string | null;
  portalUrl: string;
  expiresAt: Date;
}): { subject: string; html: string; text: string } {
  const greeting = input.clientName ? `Dear ${input.clientName},` : "Dear Principal,";
  const GOLD = "#C9A96E";
  const expiryStr = input.expiresAt.toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return {
    subject: "Your Abraham of London Decision Portal — access link",
    html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0b0a09;font-family:Georgia,serif;color:#f2f1ee;">
  <div style="max-width:540px;margin:0 auto;padding:48px 24px;">
    <div style="border-bottom:1px solid rgba(201,169,110,0.2);padding-bottom:16px;margin-bottom:32px;">
      <span style="font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.4em;color:${GOLD};">
        Abraham of London · Decision Portal
      </span>
    </div>
    <p style="font-size:15px;line-height:1.75;color:rgba(242,241,238,0.75);margin:0 0 16px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.75;color:rgba(242,241,238,0.75);margin:0 0 32px;">
      Your client portal is ready. Use the link below to access your reports, dossiers, and decision action log.
    </p>
    <p style="margin:32px 0;">
      <a href="${input.portalUrl}"
         style="display:inline-block;padding:14px 32px;border:1px solid rgba(201,169,110,0.4);
                background:rgba(201,169,110,0.1);color:${GOLD};font-family:monospace;
                font-size:11px;text-transform:uppercase;letter-spacing:0.28em;text-decoration:none;">
        Access Decision Portal →
      </a>
    </p>
    <p style="font-size:12px;color:rgba(242,241,238,0.3);line-height:1.6;margin-top:32px;">
      This link is personal. Do not share it. Expires: ${expiryStr}.<br>
      If your link expires, contact your Abraham of London representative.
    </p>
    <div style="border-top:1px solid rgba(201,169,110,0.12);padding-top:16px;margin-top:32px;">
      <span style="font-size:10px;color:rgba(242,241,238,0.2);font-family:monospace;">
        Abraham of London · Decision Authority Infrastructure
      </span>
    </div>
  </div>
</body>
</html>`,
    text: [
      greeting,
      "",
      "Your client portal is ready.",
      `Access link: ${input.portalUrl}`,
      "",
      `Expires: ${expiryStr}`,
      "This link is personal. Do not share it.",
      "",
      "Abraham of London · Decision Authority Infrastructure",
    ].join("\n"),
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = sendLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") },
        { status: 400 },
      );
    }

    const { clientEmail, clientName, expiryDays, sendEmail: doSendEmail } = parsed.data;

    const session = await ClientPortalTokenService.createSession({
      clientEmail,
      expiryDays,
      createdBy: auth.email ?? "admin",
    });

    let emailResult: { ok: boolean; error?: string } | null = null;

    if (doSendEmail) {
      const template = buildPortalEmail({
        clientEmail,
        clientName,
        portalUrl: session.portalUrl,
        expiresAt: session.record.expiresAt,
      });

      const sent = await sendEmail({
        type: "TRANSACTIONAL",
        to: clientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        meta: { source: "client-portal" },
      });
      emailResult = { ok: sent.ok, error: sent.error };
    }

    return NextResponse.json({
      ok: true,
      portalUrl: session.portalUrl,
      session: session.record,
      email: emailResult ?? { sent: false, reason: "sendEmail suppressed" },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to send portal link" },
      { status: 500 },
    );
  }
}
