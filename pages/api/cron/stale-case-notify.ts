/**
 * pages/api/cron/stale-case-notify.ts
 *
 * POST /api/cron/stale-case-notify
 * Authorization: Bearer <CRON_SECRET>
 *
 * Identifies governed cases that have crossed a staleness threshold and
 * sends a single, actionable notification email to the case owner.
 *
 * Respects: muted flags, extended snooze windows, resend intervals.
 * Writes audit events for every notification sent.
 *
 * Run schedule: daily (configure in netlify.toml or external scheduler).
 * Safe to run multiple times per day — dedup prevents duplicate sends.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import { detectStaleCases } from "@/lib/product/stale-governed-case-detector";
import { notifyStaleCaseEmail } from "@/lib/product/stale-case-notifier";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://abrahamoflondon.com";

type CronResult = {
  ok: boolean;
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CronResult | { error: string }>,
) {
  const authHeader = req.headers.authorization;
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch active journeys with an email owner updated in the last 6 months
    const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const journeys = await prisma.diagnosticJourney.findMany({
      where: {
        status: "active",
        email: { not: null },
        updatedAt: { gt: cutoff },
      },
      select: {
        journeyKey: true,
        email: true,
        updatedAt: true,
        routeDecisions: true,
      },
      take: 500,
    });

    // Map to StaleCaseInput format
    const inputs = journeys.map((j) => {
      const rd =
        j.routeDecisions !== null &&
        typeof j.routeDecisions === "object" &&
        !Array.isArray(j.routeDecisions)
          ? (j.routeDecisions as Record<string, unknown>)
          : {};

      return {
        caseId: j.journeyKey,
        title: typeof rd.intakeTitle === "string" ? rd.intakeTitle : j.journeyKey,
        lastActivityAt: j.updatedAt,
        status: "active",
        returnBriefTriggered: typeof rd.returnBrief === "object" && rd.returnBrief !== null,
        counselWarranted: false,
      };
    });

    const staleCases = detectStaleCases(inputs);

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const c of staleCases) {
      const journeyEmail = journeys.find((j) => j.journeyKey === c.caseId)?.email;
      if (!journeyEmail) {
        skipped++;
        continue;
      }

      try {
        const result = await notifyStaleCaseEmail(c, journeyEmail, APP_URL);
        if (result.sent) sent++;
        else skipped++;
      } catch (err) {
        console.error("[stale-case-notify] Error sending notification", { caseId: c.caseId, err });
        errors++;
      }
    }

    return res.status(200).json({
      ok: true,
      processed: staleCases.length,
      sent,
      skipped,
      errors,
    });
  } catch (err) {
    console.error("[stale-case-notify] Handler error", err);
    return res.status(500).json({ error: "Internal error during stale case notification run" });
  }
}
