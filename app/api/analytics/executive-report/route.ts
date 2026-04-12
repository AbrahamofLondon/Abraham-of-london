export const dynamic = "force-dynamic";
// app/api/analytics/executive-report/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { ExecutiveReportService } from "@/lib/predictive/services/executive-report-service";
import { logExecutiveReportAudit } from "@/lib/admin/reporting/executive-report-audit";

// ============================================================
// SOVEREIGN CONSTANTS
// ============================================================

const PROTOCOL_VERSION = "OGR-IV";
const NODE = "Canary Wharf";
const API_VERSION = "2.2.0";

// ============================================================
// VALIDATION SCHEMA
// ============================================================

const QuerySchema = z.object({
  campaignId: z.string().min(1, "Campaign identifier required"),
  horizon: z.coerce.number().int().min(7).max(180).default(30),
  confidence: z.coerce.number().min(0.8).max(0.99).default(0.95),
  includeSectorAnalysis: z.coerce.boolean().default(true),
  includeRiskMetrics: z.coerce.boolean().default(true),
});

// ============================================================
// LOCAL TYPES — reflect the ACTUAL predictive service surface
// ============================================================

type ForecastPoint = {
  timestamp?: string | Date;
  value?: number;
};

type ForecastResult = {
  points?: ForecastPoint[] | null;
  trend?: string | null;
  seasonality?: string | null;
  residuals?: number[] | null;
  rSquared?: number | null;
  metadata?: Record<string, unknown> | null;
};

type ExecutiveMarketReport = {
  metadata?: {
    generatedAt?: string;
    campaignId?: string;
    horizon?: number;
    confidenceScore?: number;
  } | null;
  baseline?: ForecastResult | null;
  riskAnalysis?: Record<string, unknown> | null;
  projections?: Record<string, unknown> | null;
  distribution?: Record<string, unknown> | null;
  marketContext?: Record<string, unknown> | null;
};

type CampaignRecord = {
  id: string;
  organisation: {
    id: string;
    name: string | null;
    industry: string | null;
    tier: string | null;
    status: string | null;
  } | null;
};

type PrismaLike = {
  alignmentCampaign?: {
    findUnique: (args: {
      where: { id: string };
      include: {
        organisation: {
          select: {
            id: true;
            name: true;
            industry: true;
            tier: true;
            status: true;
          };
        };
      };
    }) => Promise<CampaignRecord | null>;
  };
};

// ============================================================
// SECTOR INTELLIGENCE
// ============================================================

const SECTOR_MAP: Record<string, string[]> = {
  technology: ["TECH", "SEMI", "SOFT", "CLOUD"],
  financial: ["FIN", "BANK", "INS", "ASSET"],
  consumer: ["CONS", "RETL", "HOSP", "LUX"],
  energy: ["ENER", "OILG", "RENW", "UTIL"],
  healthcare: ["HLTH", "PHAR", "BIOT", "MEDT"],
  industrial: ["INDU", "AERO", "MANU", "TRAN"],
  default: ["SOV", "MARKET", "CORP", "INST"],
};

const SECTOR_VOLATILITY_FACTORS: Record<string, number> = {
  TECH: 1.2,
  SEMI: 1.3,
  SOFT: 1.1,
  CLOUD: 1.15,
  FIN: 0.9,
  BANK: 1.0,
  INS: 0.85,
  ASSET: 0.95,
  CONS: 0.8,
  RETL: 0.9,
  HOSP: 0.75,
  LUX: 0.85,
  ENER: 1.1,
  OILG: 1.2,
  RENW: 1.0,
  UTIL: 0.7,
  HLTH: 0.85,
  PHAR: 0.9,
  BIOT: 1.1,
  MEDT: 0.95,
  INDU: 1.0,
  AERO: 1.05,
  MANU: 0.95,
  TRAN: 0.9,
  SOV: 0.8,
  MARKET: 1.0,
  CORP: 0.85,
  INST: 0.9,
};

const HORIZON_FACTORS: Record<string, number> = {
  "1D": 0.3,
  "7D": 0.6,
  "30D": 1.0,
  "90D": 1.4,
};

// ============================================================
// HELPERS
// ============================================================

function toFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function parseBooleanParam(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  const normalized = value.trim().toLowerCase();

  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;

  return undefined;
}

function getCampaignSectors(campaign: {
  organisation?: { industry?: string | null } | null;
}): string[] {
  const industry = campaign.organisation?.industry?.toLowerCase() ?? "";

  for (const key of Object.keys(SECTOR_MAP)) {
    if (key !== "default" && industry.includes(key)) {
      return SECTOR_MAP[key] ?? SECTOR_MAP.default;
    }
  }

  return SECTOR_MAP.default;
}

