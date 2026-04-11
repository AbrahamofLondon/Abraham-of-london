export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { safePrismaQuery } from '@/lib/db';
import { calculateInstitutionalIntegrity } from '@/lib/alignment/hardened-pulse-engine';

export async function GET() {
  try {
    // 'response' model may not exist — use auditResponse as fallback
    const rawResponses = await safePrismaQuery<any[]>((p: any) =>
      (p.response ?? p.auditResponse)?.findMany?.({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }) ?? []
    ) ?? [];

    const integrity = calculateInstitutionalIntegrity(rawResponses);

    const domains = [...new Set(rawResponses.map((r: any) => r.domain))];
    const domainScoresJson = domains.map(domain => {
      const domainResponses = rawResponses.filter((r: any) => r.domain === domain);
      const metrics = calculateInstitutionalIntegrity(domainResponses);
      return {
        domain,
        percentScore: metrics.weightedResonance,
      };
    });

    return NextResponse.json({
      respondentCount: integrity.nodeCount,
      percentScore: integrity.weightedResonance,
      band: integrity.weightedResonance > 75 ? 'ALIGNED' : 'FRAGMENTED',
      domainScoresJson,
      rawResponses: rawResponses.map((r: any) => ({
        domain: r.domain,
        resonance: r.resonance,
        certainty: r.certainty,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Institutional Data Fetch Failed' }, { status: 500 });
  }
}
