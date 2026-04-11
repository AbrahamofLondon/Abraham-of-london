export const dynamic = "force-dynamic";
// app/api/admin/decision/rebuild-governance-alerts/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { detectDriftAlerts } from "@/lib/decision/recommendation-drift-alerts";

type ContextPerformanceRow = {
  assetId: string;
  assetTitle: string;
  assetKind: string;
  contextType: string;
  contextValue: string;
  contextualWeight: number;
  usefulnessScore: number;
  confidenceScore?: number | null;
  metadata?: Record<string, unknown> | string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // ignore
    }
  }

  return {};
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

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
      const metadata = asRecord(row.metadata);

      const previousContextualWeight = asNumber(metadata.previousContextualWeight);
      const previousUsefulnessScore = asNumber(metadata.previousUsefulnessScore);
      const previousConfidenceScore = asNumber(metadata.previousConfidenceScore);

      const alerts = detectDriftAlerts(
        [
          previousContextualWeight != null
            ? {
                metric: "contextualWeight",
                label: `${row.assetTitle} · ${row.contextType} · ${row.contextValue}`,
                previousValue: previousContextualWeight,
                currentValue: row.contextualWeight,
              }
            : null,
          previousUsefulnessScore != null
            ? {
                metric: "usefulnessScore",
                label: `${row.assetTitle} · ${row.contextType} · ${row.contextValue}`,
                previousValue: previousUsefulnessScore,
                currentValue: row.usefulnessScore,
              }
            : null,
          previousConfidenceScore != null
            ? {
                metricKey: "confidenceScore",
                label: `${row.assetTitle} · ${row.contextType} · ${row.contextValue}`,
                previousValue: previousConfidenceScore,
                currentValue:
                  typeof row.confidenceScore === "number" ? row.confidenceScore : 0,
              }
            : null,
        ].filter(Boolean) as Parameters<typeof detectDriftAlerts>[0],
      );

      for (const alert of alerts) {
        const isContextualWeightAlert = alert.metricKey === "contextualWeight";
        const isUsefulnessScoreAlert = alert.metricKey === "usefulnessScore";
        const isConfidenceAlert = alert.metricKey === "confidenceScore";

        await prisma.decisionGovernanceAlert.create({
          data: {
            assetId: row.assetId,
            assetTitle: row.assetTitle,
            assetKind: row.assetKind,
            alertType: alert.alertType,
            severity: alert.severity,
            message: alert.message,
            previousValue: isContextualWeightAlert
              ? previousContextualWeight
              : isUsefulnessScoreAlert
                ? previousUsefulnessScore
                : isConfidenceAlert
                  ? previousConfidenceScore
                  : null,
            currentValue: isContextualWeightAlert
              ? row.contextualWeight
              : isUsefulnessScoreAlert
                ? row.usefulnessScore
                : isConfidenceAlert
                  ? row.confidenceScore ?? 0
                  : null,
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
            previousConfidenceScore:
              typeof row.confidenceScore === "number" ? row.confidenceScore : 0,
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