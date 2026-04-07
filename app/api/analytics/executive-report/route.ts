// app/api/analytics/executive-report/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ExecutiveReportService } from '@/lib/predictive/services/executive-report-service';
import { logExecutiveReportAudit } from '@/lib/admin/reporting/executive-report-audit';

// ============================================================
// SOVEREIGN CONSTANTS
// ============================================================

const PROTOCOL_VERSION = 'OGR-IV';
const NODE = 'Canary Wharf';
const API_VERSION = '2.1.0';

// ============================================================
// VALIDATION SCHEMA
// ============================================================

const QuerySchema = z.object({
  campaignId: z.string().min(1, "Campaign identifier required"),
  horizon: z.coerce.number().min(7).max(180).default(30),
  confidence: z.coerce.number().min(0.8).max(0.99).default(0.95),
  includeSectorAnalysis: z.coerce.boolean().default(true),
  includeRiskMetrics: z.coerce.boolean().default(true),
});

// ============================================================
// SECTOR INTELLIGENCE
// ============================================================

const SECTOR_MAP: Record<string, string[]> = {
  technology: ['TECH', 'SEMI', 'SOFT', 'CLOUD'],
  financial: ['FIN', 'BANK', 'INS', 'ASSET'],
  consumer: ['CONS', 'RETL', 'HOSP', 'LUX'],
  energy: ['ENER', 'OILG', 'RENW', 'UTIL'],
  healthcare: ['HLTH', 'PHAR', 'BIOT', 'MEDT'],
  industrial: ['INDU', 'AERO', 'MANU', 'TRAN'],
  default: ['SOV', 'MARKET', 'CORP', 'INST']
};

const SECTOR_VOLATILITY_FACTORS: Record<string, number> = {
  TECH: 1.2, SEMI: 1.3, SOFT: 1.1, CLOUD: 1.15,
  FIN: 0.9, BANK: 1.0, INS: 0.85, ASSET: 0.95,
  CONS: 0.8, RETL: 0.9, HOSP: 0.75, LUX: 0.85,
  ENER: 1.1, OILG: 1.2, RENW: 1.0, UTIL: 0.7,
  HLTH: 0.85, PHAR: 0.9, BIOT: 1.1, MEDT: 0.95,
  INDU: 1.0, AERO: 1.05, MANU: 0.95, TRAN: 0.9,
  SOV: 0.8, MARKET: 1.0, CORP: 0.85, INST: 0.9
};

