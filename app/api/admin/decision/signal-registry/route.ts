export const dynamic = "force-dynamic";
// app/api/admin/decision/signal-registry/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildDecisionSignalRegistry } from "@/lib/decision/decision-signal-registry";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";

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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeSearchParam(
  request: NextRequest,
  key: string,
): string | null {
  const raw = request.nextUrl.searchParams.get(key);
  return raw && raw.trim() ? raw.trim() : null;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const prisma =
      typeof (db as any)?.getPrismaClient === "function"
        ? await (db as any).getPrismaClient()
        : null;

    if (!prisma) {
      throw new Error("Database unavailable");
    }

    const assetKind = normalizeSearchParam(request, "assetKind");
    const contextType = normalizeSearchParam(request, "contextType");
    const limitRaw = normalizeSearchParam(request, "limit");
    const limit = Math.min(
      250,
      Math.max(1, limitRaw ? Number(limitRaw) || 50 : 50),
    );

    const rows = (await prisma.decisionAssetContextPerformance.findMany({
      where: {
        ...(assetKind ? { assetKind } : {}),
        ...(contextType ? { contextType } : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      take: limit,
    })) as ContextPerformanceRow[];

    const registry = rows.map((row) => {
      const metadata = asRecord(row.metadata);

      return buildDecisionSignalRegistry({
        assetId: row.assetId,
        assetTitle: row.assetTitle,
        assetKind: row.assetKind,
        contextType: row.contextType,
        contextValue: row.contextValue,
        driftCandidates: [
          ...(asNumber(metadata.previousContextualWeight) != null
            ? [
                {
                  metricKey: "contextualWeight",
                  label: `${row.assetTitle} · ${row.contextType} · ${row.contextValue}`,
                  previousValue: asNumber(metadata.previousContextualWeight) as number,
                  currentValue: row.contextualWeight,
                },
              ]
            : []),
          ...(asNumber(metadata.previousUsefulnessScore) != null
            ? [
                {
                  metricKey: "usefulnessScore",
                  label: `${row.assetTitle} · ${row.contextType} · ${row.contextValue}`,
                  previousValue: asNumber(metadata.previousUsefulnessScore) as number,
                  currentValue: row.usefulnessScore,
                },
              ]
            : []),
        ],
        metadata,
      });
    });

    return NextResponse.json({
      success: true,
      count: registry.length,
      items: registry,
    });
  } catch (error) {
    console.error("[SIGNAL_REGISTRY_GET_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load signal registry.",
      },
      { status: 500 },
    );
  }
}