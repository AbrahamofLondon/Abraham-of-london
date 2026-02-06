/* pages/api/strategy-room/enrol.ts — INTAKE LOGIC V5 */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verifyRecaptchaToken } from "@/lib/recaptchaServer";
import { vetStrategyInquiry } from "@/lib/intelligence/vetting-engine";

/**
 * INSTITUTIONAL INTAKE PROTOCOL:
 * 1. Method Verification (Strict POST)
 * 2. Bot Mitigation (reCAPTCHA v3)
 * 3. Database Persistence (Prisma)
 * 4. Automated Vetting (Priority Scoring)
 * 5. Institutional Audit (Security Logging)
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { name, email, intent, token } = req.body;

  // 1. Basic Validation
  if (!name || !email || !intent || !token) {
    return res.status(400).json({ ok: false, error: "Incomplete institutional data." });
  }

  try {
    // 2. Bot Mitigation: Verify token
    const isHuman = await verifyRecaptchaToken(token, "strategy_room_intake");
    if (!isHuman) {
      await prisma.systemAuditLog.create({
        data: {
          action: "BOT_DETECTION_SHIELD",
          severity: "high",
          resourceId: email,
          metadata: { ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress }
        }
      });
      return res.status(403).json({ ok: false, error: "Security validation failed." });
    }

    // 3. Database Archival: Principal Intake Registry
    const entry = await prisma.strategyInquiry.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        intent: String(intent).trim(),
        status: "PENDING",
        metadata: {
          ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"],
          timestamp: new Date().toISOString(),
          source: "Strategy_Room_V5",
        },
      },
    });

    // 4. Automated Vetting: Apply Heuristics Immediately
    const vettedEntry = await vetStrategyInquiry(entry.id);

    // 5. Institutional Audit: Log the event for the Command Wall
    await prisma.systemAuditLog.create({
      data: {
        action: "INTAKE_INITIALIZED",
        severity: vettedEntry?.status === "PRIORITY" ? "info" : "low",
        actorEmail: email,
        resourceType: "STRATEGY_INQUIRY",
        resourceId: entry.id,
        metadata: { priorityStatus: vettedEntry?.status }
      }
    });

    console.log(`[INTAKE_SUCCESS]: ${email} vetted as ${vettedEntry?.status}`);

    return res.status(200).json({ 
      ok: true, 
      message: "Institutional sequence initialized.",
      referenceId: entry.id,
      priorityStatus: vettedEntry?.status
    });

  } catch (error) {
    console.error("[STRATEGY_ENROL_ERROR]:", error);
    return res.status(500).json({ ok: false, error: "System failure during archival." });
  }
}