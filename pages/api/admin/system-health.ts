/* pages/api/admin/system-health.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireAdmin, requireRateLimit } from "@/lib/server/guards";
import { isContentlayerLoaded } from "@/lib/content";
import { jsonOk, jsonErr } from "@/lib/server/http";

/**
 * INSTITUTIONAL SYSTEM HEALTH
 * Outcome: Diagnostic report of database, content, and security layers.
 * Security: Gated by Admin Authorization and Rate Limiting.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. GATEKEEPING: Method Verification
  if (req.method !== "GET") {
    return jsonErr(res, 405, "METHOD_NOT_ALLOWED", "Use GET for diagnostics.");
  }

  // 2. GATEKEEPING: Rate Limiting (Paced to prevent resource exhaustion)
  const rl = await requireRateLimit(req, res, "system-health", "admin", 30);
  if (!rl.ok) return;

  // 3. GATEKEEPING: Admin Authorization
  const auth = await requireAdmin(req, res);
  if (!auth.ok) return;

  try {
    // 4. DIAGNOSTIC EXECUTION
    
    // Test Database Latency
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    // Verify Contentlayer Hydration
    const contentStatus = isContentlayerLoaded();

    // Aggregate Environment Status
    const healthReport = {
      status: "operational",
      timestamp: new Date().toISOString(),
      subsystems: {
        database: {
          provider: "Neon/PostgreSQL",
          latencyMs: dbLatency,
          connected: true
        },
        content: {
          engine: "Contentlayer2",
          hydrated: contentStatus,
          nodeCount: contentStatus ? (await import("contentlayer/generated")).allCanons.length : 0
        },
        security: {
          adminMethod: auth.admin.method,
          rateLimitRemaining: (rl as any).remaining
        }
      },
      environment: process.env.NODE_ENV
    };

    return jsonOk(res, healthReport);

  } catch (error) {
    console.error("[HEALTH_CHECK_CRITICAL_FAILURE]", error);
    return jsonErr(res, 500, "SYSTEM_DEGRADED", "One or more institutional subsystems are unresponsive.");
  }
}
