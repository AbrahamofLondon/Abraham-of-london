export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PredictiveIntelligenceService } from '@/lib/predictive/services/predictive-intelligence';
import { TimeSeriesPoint } from '@/lib/predictive/types';
import { z } from 'zod';

const QuerySchema = z.object({
  horizon: z.coerce.number().min(7).max(180).default(90),
  confidence: z.coerce.number().min(0.8).max(0.99).default(0.95),
  includeScenarios: z.coerce.boolean().default(true),
  includeRecommendations: z.coerce.boolean().default(true)
});

function buildResonanceTimeSeries(nodes: any[]): TimeSeriesPoint[] {
  const nodeStatusByDate = new Map<string, { resolved: number; total: number }>();
  
  for (const node of nodes) {
    const dateKey = node.createdAt.toISOString().split('T')[0];
    const current = nodeStatusByDate.get(dateKey) || { resolved: 0, total: 0 };
    
    if (node.status === 'LIQUIDATED') {
      current.resolved++;
    }
    current.total++;
    nodeStatusByDate.set(dateKey, current);
  }
  
  const result: TimeSeriesPoint[] = [];
  for (const [date, data] of nodeStatusByDate) {
    const resonance = data.total > 0 ? (data.resolved / data.total) * 100 : 100;
    result.push({
      timestamp: new Date(date),
      value: Math.min(100, Math.max(0, resonance))
    });
  }
  
  return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function buildBurnoutTimeSeries(participants: any[]): TimeSeriesPoint[] {
  const burnoutByDate = new Map<string, number[]>();
  
  for (const participant of participants) {
    const dateKey = participant.updatedAt.toISOString().split('T')[0];
    let burnoutScore = 50;
    
    if (participant.responses && participant.responses.length > 0) {
      burnoutScore = participant.responses.reduce((sum: number, r: any) => {
        const value = r.data?.burnoutIndex || r.burnoutIndex || 50;
        return sum + (typeof value === 'number' ? value : 50);
      }, 0) / participant.responses.length;
    }
    
    const scores = burnoutByDate.get(dateKey) || [];
    scores.push(burnoutScore);
    burnoutByDate.set(dateKey, scores);
  }
  
  const result: TimeSeriesPoint[] = [];
  for (const [date, scores] of burnoutByDate) {
    const avgBurnout = scores.reduce((a, b) => a + b, 0) / scores.length;
    result.push({
      timestamp: new Date(date),
      value: Math.min(100, Math.max(0, avgBurnout))
    });
  }
  
  return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { campaignId } = await params;
    const url = new URL(request.url);
    const query = QuerySchema.parse({
      horizon: url.searchParams.get('horizon'),
      confidence: url.searchParams.get('confidence'),
      includeScenarios: url.searchParams.get('includeScenarios'),
      includeRecommendations: url.searchParams.get('includeRecommendations')
    });
    
    const prismaPromise = typeof (db as any)?.getPrismaClient === 'function'
      ? (db as any).getPrismaClient()
      : Promise.resolve(db);
    
    const prisma = await Promise.race([
      prismaPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 5000))
    ]);
    
    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }
    
    const [campaign, correctionNodes, participants] = await Promise.all([
      prisma.alignmentCampaign.findUnique({
        where: { id: campaignId },
        select: { id: true, name: true, organisation: { select: { name: true } } }
      }),
      prisma.correctionNode.findMany({
        where: { campaignId },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true, status: true, recoveryProjection: true }
      }),
      prisma.participant.findMany({
        where: { campaignId, status: 'completed' },
        orderBy: { updatedAt: 'asc' },
        include: { responses: true }
      })
    ]);
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    const historicalResonance = buildResonanceTimeSeries(correctionNodes);
    const historicalBurnout = buildBurnoutTimeSeries(participants);
    
    if (historicalResonance.length < 14) {
      return NextResponse.json({
        error: 'Insufficient historical data',
        message: `Need at least 14 data points, have ${historicalResonance.length}`,
        requiredPoints: 14,
        availablePoints: historicalResonance.length
      }, { status: 422 });
    }
    
    const predictiveService = PredictiveIntelligenceService.getInstance();
    const insight = await predictiveService.generateInsight(
      campaignId,
      {
        resonance: historicalResonance,
        dissonance: historicalResonance.map(r => ({ ...r, value: 100 - r.value })),
        burnout: historicalBurnout,
        certainty: historicalResonance.map(r => ({ ...r, value: r.value * 0.85 }))
      },
      {
        resonance: historicalResonance[historicalResonance.length - 1]?.value || 100,
        dissonance: 100 - (historicalResonance[historicalResonance.length - 1]?.value || 100),
        burnoutIndex: historicalBurnout[historicalBurnout.length - 1]?.value || 50,
        sovereignCertainty: (historicalResonance[historicalResonance.length - 1]?.value || 100) * 0.85
      },
      {
        horizon: query.horizon,
        confidence: query.confidence,
        includeScenarios: query.includeScenarios,
        includeRecommendations: query.includeRecommendations
      }
    );
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      campaignId,
      insight,
      meta: {
        responseTimeMs: responseTime,
        dataPoints: {
          resonance: historicalResonance.length,
          burnout: historicalBurnout.length
        },
        query
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300',
        'X-Response-Time': responseTime.toString(),
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('[PredictiveAPI] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid query parameters', 
        details: error.errors 
      }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate predictive insight';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}