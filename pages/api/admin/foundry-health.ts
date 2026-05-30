/* pages/api/admin/foundry-health.ts — FOUNDRY USEFULNESS METRICS
 *
 * Returns product health metrics for the public proof layer:
 *   - Decision type distribution
 *   - Constraint detection rate (financial constraint flag)
 *   - Professional help status distribution
 *   - Urgency distribution
 *   - Source test distribution
 *   - High-constraint cases (cannot_afford + high urgency)
 *   - Recent 7-day submission volume
 *
 * Uses $queryRaw to remain compatible with a stale Prisma client
 * (new columns added via SQL migration; types regenerate on next prisma generate).
 *
 * Admin-only. No mutation. No raw PII in response.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import { requireAdmin } from "@/lib/access/require-admin";

type DistributionEntry = { label: string; count: number };

type HealthResponse =
  | {
      ok: true;
      period: string;
      totalSubmissions: number;
      recentCount7d: number;
      constraintRate: number;
      highConstraintCases: number;
      decisionTypeDistribution: DistributionEntry[];
      urgencyDistribution: DistributionEntry[];
      professionalHelpDistribution: DistributionEntry[];
      sourceTestDistribution: DistributionEntry[];
    }
  | { ok: false; error: string };

function toDistribution(rows: Array<{ label: string | null; cnt: bigint | number }>): DistributionEntry[] {
  return rows.map(r => ({ label: r.label ?? "(not set)", count: Number(r.cnt) }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalRows,
      recentRows,
      constraintRows,
      highConstraintRows,
      byDecisionType,
      byUrgency,
      byProfHelp,
      bySource,
    ] = await Promise.all([
      prisma.$queryRaw<[{ cnt: bigint }]>`
        SELECT COUNT(*) AS cnt FROM "foundry_interest"
      `,
      prisma.$queryRaw<[{ cnt: bigint }]>`
        SELECT COUNT(*) AS cnt FROM "foundry_interest"
        WHERE "createdAt" >= ${sevenDaysAgo}
      `,
      prisma.$queryRaw<[{ cnt: bigint }]>`
        SELECT COUNT(*) AS cnt FROM "foundry_interest"
        WHERE "hasFinancialConstraint" = true
      `,
      prisma.$queryRaw<[{ cnt: bigint }]>`
        SELECT COUNT(*) AS cnt FROM "foundry_interest"
        WHERE "professionalHelpStatus" = 'cannot_afford'
          AND "urgency" IN ('High', 'Board-sensitive')
      `,
      prisma.$queryRaw<Array<{ label: string | null; cnt: bigint }>>`
        SELECT "decisionType" AS label, COUNT(*) AS cnt
        FROM "foundry_interest"
        GROUP BY "decisionType"
        ORDER BY cnt DESC
      `,
      prisma.$queryRaw<Array<{ label: string | null; cnt: bigint }>>`
        SELECT "urgency" AS label, COUNT(*) AS cnt
        FROM "foundry_interest"
        GROUP BY "urgency"
        ORDER BY cnt DESC
      `,
      prisma.$queryRaw<Array<{ label: string | null; cnt: bigint }>>`
        SELECT "professionalHelpStatus" AS label, COUNT(*) AS cnt
        FROM "foundry_interest"
        GROUP BY "professionalHelpStatus"
        ORDER BY cnt DESC
      `,
      prisma.$queryRaw<Array<{ label: string | null; cnt: bigint }>>`
        SELECT "sourceTest" AS label, COUNT(*) AS cnt
        FROM "foundry_interest"
        GROUP BY "sourceTest"
        ORDER BY cnt DESC
      `,
    ]);

    const total = Number(totalRows[0]?.cnt ?? 0);
    const withConstraint = Number(constraintRows[0]?.cnt ?? 0);

    return res.status(200).json({
      ok: true,
      period: "all time",
      totalSubmissions: total,
      recentCount7d: Number(recentRows[0]?.cnt ?? 0),
      constraintRate: total > 0 ? Math.round((withConstraint / total) * 100) : 0,
      highConstraintCases: Number(highConstraintRows[0]?.cnt ?? 0),
      decisionTypeDistribution: toDistribution(byDecisionType),
      urgencyDistribution: toDistribution(byUrgency),
      professionalHelpDistribution: toDistribution(byProfHelp),
      sourceTestDistribution: toDistribution(bySource),
    });
  } catch (error) {
    console.error("[foundry-health]", error);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}
