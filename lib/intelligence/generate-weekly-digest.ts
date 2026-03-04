/* lib/intelligence/generate-weekly-digest.ts — Weekly Intelligence Digest Generator */
import "server-only";

import { getAuditLogger } from "@/lib/audit/audit-logger";
import { getFrameworkBySlug } from "@/lib/resources/strategic-frameworks";
import { generateInstitutionalPDF } from "@/lib/pdf/pdf-engine";

type DigestDossier = {
  title: string;
  logic: string;
  criticalRisks: unknown[];
  engagementScore: number;
};

type NormalizedLog = {
  action: string;
  resourceId: string;
};

function normalizeLog(input: unknown): NormalizedLog | null {
  if (!input || typeof input !== "object") return null;
  const r = input as Record<string, unknown>;

  const action = typeof r.action === "string" ? r.action : "";
  // Some loggers use resourceId / resource_id / targetId etc. Keep it resilient.
  const resourceId =
    typeof r.resourceId === "string"
      ? r.resourceId
      : typeof r.resource_id === "string"
        ? r.resource_id
        : typeof r.targetId === "string"
          ? r.targetId
          : "";

  if (!resourceId) return null;
  return { action, resourceId };
}

export async function generateWeeklyIntelligenceDigest(): Promise<Buffer> {
  const logger = getAuditLogger();

  // Ensure the DB connection is live before querying
  await logger.ensureInitialized();

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // 1) Fetch logs
  const logsRaw = await logger.query({
    startDate: oneWeekAgo,
    limit: 5000,
  });

  // 2) Normalize logs without unsafe casts
  const normalized: NormalizedLog[] = Array.isArray(logsRaw)
    ? (logsRaw as unknown[]).map(normalizeLog).filter((x): x is NormalizedLog => x !== null)
    : [];

  // 3) Score engagement
  const scores: Record<string, number> = {};

  for (const log of normalized) {
    const action = log.action;
    const resourceId = log.resourceId;

    let weight = 1;
    if (action === "BOARD_MEMO_PRINT") weight = 10;
    else if (action.includes("RISK")) weight = 5;

    scores[resourceId] = (scores[resourceId] || 0) + weight;
  }

  // 4) Select top 5 (deterministic)
  const topSlugs = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug]) => slug);

  // 5) Resolve frameworks
  const frameworks = topSlugs
    .map((slug) => getFrameworkBySlug(slug))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));

  const dossiers: DigestDossier[] = frameworks.map((f) => ({
    title: f.title,
    logic: f.operatingLogic?.[0]?.body || "No logic defined",
    criticalRisks: Array.isArray(f.failureModes) ? (f.failureModes.slice(0, 2) as unknown[]) : [],
    engagementScore: scores[f.slug] || 0,
  }));

  // If nothing scored, still generate a valid digest (brand consistency)
  if (dossiers.length === 0) {
    dossiers.push({
      title: "No High-Signal Intelligence This Week",
      logic:
        "Engagement signals did not meet the threshold for inclusion. Maintain cadence; watch for emerging patterns.",
      criticalRisks: [],
      engagementScore: 0,
    });
  }

  // 6) Structure data for PDF engine
  const digestData = {
    generatedAt: new Date().toISOString(),
    weekRange: `${oneWeekAgo.toLocaleDateString("en-GB")} - ${new Date().toLocaleDateString("en-GB")}`,
    dossiers,
  };

  // 7) Create artifact
  return await generateInstitutionalPDF(digestData, "WEEKLY_INTEL_DIGEST");
}