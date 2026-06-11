// pages/api/dashboard/risk-suppression.ts
// Returns the falsification / risk suppression ledger summary.
// Tracks active claims, monitoring status, and overturned positions.
// Zero-safe. No PII — counts and status labels only.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

export type RiskSuppressionData = {
  totalEntries: number;
  monitoring: number;       // status = MONITORING — active claims under observation
  confirmed: number;        // status = CONFIRMED — claim held after scrutiny
  overturned: number;       // status = OVERTURNED — claim revised under evidence
  pendingReview: number;    // reviewDate < now, status = MONITORING
  byProduct: {
    name: string;
    value: number;
  }[];
  generatedAt: string;
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<RiskSuppressionData | { error: string }>,
) {
  try {
    const now = new Date();

    const [
      totalEntries,
      monitoring,
      confirmed,
      overturned,
      pendingReview,
      grouped,
    ] = await Promise.all([
      prisma.falsificationEntry.count(),
      prisma.falsificationEntry.count({ where: { status: "MONITORING" } }),
      prisma.falsificationEntry.count({ where: { status: "CONFIRMED" } }),
      prisma.falsificationEntry.count({ where: { status: "OVERTURNED" } }),
      prisma.falsificationEntry.count({
        where: {
          status: "MONITORING",
          reviewDate: { lt: now },
        },
      }),
      prisma.falsificationEntry.groupBy({
        by: ["productCode"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 6,
      }),
    ]);

    const byProduct = grouped.map((g) => ({
      name: g.productCode,
      value: g._count.id,
    }));

    return res.status(200).json({
      totalEntries,
      monitoring,
      confirmed,
      overturned,
      pendingReview,
      byProduct,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[DASHBOARD_RISK_SUPPRESSION_ERROR]", error);
    return res.status(500).json({ error: "Failed to load risk suppression data" });
  }
}
