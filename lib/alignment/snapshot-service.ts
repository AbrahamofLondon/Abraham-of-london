import { prisma } from '@/lib/prisma';
import { calculateInstitutionalIntegrity } from '@/lib/alignment/hardened-pulse-engine';

export async function captureInstitutionalSnapshot(teamId?: string, label: string = "Scheduled Baseline") {
  // 1. Fetch current responses for the window
  const responses = await prisma.response.findMany({
    where: {
      teamId: teamId || undefined,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }
  });

  if (responses.length === 0) return null;

  // 2. Run the Hardened Integrity Engine
  const metrics = calculateInstitutionalIntegrity(responses);

  // 3. Map Domain Scores for JSON storage
  const domains = [...new Set(responses.map(r => r.domain))];
  const domainScoresJson = domains.map(domain => {
    const domainResponses = responses.filter(r => r.domain === domain);
    const m = calculateInstitutionalIntegrity(domainResponses);
    return { domain, percentScore: m.weightedResonance };
  });

  // 4. Persist the State
  return await prisma.snapshot.create({
    data: {
      teamId: teamId || "GLOBAL", // Use a reserved ID for institutional baseline
      label,
      weightedResonance: metrics.weightedResonance,
      standardError: metrics.standardError,
      reliabilityIndex: metrics.reliabilityIndex,
      nodeCount: metrics.nodeCount,
      dataJson: domainScoresJson
    }
  });
}