/**
 * pages/api/internal/oversight/notify-client.ts
 *
 * Admin-only: sends notification email to client with secure brief link.
 * Does not email raw brief content. Does not attach sensitive data.
 * Requires operator-approved delivery state.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { sendEmail } from "@/lib/email/core/sendEmail";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "internal-oversight-notify-client",
  });
  if (!session) return;

  const { cycleId, recipientEmail, recipientName, cyclePeriod, signalCount, actionCount } = req.body || {};

  if (!cycleId || !recipientEmail || !cyclePeriod) {
    return res.status(400).json({
      ok: false,
      error: "cycleId, recipientEmail, and cyclePeriod are required.",
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://abrahamoflondon.com";
  const briefUrl = `${siteUrl}/oversight/brief/${encodeURIComponent(cycleId)}`;

  try {
    const emailResult = await sendEmail({
      type: "TRANSACTIONAL",
      to: String(recipientEmail).trim().toLowerCase(),
      subject: `Oversight Brief Ready — ${cyclePeriod}`,
      template: {
        name: "oversight-brief-ready",
        data: {
          recipientName: recipientName || null,
          cyclePeriod,
          briefUrl,
          signalCount: signalCount ?? null,
          actionCount: actionCount ?? null,
        },
      },
      meta: {
        source: "oversight:brief-delivery",
      },
    });

    return res.status(200).json({
      ok: true,
      delivered: emailResult.ok,
      briefUrl,
      warning: emailResult.ok ? undefined : "Email delivery may have failed.",
    });
  } catch (error) {
    console.error("[OVERSIGHT_NOTIFY_CLIENT_ERROR]", error);
    return res.status(500).json({ ok: false, error: "Failed to send notification." });
  }
}
