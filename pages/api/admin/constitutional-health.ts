import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Public-safe constitutional health posture.
 * Returns only healthBand, breach count band, route integrity posture,
 * and evidence posture. No raw scores, thresholds, or dimension names.
 */
export type ConstitutionalHealthPublicSafe = {
  healthBand: string;
  routeIntegrityPosture: string;
  breachCountBand: "NONE" | "LOW" | "MODERATE" | "HIGH";
  evidencePosture: string;
  generatedAt: string;
  thinState: boolean;
};

function deriveBreachBand(count: number): ConstitutionalHealthPublicSafe["breachCountBand"] {
  if (count === 0) return "NONE";
  if (count <= 2) return "LOW";
  if (count <= 7) return "MODERATE";
  return "HIGH";
}

function deriveRoutePosture(score: number): string {
  if (score >= 75) return "Strong";
  if (score >= 60) return "Acceptable";
  if (score >= 45) return "Under pressure";
  return "At risk";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { buildExecutiveCommandCentreData } = await import("@/lib/constitution/command-centre");
    const data = buildExecutiveCommandCentreData();

    const breachMetric = data.metrics.find((m) => m.id === "breaches");
    const routeMetric = data.metrics.find((m) => m.id === "route-integrity");
    const breachCount = breachMetric ? parseInt(breachMetric.value, 10) || 0 : 0;
    const routeScore = routeMetric ? parseInt(routeMetric.value, 10) || 0 : 0;

    const publicSafe: ConstitutionalHealthPublicSafe = {
      healthBand: data.healthBand,
      routeIntegrityPosture: deriveRoutePosture(routeScore),
      breachCountBand: deriveBreachBand(breachCount),
      evidencePosture: data.liveCases.length > 0 ? "SYSTEM_INFERRED" : "INSUFFICIENT_DATA",
      generatedAt: data.generatedAt,
      thinState: data.liveCases.length === 0 && data.metrics.every((m) => m.value === "0"),
    };

    return res.status(200).json(publicSafe);
  } catch {
    return res.status(200).json({
      healthBand: "WATCH",
      routeIntegrityPosture: "Insufficient data",
      breachCountBand: "NONE",
      evidencePosture: "INSUFFICIENT_DATA",
      generatedAt: new Date().toISOString(),
      thinState: true,
    } satisfies ConstitutionalHealthPublicSafe);
  }
}
