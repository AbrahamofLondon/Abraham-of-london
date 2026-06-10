// pages/api/dashboard/outcome-distribution.ts
// Returns the distribution of decision outcome classifications
// from OutcomeVerificationRecord and ReturnBriefResponse.
// All data exists in the database.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

type OutcomeDistributionItem = {
  name: "Success" | "Partial" | "Failure";
  value: number;
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<OutcomeDistributionItem[] | { error: string }>,
) {
  try {
    // Source 1: OutcomeVerificationRecord.outcomeClassification
    const verificationRecords = await prisma.outcomeVerificationRecord.findMany({
      select: { outcomeClassification: true },
    });

    // Source 2: ReturnBriefResponse.outcomeClass
    const returnBriefResponses = await prisma.returnBriefResponse.findMany({
      select: { outcomeClass: true },
    });

    // Map outcome strings to the three categories
    function mapOutcome(label: string): "Success" | "Partial" | "Failure" {
      const lower = label.toLowerCase();
      if (
        lower.includes("success") ||
        lower.includes("resolved") ||
        lower.includes("positive") ||
        lower.includes("verified") ||
        lower.includes("fulfilled")
      ) {
        return "Success";
      }
      if (
        lower.includes("partial") ||
        lower.includes("mixed") ||
        lower.includes("in_progress") ||
        lower.includes("pending") ||
        lower.includes("monitoring")
      ) {
        return "Partial";
      }
      return "Failure";
    }

    const counts: Record<"Success" | "Partial" | "Failure", number> = {
      Success: 0,
      Partial: 0,
      Failure: 0,
    };

    for (const record of verificationRecords) {
      const category: "Success" | "Partial" | "Failure" = mapOutcome(record.outcomeClassification);
      counts[category]++;
    }

    for (const response of returnBriefResponses) {
      const category: "Success" | "Partial" | "Failure" = mapOutcome(response.outcomeClass);
      counts[category]++;
    }

    // If there's no data yet, return empty (the chart handles this gracefully)
    const distribution: OutcomeDistributionItem[] = [
      { name: "Success", value: counts.Success },
      { name: "Partial", value: counts.Partial },
      { name: "Failure", value: counts.Failure },
    ];

    return res.status(200).json(distribution);
  } catch (error) {
    console.error("[DASHBOARD_OUTCOME_DISTRIBUTION_ERROR]", error);
    return res.status(500).json({ error: "Failed to load outcome distribution" });
  }
}