function calculateVolatility(
  baseVolatility: number,
  sectorCode: string,
  horizon: string,
): number {
  const sectorFactor = SECTOR_VOLATILITY_FACTORS[sectorCode] ?? 1.0;
  const horizonFactor = HORIZON_FACTORS[horizon] ?? 1.0;

  return Math.min(
    0.85,
    Number((baseVolatility * sectorFactor * horizonFactor).toFixed(4)),
  );
}

function getBaselineVolatility(baseline: ForecastResult): number {
  const metadata = baseline.metadata ?? {};
  const raw =
    metadata["volatility"] ??
    metadata["volatilityIndex"] ??
    metadata["standardDeviation"] ??
    null;

  return Math.max(0.05, Math.min(0.85, toFiniteNumber(raw, 0.25)));
}

function calculateConfidenceScore(baseline: ForecastResult): number {
  const rSquared = toFiniteNumber(baseline.rSquared, 0);
  const residualPenalty = Array.isArray(baseline.residuals)
    ? Math.min(0.2, baseline.residuals.length > 0 ? 0.05 : 0)
    : 0;

  const score = 0.55 + Math.min(0.35, rSquared * 0.35) - residualPenalty;
  return Math.max(0.5, Math.min(0.95, Number(score.toFixed(4))));
}

function getPointValue(point?: ForecastPoint | null): number {
  return toFiniteNumber(point?.value, 0);
}

function normalisePoints(points: ForecastResult["points"]): ForecastPoint[] {
  if (!Array.isArray(points)) return [];
  return points.filter((point): point is ForecastPoint => !!point);
}

function buildForecastSummary(baseline: ForecastResult) {
  const points = normalisePoints(baseline.points);
  const first = points[0];
  const last = points.length > 0 ? points[points.length - 1] : undefined;

  const firstValue = getPointValue(first);
  const lastValue = getPointValue(last);
  const delta = Number((lastValue - firstValue).toFixed(4));

  const values = points.map((point) => getPointValue(point));
  const lowerBound = values.length > 0 ? Math.min(...values) : 0;
  const upperBound = values.length > 0 ? Math.max(...values) : 0;

  return {
    pointCount: points.length,
    trend: toStringValue(baseline.trend, "unknown"),
    seasonality: toStringValue(baseline.seasonality, "unclassified"),
    rSquared: toFiniteNumber(baseline.rSquared, 0),
    startValue: firstValue,
    endValue: lastValue,
    delta,
    lowerBound,
    upperBound,
    points,
  };
}

function deriveHeadline(summary: ReturnType<typeof buildForecastSummary>): string {
  const trend = summary.trend.toLowerCase();

  if (trend.includes("up")) {
    return "Forward indicators show upward directional pressure.";
  }
  if (trend.includes("down")) {
    return "Forward indicators show downward directional pressure.";
  }
  if (trend.includes("volatile")) {
    return "Forward indicators show unstable directional conditions.";
  }

  return "Forward indicators show a mixed but measurable pattern.";
}

function deriveSummaryText(
  organisationName: string,
  summary: ReturnType<typeof buildForecastSummary>,
  confidenceScore: number,
): string {
  return [
    `${organisationName} predictive market analysis completed.`,
    `Trend: ${summary.trend}.`,
    `Forecast points: ${summary.pointCount}.`,
    `Observed range: ${summary.lowerBound.toFixed(2)} to ${summary.upperBound.toFixed(2)}.`,
    `Model confidence: ${(confidenceScore * 100).toFixed(1)}%.`,
  ].join(" ");
}

async function getPrismaClient(): Promise<PrismaLike> {
  if (typeof (db as { $extends?: unknown }).$extends === "function") {
    return db as PrismaLike;
  }

  if (
    typeof (db as { getPrismaClient?: () => Promise<unknown> }).getPrismaClient ===
    "function"
  ) {
    const client = await (db as { getPrismaClient: () => Promise<unknown> }).getPrismaClient();
    return client as PrismaLike;
  }

  return db as PrismaLike;
}