const HORIZON_FACTORS: Record<string, number> = {
  '1D': 0.3, '7D': 0.6, '30D': 1.0, '90D': 1.4
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getCampaignSectors(campaign: any): string[] {
  const industry = campaign?.organisation?.industry?.toLowerCase() || 'default';
  const matchingIndustry = Object.keys(SECTOR_MAP).find(key => 
    industry.includes(key) || (key === 'default' && !industry)
  );
  // ✅ FIX: Ensure we always return a valid string array with fallback
  const sectorKey = matchingIndustry || 'default';
  const sectors = SECTOR_MAP[sectorKey];
  return sectors || SECTOR_MAP.default;
}

function calculateVolatility(
  baseVolatility: number,
  sectorCode: string,
  horizon: string
): number {
  const sectorFactor = SECTOR_VOLATILITY_FACTORS[sectorCode] || 1.0;
  const horizonFactor = HORIZON_FACTORS[horizon] || 1.0;
  return Math.min(0.85, Number((baseVolatility * sectorFactor * horizonFactor).toFixed(4)));
}

function calculateConfidenceScore(forecast: any): number {
  if (!forecast) return 0.75;
  
  const mapeConfidence = Math.max(0, Math.min(0.3, 1 - (forecast.mape / 100)));
  const seasonalityConfidence = (forecast.seasonalityStrength || 0) * 0.3;
  const volatilityConfidence = Math.max(0, Math.min(0.2, 1 - (forecast.volatility || 0.5)));
  
  return Math.min(0.95, 0.5 + mapeConfidence + seasonalityConfidence + volatilityConfidence);
}

async function getPrismaClient() {
  if (typeof (db as any).$extends === 'function') return db;
  if (typeof (db as any).getPrismaClient === 'function') {
    return await (db as any).getPrismaClient();
  }
  return db;
}

// ============================================================
// MAIN HANDLER
// ============================================================

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authentication - Sovereign access required
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'SOVEREIGN_ACCESS_REQUIRED',
          message: 'Authentication required for executive intelligence',
          code: 'AUTH_401'
        },
        { status: 401 }
      );
    }

    // Query validation
    const { searchParams } = new URL(req.url);
    const validationResult = QuerySchema.safeParse({
      campaignId: searchParams.get('campaignId'),
      horizon: searchParams.get('horizon'),
      confidence: searchParams.get('confidence'),
      includeSectorAnalysis: searchParams.get('includeSectorAnalysis') === 'true',
      includeRiskMetrics: searchParams.get('includeRiskMetrics') === 'true',
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'INVALID_QUERY',
          message: validationResult.error.errors[0]?.message || 'Invalid query parameters',
          details: validationResult.error.errors,
          code: 'VALIDATION_400'
        },
        { status: 400 }
      );
    }

    const { 
      campaignId, 
      horizon, 
      confidence, 
      includeSectorAnalysis, 
      includeRiskMetrics 
    } = validationResult.data;

    // Database connection
    const prisma = await getPrismaClient();
    if (!prisma) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'REGISTRY_UNAVAILABLE',
          message: 'Sovereign Alignment Registry connection failed',
          code: 'DB_503'
        },
        { status: 503 }
      );
    }

    // Fetch campaign with organisation
    const campaign = await prisma.alignmentCampaign.findUnique({
      where: { id: campaignId },
      include: {
        organisation: { 
          select: { 
            id: true, 
            name: true, 
            industry: true, 
            tier: true,
            status: true 
          } 
        }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'CAMPAIGN_NOT_FOUND',
          message: `No alignment campaign found for: ${campaignId}`,
          code: 'NOTFOUND_404'
        },
        { status: 404 }
      );
    }

    // Generate executive report
    const reportService = ExecutiveReportService.getInstance();
    const report = await reportService.generateMarketAnalysisReport(campaignId, horizon);

    // Build sector volatility if requested
    let sectorVolatility: any[] = [];
    if (includeSectorAnalysis) {
      const sectors = getCampaignSectors(campaign);
      const horizons = ['1D', '7D', '30D', '90D'];
      const baseVolatility = report.baseline?.volatility || 0.25;
      const forecastConfidence = calculateConfidenceScore(report.forecast?.resonance);
      
      sectorVolatility = sectors.flatMap(sector => 
        horizons.map(h => ({
          sector,
          horizon: h,
          volatility: calculateVolatility(baseVolatility, sector, h),
          isHigh: calculateVolatility(baseVolatility, sector, h) > 0.45,
          confidence: forecastConfidence,
          factor: SECTOR_VOLATILITY_FACTORS[sector] || 1.0
        }))
      );
    }

    // Build enriched response
    const enrichedReport = {
      success: true,
      meta: {
        generatedAt: new Date().toISOString(),
        responseTimeMs: Date.now() - startTime,
        campaignId,
        organisation: campaign.organisation?.name || 'Sovereign Client',
        tier: campaign.organisation?.tier || 'Standard',
        protocol: PROTOCOL_VERSION,
        version: API_VERSION,
        node: NODE
      },
      executive: {
        state: report.state || 'ANALYZING',
        headline: report.narrative?.headline || 'Executive Intelligence Brief',
        summary: report.narrative?.summary || 'Market analysis and sovereign alignment report',
        mandate: report.narrative?.mandate || 'Review recommendations for strategic alignment'
      },
      forecast: {
        resonance: report.forecast?.resonance || null,
        humanCapital: report.forecast?.humanCapital || null,
        operationalEfficiency: report.forecast?.operationalEfficiency || null,
        confidence
      },
      baseline: {
        resonance: report.baseline?.resonance || 0,
        volatility: report.baseline?.volatility || 0,
        trend: report.baseline?.trend || 'stable',
        lowerBound: report.baseline?.lowerBound || 0,
        upperBound: report.baseline?.upperBound || 100
      },
      risk: includeRiskMetrics ? {
        earlyWarnings: (report.earlyWarnings || []).slice(0, 5),
        failureModes: (report.failureModes || []).slice(0, 3),
        contagionRisks: (report.contagionRisks || []).slice(0, 3),
        riskScore: report.riskScore || 'MODERATE'
      } : undefined,
      financial: {
        exposure: report.financialExposure || { 
          replacementCost: 0, 
          executionLoss: 0, 
          totalExposure: 0 
        },
        confidenceInterval: {
          lower: report.baseline?.lowerBound || 0,
          upper: report.baseline?.upperBound || 100,
          level: confidence
        }
      },
      ...(includeSectorAnalysis && {
        marketContext: {
          sectorVolatility,
          benchmark: {
            name: 'Sovereign Alignment Index',
            value: report.baseline?.resonance || 0,
            volatility: report.baseline?.volatility || 0
          }
        }
      }),
      recommendations: (report.recommendations || []).slice(0, 3)
    };

    // Async audit logging
    logExecutiveReportAudit({
      campaignId,
      actorId: session.user?.id || session.user?.email,
      organisationName: campaign.organisation?.name,
      report: { 
        state: report.state, 
        generatedAt: new Date().toISOString(),
        integrityIndex: report.baseline?.resonance || 0
      } as any
    }).catch(console.warn);

    // Return response
    return NextResponse.json(enrichedReport, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
        'X-Response-Time': (Date.now() - startTime).toString(),
        'X-Sovereign-Protocol': PROTOCOL_VERSION,
        'X-API-Version': API_VERSION,
        'X-Node': NODE,
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('[EXECUTIVE_REPORT_API]', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    const errorResponse = {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to generate executive intelligence report',
      code: 'ERR_500',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ============================================================
// CORS SUPPORT
// ============================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Sovereign-Key',
      'Access-Control-Max-Age': '86400'
    }
  });
}