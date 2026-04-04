/* pages/api/admin/identity-audit.ts — DATA INTEGRITY NODE RUNTIME */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { normalizeUserTier } from "@/lib/access/tier-policy";

type AuditRow = {
  sessionId: string;
  email: string;
  innerCircleTier: string;
  globalUserTier: string;
  syncStatus: "synced" | "drift_detected";
  lastSeen: string;
};

type AuditReport = {
  ok: boolean;
  timestamp: string;
  summary: {
    totalActiveSessions: number;
    driftCount: number;
    syncRate: string;
  };
  details: AuditRow[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const timestamp = new Date().toISOString();

  // 1. AUTHENTICATION & METHOD GATE (Standard Node style)
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    // 2. DATA INTEGRITY JOIN (Prisma Logic)
    const activeSessions = await prisma.session.findMany({
      where: { status: "active" },
      include: {
        member: {
          select: {
            id: true,
            email: true,
            tier: true,
            userId: true,
            user: { select: { tier: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Safety limit for audit view
    });

    let driftCount = 0;

    const details: AuditRow[] = activeSessions.map((s) => {
      const member = (s as any).member;
      const icTier = normalizeUserTier(member?.tier ?? "public");
      const globalTier = normalizeUserTier(member?.user?.tier ?? "public");
      
      const isSynced = icTier === globalTier;
      if (!isSynced) driftCount++;

      return {
        sessionId: `${s.sessionId.slice(0, 12)}...`,
        email: member?.email || "anonymous",
        innerCircleTier: icTier,
        globalUserTier: globalTier,
        syncStatus: isSynced ? "synced" : "drift_detected",
        lastSeen: s.createdAt.toISOString(),
      };
    });

    // 3. GENERATE REPORT
    const report: AuditReport = {
      ok: driftCount === 0,
      timestamp,
      summary: {
        totalActiveSessions: activeSessions.length,
        driftCount,
        syncRate: `${((activeSessions.length - driftCount) / (activeSessions.length || 1) * 100).toFixed(1)}%`,
      },
      details,
    };

    return res.status(report.ok ? 200 : 200).json(report);

  } catch (error: any) {
    console.error("[IDENTITY_AUDIT_FAILURE]", error);
    return res.status(500).json({
      ok: false,
      error: "Audit Execution Failed",
      message: error.message,
    });
  }
}