import { prisma } from '@/lib/prisma';
import { calculateInstitutionalIntegrity } from '@/lib/alignment/hardened-pulse-engine';
import type { PulseResponse } from '@/lib/alignment/hardened-pulse-engine';

export async function generateExecutiveBriefing(teamId: string, interventionDate: Date) {
  // Fetch pre-intervention snapshot (keyed by campaignId since teamId is not on this model)
  const preSnapshot = await prisma.organisationAssessmentSnapshot.findFirst({
    where: { organisationId: teamId },
    orderBy: { generatedAt: 'desc' }
  });

  // Fetch current responses (last 14 days) — AuditResponse has campaignId, resonance, certainty
  const rawResponses = await prisma.auditResponse.findMany({
    where: {
      campaignId: teamId,
      createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
    }
  });

  // Map to PulseResponse shape (domain defaults to "GENERAL" since AuditResponse has no domain)
  const currentResponses: PulseResponse[] = rawResponses.map(r => ({
    domain: 'GENERAL',
    resonance: r.resonance,
    certainty: r.certainty,
  }));

  const post = calculateInstitutionalIntegrity(currentResponses);

  const preWeightedResonance = preSnapshot ? preSnapshot.percentScore : 0;
  const resonanceDelta = post.weightedResonance - preWeightedResonance;
  const errorCompression = 0 - (100 - post.reliabilityIndex);

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
