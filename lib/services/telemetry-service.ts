// lib/services/telemetry-service.ts
import { db } from '@/lib/db';
import { TelemetryData, TelemetryMetrics, CorrectionNode, AlignmentCampaign } from '@/lib/types/telemetry';

export class TelemetryService {
  private static instance: TelemetryService;
  private cache: TelemetryData | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  private calculateMetrics(nodes: CorrectionNode[], campaigns: AlignmentCampaign[]): TelemetryMetrics {
    const nodeCount = nodes.length;
    
    if (nodeCount === 0) {
      return {
        load: 0,
        friction: 0,
        dissonance: 0,
        burnoutIndex: 0,
        replacementLiability: 0,
        avgUtilization: 0
      };
    }

    const liquidated = nodes.filter(n => n.status === 'LIQUIDATED').length;
    const inProgress = nodes.filter(n => n.status === 'IN_PROGRESS').length;
    const open = nodes.filter(n => n.status === 'OPEN').length;

    // Validate calculations to prevent NaN
    const load = Number(((inProgress / nodeCount) * 100).toFixed(1));
    const friction = Number(((open / nodeCount) * 100).toFixed(1));
    const dissonance = Number(((nodeCount - liquidated) / nodeCount).toFixed(3));
    const burnoutIndex = Number(((inProgress / nodeCount) * 100).toFixed(1));
    const avgUtilization = Number(((liquidated / nodeCount) * 100).toFixed(1));
    
    // Replacement liability: $12,500 per open issue (industry standard)
    const replacementLiability = open * 12500;

    return {
      load: isNaN(load) ? 0 : load,
      friction: isNaN(friction) ? 0 : friction,
      dissonance: isNaN(dissonance) ? 0 : dissonance,
      burnoutIndex: isNaN(burnoutIndex) ? 0 : burnoutIndex,
      replacementLiability: isNaN(replacementLiability) ? 0 : replacementLiability,
      avgUtilization: isNaN(avgUtilization) ? 0 : avgUtilization
    };
  }

  private generateLogs(nodes: CorrectionNode[], campaigns: AlignmentCampaign[], metrics: TelemetryMetrics, resonance: number): string[] {
    const logs: string[] = [];
    const now = new Date();
    
    // System initialization log
    logs.push(`[${now.toISOString()}] SYSTEM: OGR core initialized`);
    
    // Node statistics
    const nodeCount = nodes.length;
    if (nodeCount > 0) {
      const liquidated = nodes.filter(n => n.status === 'LIQUIDATED').length;
      const inProgress = nodes.filter(n => n.status === 'IN_PROGRESS').length;
      const open = nodes.filter(n => n.status === 'OPEN').length;
      
      logs.push(`[${now.toISOString()}] TELEMETRY: ${nodeCount} correction nodes tracked`);
      logs.push(`[${now.toISOString()}] STATUS: ${liquidated} resolved | ${inProgress} in progress | ${open} open`);
    } else {
      logs.push(`[${now.toISOString()}] TELEMETRY: No active correction nodes`);
    }

    // Campaign statistics
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalParticipants = campaigns.reduce((sum, c) => sum + (c.participants?.length || 0), 0);
    
    if (activeCampaigns > 0) {
      logs.push(`[${now.toISOString()}] CAMPAIGNS: ${activeCampaigns} active | ${totalParticipants} participants`);
    }

    // Resonance status
    logs.push(`[${now.toISOString()}] RESONANCE: ${resonance}% - ${resonance >= 80 ? 'OPTIMAL' : resonance >= 60 ? 'STABLE' : 'CRITICAL'}`);

    // Add warnings for critical metrics
    if (metrics.friction > 70) {
      logs.push(`[${now.toISOString()}] WARNING: High friction detected (${metrics.friction}%)`);
    }
    
    if (metrics.dissonance > 0.3) {
      logs.push(`[${now.toISOString()}] WARNING: Elevated dissonance (${(metrics.dissonance * 100).toFixed(1)}%)`);
    }

    if (resonance < 60) {
      logs.push(`[${now.toISOString()}] ALERT: Systemic resonance below threshold - intervention required`);
    }

    // Add recent node activity (max 3)
    const recentNodes = [...nodes]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 3);

    for (const node of recentNodes) {
      const action = node.action?.substring(0, 50) || 'No action specified';
      logs.push(`[${now.toISOString()}] NODE: ${node.domain} - ${node.status} - ${action}`);
    }

    return logs.slice(0, 20); // Limit to 20 logs
  }

  async fetchTelemetry(): Promise<TelemetryData> {
    try {
      const prisma = typeof (db as any)?.getPrismaClient === "function"
        ? await (db as any).getPrismaClient()
        : db;

      if (!prisma) {
        throw new Error('Database connection unavailable');
      }

      // Parallel queries for performance
      const [nodes, campaigns] = await Promise.all([
        prisma.correctionNode.findMany({
          select: {
            id: true,
            status: true,
            domain: true,
            action: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { createdAt: 'desc' }
        }) as Promise<CorrectionNode[]>,
        
        prisma.alignmentCampaign.findMany({
          where: { status: 'active' },
          select: {
            id: true,
            status: true,
            participants: {
              where: { status: 'completed' },
              select: { id: true, status: true }
            }
          }
        }) as Promise<AlignmentCampaign[]>
      ]);

      // Calculate metrics
      const nodeCount = nodes.length;
      let resonance = 100;

      if (nodeCount > 0) {
        const liquidated = nodes.filter(n => n.status === 'LIQUIDATED').length;
        resonance = Number(((liquidated / nodeCount) * 100).toFixed(1));
        
        // Validate resonance is within bounds
        if (isNaN(resonance)) resonance = 0;
        if (resonance < 0) resonance = 0;
        if (resonance > 100) resonance = 100;
      }

      const activeNodes = nodes.filter(n => n.status === 'IN_PROGRESS').length;
      const metrics = this.calculateMetrics(nodes, campaigns);
      const logs = this.generateLogs(nodes, campaigns, metrics, resonance);

      const telemetryData: TelemetryData = {
        resonance,
        activeNodes,
        logs,
        metrics,
        timestamp: new Date().toISOString()
      };

      // Update cache
      this.cache = telemetryData;
      this.lastFetch = Date.now();

      return telemetryData;

    } catch (error) {
      console.error('[TelemetryService] Fetch failed:', error);
      
      // Return cached data if available
      if (this.cache && (Date.now() - this.lastFetch) < this.CACHE_TTL * 2) {
        return {
          ...this.cache,
          logs: [
            `[${new Date().toISOString()}] WARNING: Using cached telemetry data`,
            `[${new Date().toISOString()}] ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ...this.cache.logs.slice(0, 18)
          ]
        };
      }

      // Return minimal viable data if no cache
      return {
        resonance: 0,
        activeNodes: 0,
        logs: [
          `[${new Date().toISOString()}] ERROR: Telemetry service unavailable`,
          `[${new Date().toISOString()}] CAUSE: ${error instanceof Error ? error.message : 'Database connection failed'}`,
          `[${new Date().toISOString()}] ACTION: Check database connectivity`
        ],
        metrics: {
          load: 0,
          friction: 0,
          dissonance: 0,
          burnoutIndex: 0,
          replacementLiability: 0,
          avgUtilization: 0
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }
}