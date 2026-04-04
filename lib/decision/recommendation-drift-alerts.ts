// app/api/admin/decision/rebuild-governance-alerts/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { detectDriftAlert } from "@/lib/decision/recommendation-drift-alerts";

export async function POST() {
  try {
    const prisma =
      typeof (db as any)?.getPrismaClient === "function"
        ? await (db as any).getPrismaClient()
        : db;

    if (!prisma) throw new Error("Database unavailable");

    const rows = await prisma.decisionAssetContextPerformance.findMany({
      orderBy: [{ updatedAt: "desc" }],
    });

    let created = 0;

    for (const row of rows as any[]) {
      const previousWeight =
        typeof row.metadata?.previousContextualWeight === "number"
          ? row.metadata.previousContextualWeight
          : null;

      const previousUsefulness =
        typeof row.metadata?.previousUsefulnessScore === "number"
          ? row.metadata.previousUsefulnessScore
          : null;

      const candidates = [
        previousWeight != null
          ? detectDriftAlert({
              assetId: row.assetId,
              assetTitle: row.assetTitle,
              assetKind: row.assetKind,
              contextType: row.contextType,
              contextValue: row.contextValue,
              previousValue: previousWeight,
              currentValue: row.contextualWeight,
              metric: "contextualWeight",
            })
          : null,
        previousUsefulness != null
          ? detectDriftAlert({
              assetId: row.assetId,
              assetTitle: row.assetTitle,
              assetKind: row.assetKind,
              contextType: row.contextType,
              contextValue: row.contextValue,
              previousValue: previousUsefulness,
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
                ? previousWeight
                : previousUsefulness,
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
            ...(row.metadata || {}),
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
      { status: 500 }
    );
  }
}

export interface DriftAlertCandidate {
  assetId: string;
  assetTitle: string;
  assetKind: string;
  contextType?: string | null;
  contextValue?: string | null;
  previousValue: number;
  currentValue: number;
  metric: "contextualWeight" | "usefulnessScore" | "efficacyScore";
}

export interface DriftAlertResult {
  alertType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  deltaValue: number;
}

function roundTo(value: number, digits = 6): number {
  return Number(value.toFixed(digits));
}

export function detectDriftAlert(
  input: DriftAlertCandidate
): DriftAlertResult | null {
  const delta = roundTo(input.currentValue - input.previousValue, 6);
  const absDelta = Math.abs(delta);

  if (absDelta < 0.15) return null;

  let severity: DriftAlertResult["severity"] = "LOW";
  if (absDelta >= 0.6) severity = "CRITICAL";
  else if (absDelta >= 0.4) severity = "HIGH";
  else if (absDelta >= 0.25) severity = "MEDIUM";

  const direction = delta < 0 ? "declined" : "improved";

  return {
    alertType: `${input.metric.toUpperCase()}_DRIFT`,
    severity,
    deltaValue: delta,
    message: `${input.assetTitle} ${direction} materially on ${input.metric}${
      input.contextType && input.contextValue
        ? ` for ${input.contextType}=${input.contextValue}`
        : ""
    }.`,
  };
}