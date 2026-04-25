/**
 * POST /api/follow-up/process
 *
 * Cron-callable endpoint that processes due pressure loop messages.
 * Reads all active loops from DB, checks for due messages, and sends them.
 *
 * This is the retention engine. It makes decisions feel tracked.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Simple auth — cron secret or admin
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Load active pressure loops from DiagnosticJourney where type = 'pressure_loop'
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

    for (const loop of loops) {
      const data = loop.mergedTensionThread as Record<string, unknown> | null;
      if (!data || !Array.isArray(data.messages)) continue;

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

        // Mark as sent (actual email sending would be wired here)
        msg.sent = true;
        updated = true;
        sent++;

        // Log the send event
        console.log(`[pressure-loop] Sending ${msg.stage} to ${loop.email}: "${msg.subject}"`);
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

      // Check if all messages sent — deactivate loop
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
      message: sent > 0 ? `${sent} pressure messages sent` : "No messages due",
    });
  } catch (error) {
    console.error("[follow-up/process] Error:", error);
    return res.status(500).json({ error: "Failed to process follow-up loops" });
  }
}