// ============================================================
// MAIN HANDLER
// ============================================================

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "SOVEREIGN_ACCESS_REQUIRED",
          message: "Authentication required for executive intelligence",
          code: "AUTH_401",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);

    const validationResult = QuerySchema.safeParse({
      campaignId: searchParams.get("campaignId"),
      horizon: searchParams.get("horizon") ?? undefined,
      confidence: searchParams.get("confidence") ?? undefined,
      includeSectorAnalysis:
        parseBooleanParam(searchParams.get("includeSectorAnalysis")) ?? undefined,
      includeRiskMetrics:
        parseBooleanParam(searchParams.get("includeRiskMetrics")) ?? undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_QUERY",
          message:
            validationResult.error.issues[0]?.message ?? "Invalid query parameters",
          details: validationResult.error.issues,
          code: "VALIDATION_400",
        },
        { status: 400 },
      );
    }

    const {
      campaignId,
      horizon,
      confidence,
      includeSectorAnalysis,
      includeRiskMetrics,
    } = validationResult.data;

    const prisma = await getPrismaClient();

    if (!prisma.alignmentCampaign) {
      return NextResponse.json(
        {
          success: false,
          error: "REGISTRY_UNAVAILABLE",
          message: "Sovereign Alignment Registry connection failed",
          code: "DB_503",
        },
        { status: 503 },
      );
    }

    const campaign = await prisma.alignmentCampaign.findUnique({
      where: { id: campaignId },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
            industry: true,
            tier: true,
            status: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          error: "CAMPAIGN_NOT_FOUND",
          message: `No alignment campaign found for: ${campaignId}`,
          code: "NOTFOUND_404",
        },
        { status: 404 },
      );
    }

    const reportService = ExecutiveReportService.getInstance();
    const report = (await reportService.generateMarketAnalysisReport(
      campaignId,
      horizon,
    )) as ExecutiveMarketReport;

    if (!report?.baseline) {
      return NextResponse.json(
        {
          success: false,
          error: "REPORT_BASELINE_UNAVAILABLE",
          message: "Predictive service returned no usable baseline forecast",
          code: "REPORT_502",
        },
        { status: 502 },
      );
    }

    const baseline = report.baseline;
    const summary = buildForecastSummary(baseline);
    const baselineVolatility = getBaselineVolatility(baseline);
    const modelConfidence = calculateConfidenceScore(baseline);
    const organisationName = campaign.organisation?.name ?? "Sovereign Client";

    let sectorVolatility: Array<{
      sector: string;
      horizon: string;
      volatility: number;
      isHigh: boolean;
      confidence: number;
      factor: number;
    }> = [];

    if (includeSectorAnalysis) {
      const sectors = getCampaignSectors(campaign);
      const horizons = ["1D", "7D", "30D", "90D"] as const;

      sectorVolatility = sectors.flatMap((sector) =>
        horizons.map((h) => {
          const volatility = calculateVolatility(baselineVolatility, sector, h);

          return {
            sector,
            horizon: h,
            volatility,
            isHigh: volatility > 0.45,
            confidence: modelConfidence,
            factor: SECTOR_VOLATILITY_FACTORS[sector] ?? 1.0,
          };
        }),
      );
    }

    const enrichedReport = {
      success: true,
      reportType: "PREDICTIVE_MARKET_ANALYSIS",
      meta: {
        generatedAt: report.metadata?.generatedAt ?? new Date().toISOString(),
        responseTimeMs: Date.now() - startTime,
        campaignId,
        organisation: organisationName,
        tier: campaign.organisation?.tier ?? "Standard",
        protocol: PROTOCOL_VERSION,
        version: API_VERSION,
        node: NODE,
        horizonDays: horizon,
        requestedConfidence: confidence,
        modelConfidence,
      },
      executive: {
        headline: deriveHeadline(summary),
        summary: deriveSummaryText(organisationName, summary, modelConfidence),
        note: "This endpoint returns predictive market analysis only. It does not infer alignment-state narrative fields.",
      },
      baselineForecast: {
        pointCount: summary.pointCount,
        trend: summary.trend,
        seasonality: summary.seasonality,
        rSquared: summary.rSquared,
        startValue: summary.startValue,
        endValue: summary.endValue,
        delta: summary.delta,
        lowerBound: summary.lowerBound,
        upperBound: summary.upperBound,
        volatility: baselineVolatility,
        points: summary.points,
      },
      analytics: {
        riskAnalysis: includeRiskMetrics ? (report.riskAnalysis ?? null) : undefined,
        projections: report.projections ?? null,
        distribution: report.distribution ?? null,
        marketContext: report.marketContext ?? null,
      },
      ...(includeSectorAnalysis
        ? {
            sectorAnalysis: {
              sectors: getCampaignSectors(campaign),
              sectorVolatility,
            },
          }
        : {}),
    };

    void logExecutiveReportAudit({
      campaignId,
      actorId: session.user?.id ?? session.user?.email ?? "unknown",
      organisationName,
      report: {
        generatedAt: enrichedReport.meta.generatedAt,
        trend: summary.trend,
        pointCount: summary.pointCount,
        modelConfidence,
      } as Record<string, unknown>,
    }).catch((auditError) => {
      console.warn("[EXECUTIVE_REPORT_AUDIT]", auditError);
    });

    return NextResponse.json(enrichedReport, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=30",
        "X-Response-Time": String(Date.now() - startTime),
        "X-Sovereign-Protocol": PROTOCOL_VERSION,
        "X-API-Version": API_VERSION,
        "X-Node": NODE,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown internal error";

    console.error("[EXECUTIVE_REPORT_API]", {
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Failed to generate executive intelligence report",
        code: "ERR_500",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// ============================================================
// CORS SUPPORT
// ============================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Sovereign-Key",
      "Access-Control-Max-Age": "86400",
    },
  });
}