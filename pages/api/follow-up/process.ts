/**
 * POST /api/follow-up/process
 *
 * Cron-callable endpoint that processes due pressure loop messages.
 * Reads all active loops from DB, checks for due messages, and sends via Resend.
 *
 * This is the retention engine. It makes decisions feel tracked.
 *
 * Netlify Scheduled Function or external cron hits:
 * POST /api/follow-up/process
 * Authorization: Bearer <CRON_SECRET>
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/core/sendEmail";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

function buildPressureEmailHtml(body: string, decision: string): string {
  const escapedBody = body.replace(/\n/g, "<br />");
  return `
<div style="font-family: 'Georgia', serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #e0e0e0; background: #0a0a0f;">
  <div style="border-bottom: 1px solid rgba(201,169,110,0.2); padding-bottom: 16px; margin-bottom: 24px;">
    <span style="font-family: monospace; font-size: 8px; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(201,169,110,0.6);">Decision Follow-Up</span>
  </div>
  <div style="font-size: 15px; line-height: 1.8; color: rgba(255,255,255,0.7);">
    ${escapedBody}
  </div>
  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.06);">
    <a href="${SITE_URL}/diagnostics/fast" style="display: inline-block; padding: 12px 24px; border: 1px solid rgba(201,169,110,0.4); background: rgba(201,169,110,0.08); color: #C9A96E; font-family: monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none;">
      Return to your decision
    </a>
  </div>
  <div style="margin-top: 24px; font-family: monospace; font-size: 7px; color: rgba(255,255,255,0.12); letter-spacing: 0.15em; text-transform: uppercase;">
    Abraham of London · Decision Intelligence
  </div>
</div>`.trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const loops = await prisma.diagnosticJourney.findMany({
      where: {
        diagnosticType: "pressure_loop",
        status: "active",
      },
      orderBy: { updatedAt: "asc" },
      take: 50,
    });

    const now = Date.now();
    let processed = 0;
    let sent = 0;
    let emailErrors = 0;

    for (const loop of loops) {
      const data = loop.mergedTensionThread as Record<string, unknown> | null;
      if (!data || !Array.isArray(data.messages)) continue;
      const email = loop.email ?? (data.email as string | undefined);
      if (!email) continue;

      const decision = (data.decision as string) ?? "";

      const messages = data.messages as Array<{
        stage: string;
        subject: string;
        body: string;
        scheduledAt: string;
        sent: boolean;
        actionRecorded: boolean;
      }>;

      let updated = false;
      for (const msg of messages) {
        if (msg.sent || msg.actionRecorded) continue;
        if (new Date(msg.scheduledAt).getTime() > now) continue;

        // Send via Resend
        const emailResult = await sendEmail({
          type: "TRANSACTIONAL",
          to: email,
          subject: msg.subject,
          html: buildPressureEmailHtml(msg.body, decision),
          text: msg.body,
          meta: {
            source: "pressure-loop",
            journeyId: loop.id,
          },
        });

        if (emailResult.ok) {
          msg.sent = true;
          updated = true;
          sent++;
        } else {
          console.error(`[pressure-loop] Email failed for ${email} (${msg.stage}): ${emailResult.error}`);
          emailErrors++;
          // Don't mark as sent if email failed — retry next cron run
        }
      }

      if (updated) {
        await prisma.diagnosticJourney.update({
          where: { id: loop.id },
          data: {
            mergedTensionThread: JSON.parse(JSON.stringify({ ...data, messages })),
            updatedAt: new Date(),
          },
        });
      }

      const allDone = messages.every((m) => m.sent || m.actionRecorded);
      if (allDone) {
        await prisma.diagnosticJourney.update({
          where: { id: loop.id },
          data: { status: "completed" },
        });
      }

      processed++;
    }

    return res.status(200).json({
      ok: true,
      processed,
      sent,
      emailErrors,
      message: sent > 0 ? `${sent} pressure messages sent` : "No messages due",
    });
  } catch (error) {
    console.error("[follow-up/process] Error:", error);
    return res.status(500).json({ error: "Failed to process follow-up loops" });
  }
}
