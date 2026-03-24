/* pages/api/admin/inner-circle/export.ts — Directorate Export */
import type { NextApiRequest, NextApiResponse } from "next";
import { 
  getKeysByMember, 
  getKeysByTier, 
  isExpired 
} from "@/lib/inner-circle/exports.server";
import { auditLogger } from "@/lib/server/db/audit";

const ADMIN_KEY = process.env.INNER_CIRCLE_ADMIN_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  // 1. Method Gate
  if (req.method !== "GET") return res.status(405).end();

  // 2. Security Handshake
  const authHeader = req.headers["x-inner-circle-admin-key"];
  const clientIp = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress || null;
  
  // Guard against missing environment variable or mismatched key
  if (!ADMIN_KEY || authHeader !== ADMIN_KEY) {
    await auditLogger.log({
      action: "UNAUTHORIZED_EXPORT_ATTEMPT",
      severity: "critical",
      actorType: "system", // Admin key attempts are system-level security events
      status: "unauthorized",
      ipAddress: clientIp,
      category: "SECURITY",
      subCategory: "ADMIN_ACCESS",
      metadata: { 
        path: "/api/admin/inner-circle/export",
        method: req.method
      }
    });
    return res.status(401).json({ error: "Unauthorized clearance level." });
  }

  try {
    const { memberId, tier } = req.query;
    let data: any[] = [];

    // 3. Explicit Parameter Handling
    const targetMember = Array.isArray(memberId) ? memberId[0] : (memberId as string);
    const targetTier = Array.isArray(tier) ? tier[0] : (tier as string);

    if (targetMember) {
      data = await getKeysByMember(targetMember);
    } else if (targetTier) {
      data = await getKeysByTier(targetTier);
    } else {
      return res.status(400).json({ error: "Export requires memberId or tier specification." });
    }

    // 4. Transform & Enrich
    const result = data.map((item: any) => ({
      ...item,
      active: !isExpired(item.expiresAt),
    }));

    // 5. Audit Success - Schema Aligned
    await auditLogger.log({
      action: "DATA_EXPORT_SUCCESS",
      severity: "info",
      actorType: "admin",
      resourceType: targetMember ? "MEMBER_RECORDS" : "TIER_RECORDS",
      resourceId: targetMember || targetTier || "bulk",
      status: "success",
      ipAddress: clientIp,
      category: "DATA_OPERATIONS",
      subCategory: "EXPORT",
      durationMs: Date.now() - startTime,
      metadata: { 
        type: targetMember ? "member" : "tier",
        count: result.length,
        query: req.query 
      }
    });

    return res.status(200).json({ 
      ok: true, 
      count: result.length,
      data: result 
    });
  } catch (error) {
    console.error("[EXPORT_CRITICAL_ERROR]", error);
    
    // Log the failure to the audit trail
    await auditLogger.log({
      action: "DATA_EXPORT_FAILURE",
      severity: "high",
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Internal Export Failure",
      category: "DATA_OPERATIONS",
      ipAddress: clientIp,
      metadata: { query: req.query }
    });

    return res.status(500).json({ error: "Internal Export Failure (Handshake/Database)." });
  }
}