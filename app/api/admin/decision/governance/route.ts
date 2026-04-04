// app/api/admin/decision/governance/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export async function GET() {
  try {
    const prisma =
      typeof (db as any)?.getPrismaClient === "function"
        ? await (db as any).getPrismaClient()
        : db;

    if (!prisma) throw new Error("Database unavailable");

    const [rules, alerts] = await Promise.all([
      prisma.decisionAssetGovernanceRule.findMany({
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.decisionGovernanceAlert.findMany({
        where: { isActive: true },
        orderBy: [{ updatedAt: "desc" }],
      }),
    ]);

    return NextResponse.json({
      ok: true,
      rules,
      alerts: alerts.map((item: any) => ({
        id: item.id,
        assetId: item.assetId,
        assetTitle: item.assetTitle,
        assetKind: item.assetKind,
        alertType: item.alertType,
        severity: item.severity,
        message: item.message,
        previousValue: toNumber(item.previousValue, 0),
        currentValue: toNumber(item.currentValue, 0),
        deltaValue: toNumber(item.deltaValue, 0),
        contextType: item.contextType,
        contextValue: item.contextValue,
        createdAt: item.createdAt,
      })),
      summary: {
        ruleCount: rules.length,
        activeAlertCount: alerts.length,
        criticalAlertCount: alerts.filter((x: any) => x.severity === "CRITICAL").length,
        highAlertCount: alerts.filter((x: any) => x.severity === "HIGH").length,
      },
    });
  } catch (error) {
    console.error("[ADMIN_DECISION_GOVERNANCE_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load decision governance surface.",
      },
      { status: 500 }
    );
  }
}