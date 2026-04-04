// app/api/admin/decision/rebuild-governance-alerts/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { detectDriftAlert } from "@/lib/decision/recommendation-drift-alerts";

type ContextPerformanceRow = {
  assetId: string;
  assetTitle: string;
  assetKind: string;
  contextType: string;
  contextValue: string;
  contextualWeight: number;
  usefulnessScore: number;
  metadata?: Record<string, unknown> | null;
};

export async function POST() {
  try {
    const prisma =
      typeof (db as any)?.getPrismaClient === "function"
        ? await (db as any).getPrismaClient()
        : null;

    if (!prisma) {
      throw new Error("Database unavailable");
    }

    const rows = (await prisma.decisionAssetContextPerformance.findMany({
      orderBy: [{ updatedAt: "desc" }],
    })) as ContextPerformanceRow[];

    let created = 0;

    for (const row of rows) {
      const metadata =
        row.metadata && typeof row.metadata === "object" ? row.metadata : {};

      const previousContextualWeight =
        typeof metadata.previousContextualWeight === "number"
          ? metadata.previousContextualWeight
          : null;

      const previousUsefulnessScore =
        typeof metadata.previousUsefulnessScore === "number"
          ? metadata.previousUsefulnessScore
          : null;

      const candidates = [
        previousContextualWeight != null
          ? detectDriftAlert({
              assetId: row.assetId,
              assetTitle: row.assetTitle,
              assetKind: row.assetKind,
              contextType: row.contextType,
              contextValue: row.contextValue,
              previousValue: previousContextualWeight,
              currentValue: row.contextualWeight,
              metric: "contextualWeight",
            })
          : null,

        previousUsefulnessScore != null
          ? detectDriftAlert({
              assetId: row.assetId,
              assetTitle: row.assetTitle,
              assetKind: row.assetKind,
              contextType: row.contextType,
              contextValue: row.contextValue,
              previousValue: previousUsefulnessScore,
              currentValue: row.usefulnessScore,
              metric: "usefulnessScore",
            })
          : null,
      ].filter(Boolean);

      for (const alert of candidates) {
        if (!alert) continue;

        await prisma.decisionGovernanceAlert.create({
          data: {
            assetId: row.assetId,
            assetTitle: row.assetTitle,
            assetKind: row.assetKind,
            alertType: alert.alertType,
            severity: alert.severity,
            message: alert.message,
            previousValue:
              alert.alertType === "CONTEXTUALWEIGHT_DRIFT"
                ? previousContextualWeight
                : previousUsefulnessScore,
            currentValue:
              alert.alertType === "CONTEXTUALWEIGHT_DRIFT"
                ? row.contextualWeight
                : row.usefulnessScore,
            deltaValue: alert.deltaValue,
            contextType: row.contextType,
            contextValue: row.contextValue,
            isActive: true,
          },
        });

        created += 1;
      }

      await prisma.decisionAssetContextPerformance.update({
        where: {
          assetId_contextType_contextValue: {
            assetId: row.assetId,
            contextType: row.contextType,
            contextValue: row.contextValue,
          },
        },
        data: {
          metadata: {
            ...metadata,
            previousContextualWeight: row.contextualWeight,
            previousUsefulnessScore: row.usefulnessScore,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      createdAlerts: created,
    });
  } catch (error) {
    console.error("[REBUILD_GOVERNANCE_ALERTS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to rebuild governance alerts.",
      },
      { status: 500 },
    );
  }
}