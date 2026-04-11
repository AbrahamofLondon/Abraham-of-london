export const dynamic = "force-dynamic";
// app/api/admin/decision/governance/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  buildDecisionSignalProfiles,
  type DecisionAssetContextRow,
} from "@/lib/decision/build-decision-signal-profile";

export async function GET() {
  try {
    const prisma =
      typeof (db as any)?.getPrismaClient === "function"
        ? await (db as any).getPrismaClient()
        : db;

    if (!prisma) throw new Error("Database unavailable");

    const [rows, alerts] = await Promise.all([
      prisma.decisionAssetContextPerformance.findMany({
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.decisionGovernanceAlert.findMany({
        where: { isActive: true },
        orderBy: [{ createdAt: "desc" }],
        take: 100,
      }),
    ]);

    const profiles = buildDecisionSignalProfiles(rows as DecisionAssetContextRow[]);

    const governanceBoard = profiles
      .filter((profile) => profile.governanceRiskScore > 0 || profile.drifts.length > 0)
      .slice(0, 50);

    return NextResponse.json({
      ok: true,
      summary: {
        activeAlerts: Array.isArray(alerts) ? alerts.length : 0,
        monitoredProfiles: profiles.length,
        highRiskProfiles: governanceBoard.filter(
          (profile) => profile.governanceRiskScore >= 70,
        ).length,
        criticalDriftProfiles: governanceBoard.filter(
          (profile) => profile.topDriftSeverity === "CRITICAL",
        ).length,
      },
      governanceBoard,
      alerts,
    });
  } catch (error) {
    console.error("[ADMIN_DECISION_GOVERNANCE_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load governance dashboard.",
      },
      { status: 500 },
    );
  }
}