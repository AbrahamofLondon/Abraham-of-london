/* lib/intelligence/generate-weekly-digest.ts */
import { getAuditLogger } from '@/lib/audit/audit-logger';
import { getFrameworkBySlug } from '@/lib/resources/strategic-frameworks';
import { generateInstitutionalPDF } from '@/lib/pdf/pdf-engine';

export async function generateWeeklyIntelligenceDigest() {
  const logger = getAuditLogger();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // 1. Fetch Logs for the last 7 days
  const logs = await logger.query({
    startDate: oneWeekAgo,
    limit: 5000
  });

  // 2. Score Engagement (Systemic Weighting)
  const scores: Record<string, number> = {};
  logs.forEach(log => {
    let weight = 1; // Default VIEW
    if (log.action === 'BOARD_MEMO_PRINT') weight = 10;
    if (log.action.includes('RISK')) weight = 5;
    
    scores[log.resourceId] = (scores[log.resourceId] || 0) + weight;
  });

  // 3. Select Top 5 Dossiers
  const topSlugs = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([slug]) => slug);

  const frameworks = topSlugs
    .map(slug => getFrameworkBySlug(slug))
    .filter(Boolean);

  // 4. Generate the Digest
  const digestData = {
    generatedAt: new Date().toISOString(),
    weekRange: `${oneWeekAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
    dossiers: frameworks.map(f => ({
      title: f.title,
      logic: f.operatingLogic[0]?.body,
      criticalRisks: f.failureModes.slice(0, 2),
      engagementScore: scores[f.slug]
    }))
  };

  // 5. Create PDF Artifact
  return await generateInstitutionalPDF(digestData, 'WEEKLY_INTEL_DIGEST');
}