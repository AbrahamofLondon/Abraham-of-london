import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateInstitutionalIntegrity } from '@/lib/alignment/hardened-pulse-engine';

export async function GET() {
  try {
    const rawResponses = await prisma.response.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }
    });

    const integrity = calculateInstitutionalIntegrity(rawResponses);

    // Grouping by Domain for the Dissonance Matrix
    const domains = [...new Set(rawResponses.map(r => r.domain))];
    const domainScoresJson = domains.map(domain => {
      const domainResponses = rawResponses.filter(r => r.domain === domain);
      const metrics = calculateInstitutionalIntegrity(domainResponses);
      return {
        domain,
        percentScore: metrics.weightedResonance
      };
    });

    return NextResponse.json({
      respondentCount: integrity.nodeCount,
      percentScore: integrity.weightedResonance,
      band: integrity.weightedResonance > 75 ? 'ALIGNED' : 'FRAGMENTED',
      domainScoresJson,
      rawResponses: rawResponses.map(r => ({
        domain: r.domain,
        resonance: r.resonance,
        certainty: r.certainty
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Institutional Data Fetch Failed' }, { status: 500 });
  }
}