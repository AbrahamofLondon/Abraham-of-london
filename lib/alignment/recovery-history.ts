export async function getRecoveryComparison(teamId: string, preSnapshotId: string) {
  const pre = await prisma.snapshot.findUnique({ where: { id: preSnapshotId } });
  
  // Get current real-time state
  const currentResponses = await prisma.response.findMany({
    where: { teamId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
  });
  
  const post = calculateInstitutionalIntegrity(currentResponses);

  return {
    label: pre?.label,
    resonanceLift: post.weightedResonance - (pre?.weightedResonance || 0),
    precisionGain: (pre?.standardError || 0) - post.standardError,
    reliabilityDelta: post.reliabilityIndex - (pre?.reliabilityIndex || 0)
  };
}