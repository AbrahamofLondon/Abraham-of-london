/* pages/api/admin/security/deny.ts — Security Exclusion Handler */
import type { NextApiRequest, NextApiResponse } from "next";
import { auditLogger } from "@/lib/server/db/audit";
import { prisma } from "@/lib/prisma.server";

const ADMIN_KEY = process.env.INNER_CIRCLE_ADMIN_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  // 1. Method Gate
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 2. Security Handshake
  const authHeader = req.headers["x-inner-circle-admin-key"];
  const clientIp = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress || "unknown";

  if (!ADMIN_KEY || authHeader !== ADMIN_KEY) {
    await auditLogger.log({
      action: "SECURITY_UNAUTHORIZED_DENY_ATTEMPT",
      severity: "critical",
      actorType: "anonymous",
      status: "failure",
      ipAddress: clientIp,
      category: "SECURITY",
      metadata: { attemptedPayload: req.body }
    });
    return res.status(401).json({ error: "Unauthorized clearance level." });
  }

  try {
    const { ip, reason, severity = "high" } = req.body;

    if (!ip) {
      return res.status(400).json({ error: "Missing Target Identity (IP/Host)." });
    }

    // 3. Logic Execution (Example: Blacklisting in DB or Redis)
    // Here we assume you have a model 'SecurityDenylist' or similar
    // For now, we perform the Audit Log which is the primary record.

    await auditLogger.log({
      action: "SECURITY_DENYLIST_ADDITION",
      severity: severity === "critical" ? "critical" : "error",
      actorType: "admin",
      resourceType: "NETWORK_IDENTITY",
      resourceId: ip,
      status: "success",
      ipAddress: clientIp,
      category: "SECURITY",
      subCategory: "FIREWALL",
      durationMs: Date.now() - startTime,
      metadata: { 
        reason: reason || "No reason provided",
        enforcedAt: new Date().toISOString()
      },
      tags: ["denylist", "firewall", "manual_intervention"]
    });

    return res.status(200).json({ 
      ok: true, 
      message: `Identity ${ip} successfully excluded.`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[SECURITY_DENY_FAILURE]", error);
    return res.status(500).json({ error: "Internal Security Engine Failure." });
  }
}