import { prisma } from '@/lib/prisma';
import { calculateInstitutionalIntegrity } from '@/lib/alignment/hardened-pulse-engine';
import type { PulseResponse } from '@/lib/alignment/hardened-pulse-engine';

export async function captureInstitutionalSnapshot(campaignId?: string, label: string = "Scheduled Baseline") {
  // 1. Fetch current responses for the window — AuditResponse has campaignId, resonance, certainty
  const rawResponses = await prisma.auditResponse.findMany({
    where: {
      ...(campaignId ? { campaignId } : {}),
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }
  });

  if (rawResponses.length === 0) return null;

  // 2. Map to PulseResponse shape (AuditResponse has no domain field; default to "GENERAL")
  const responses: PulseResponse[] = rawResponses.map(r => ({
    domain: 'GENERAL',
    resonance: r.resonance,
    certainty: r.certainty,
  }));

  // 3. Run the Hardened Integrity Engine
  const metrics = calculateInstitutionalIntegrity(responses);

  // 4. Persist the State — use the actual OrganisationAssessmentSnapshot schema
  if (!campaignId) return null;

  return await prisma.organisationAssessmentSnapshot.create({
    data: {
      campaignId,
      organisationId: campaignId, // fallback: organisationId required; caller should pass real id
      respondentCount: metrics.nodeCount,
      invitedCount: metrics.nodeCount,
      completionRate: 100,
      totalScore: Math.round(metrics.weightedResonance),
      possibleScore: 100,
      percentScore: Math.round(metrics.weightedResonance),
      band: metrics.integrityStatus === 'STABLE' ? 'ALIGNED' : metrics.integrityStatus === 'UNSTABLE' ? 'DRIFTING' : 'DISORDERED',
      weakestDomainsJson: JSON.stringify([]),
      strongestDomainsJson: JSON.stringify([]),
      domainScoresJson: JSON.stringify([{ domain: 'GENERAL', percentScore: Math.round(metrics.weightedResonance) }]),
      varianceScoresJson: JSON.stringify([]),
      fragilitySignal: metrics.weightedResonance < 50 ? 'HIGH' : metrics.weightedResonance < 75 ? 'MEDIUM' : 'LOW',
    }
  });
}
