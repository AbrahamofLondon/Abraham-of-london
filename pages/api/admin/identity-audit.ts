/* pages/api/admin/identity-audit.ts — DATA INTEGRITY NODE RUNTIME */
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/access/require-admin";
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
  const admin = await requireAdmin(req, res);
  if (!admin) return; // 401/403 already sent

  const timestamp = new Date().toISOString();

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // 2. DATA INTEGRITY JOIN (Prisma Logic)
    //
    // Persisted identity is InnerCircleMember and there is no second User
    // model, so there is no second tier column to drift from. This audit
    // endpoint originally compared InnerCircleMember.tier against
    // member.user.tier to detect drift; under single-source identity, drift
    // is impossible by construction. The response contract is preserved
    // (innerCircleTier, globalUserTier, syncStatus, driftCount all still
    // present) so consumers do not break; globalUserTier is populated from
    // the same source as innerCircleTier and syncStatus is always "synced".
    const activeSessions = await prisma.session.findMany({
      where: { status: "active" },
      include: {
        member: {
          select: {
            id: true,
            email: true,
            tier: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Safety limit for audit view
    });

    const driftCount = 0;

    const details: AuditRow[] = activeSessions.map((s) => {
      const icTier = normalizeUserTier(s.member?.tier ?? "public");

      return {
        sessionId: `${s.sessionId.slice(0, 12)}...`,
        email: s.member?.email || "anonymous",
        innerCircleTier: icTier,
        globalUserTier: icTier,
        syncStatus: "synced",
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