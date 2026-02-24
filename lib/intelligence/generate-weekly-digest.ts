/* lib/intelligence/generate-weekly-digest.ts */
import { getAuditLogger } from '@/lib/audit/audit-logger';
import { getFrameworkBySlug } from '@/lib/resources/strategic-frameworks';
import { generateInstitutionalPDF } from '@/lib/pdf/pdf-engine';

export async function generateWeeklyIntelligenceDigest(): Promise<Buffer> {
  const logger = getAuditLogger();
  
  // Ensure the DB connection is live before querying
  await logger.ensureInitialized();

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // 1. Fetch Logs - This now correctly maps to the logger facade
  const logs = await logger.query({
    startDate: oneWeekAgo,
    limit: 5000
  });

  // 2. Score Engagement (Systemic Weighting)
  const scores: Record<string, number> = {};
  
  // Handle case where logs might be undefined/empty
  const safeLogs = Array.isArray(logs) ? logs : [];

  safeLogs.forEach((log: any) => {
    let weight = 1;
    if (log.action === 'BOARD_MEMO_PRINT') weight = 10;
    if (log.action.includes('RISK')) weight = 5;
    
    // Ensure resourceId exists to avoid index errors
    if (log.resourceId) {
      scores[log.resourceId] = (scores[log.resourceId] || 0) + weight;
    }
  });

  // 3. Select Top 5
  const topSlugs = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([slug]) => slug);

  const frameworks = topSlugs
    .map(slug => getFrameworkBySlug(slug))
    .filter((f): f is NonNullable<typeof f> => f !== null);

  // 4. Structure Data for PDF Engine
  const digestData = {
    generatedAt: new Date().toISOString(),
    weekRange: `${oneWeekAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
    dossiers: frameworks.map(f => ({
      title: f.title,
      logic: f.operatingLogic?.[0]?.body || "No logic defined",
      criticalRisks: f.failureModes?.slice(0, 2) || [],
      engagementScore: scores[f.slug] || 0
    }))
  };

  // 5. Create Artifact
  return await generateInstitutionalPDF(digestData, 'WEEKLY_INTEL_DIGEST');
}