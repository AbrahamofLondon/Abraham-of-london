import { prisma } from '@/lib/prisma';
import { calculateInstitutionalIntegrity } from '@/lib/alignment/hardened-pulse-engine';

export async function generateExecutiveBriefing(teamId: string, interventionDate: Date) {
  // Fetch pre-intervention snapshot
  const preSnapshot = await prisma.snapshot.findFirst({
    where: { teamId, timestamp: { lte: interventionDate } },
    orderBy: { timestamp: 'desc' }
  });

  // Fetch current responses (last 14 days)
  const currentResponses = await prisma.response.findMany({
    where: { 
      teamId, 
      createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } 
    }
  });

  const post = calculateInstitutionalIntegrity(currentResponses);

  const resonanceDelta = post.weightedResonance - (preSnapshot?.weightedResonance || 0);
  const errorCompression = (preSnapshot?.standardError || 0) - post.standardError;

  // Determine status
  const governanceStatus = post.integrityStatus === 'STABLE' ? 'VERIFIED' : 'DEVIANT';

  // Generate narrative based on delta
  let narrative = '';
  if (resonanceDelta > 10) {
    narrative = "Strategic alignment stabilized; operational friction reduced.";
  } else if (resonanceDelta > 0) {
    narrative = "Modest improvement detected; continued monitoring advised.";
  } else if (resonanceDelta > -10) {
    narrative = "Stable but no material improvement; further intervention may be required.";
  } else {
    narrative = "Cohort remains in high-volatility state; immediate intervention required.";
  }

  return {
    metadata: {
      timestamp: new Date().toISOString(),
      governanceStatus,
      reportId: `SOV-AUDIT-${Math.random().toString(36).substring(7).toUpperCase()}`
    },
    performance: {
      resonanceLift: Number(resonanceDelta.toFixed(1)),
      volatilityReduction: Number(errorCompression.toFixed(2)),
      reliabilityIndex: post.reliabilityIndex
    },
    narrative
  };
}