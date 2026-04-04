// pages/api/ogr/simulate.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { calculateResonance } from "@/lib/ogr/simulation-engine";
import { 
  calculateHCDelta, 
  aggregateHCDMetrics, 
  calculateHCDContagion,
  type HCDMetrics
} from "@/lib/alignment/human-capital-delta";

interface SimulationRequest {
  ids?: string[];
  metrics?: HCDMetrics[];
}

interface SimulationResponse {
  resonance?: any;
  hcd?: any[];
  summary?: any;
  contagion?: any[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SimulationResponse>
) {
  // 1. Method validation
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 2. Authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized: Sovereign access required." });
  }

  try {
    // 3. Parse request body
    let body: SimulationRequest;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: "Invalid JSON payload" });
    }

    const { ids, metrics } = body;
    const response: SimulationResponse = {};

    // 4. Calculate resonance from brief IDs (if provided)
    if (ids && Array.isArray(ids) && ids.length > 0) {
      try {
        const resonance = await calculateResonance(ids, {
          includeConfidence: true,
          calculateBand: true,
        });
        response.resonance = resonance;
      } catch (error) {
        console.error("[OGR_SIM] Resonance calculation failed:", error);
      }
    }

    // 5. Calculate HCD metrics (if metrics provided)
    if (metrics && Array.isArray(metrics) && metrics.length > 0) {
      try {
        const hcdResults = calculateHCDelta(metrics);
        const summary = aggregateHCDMetrics(hcdResults);
        const contagion = calculateHCDContagion(hcdResults, [
          "CULTURAL_COHESION",
          "TRUST_INDEX",
          "OPERATIONAL_CLARITY",
          "STRATEGIC_INTENT"
        ]);

        response.hcd = hcdResults;
        response.summary = summary;
        response.contagion = contagion;

        // If resonance wasn't calculated from briefs, map burnout to resonance
        if (!response.resonance && summary.overallBurnoutIndex) {
          response.resonance = {
            resonance: Math.max(0.05, Math.min(0.95, 1 - (summary.overallBurnoutIndex / 100))),
            friction: summary.averageUtilization,
            complexity: summary.overallFragilityIndex / 100,
            stability: 1 - (summary.overallFragilityIndex / 100),
            count: metrics.length,
            confidence: Math.max(0, Math.min(100, 100 - summary.overallBurnoutIndex)),
            band: summary.riskScore === "CRITICAL" ? "CRITICAL" : 
                  summary.riskScore === "ELEVATED" ? "WARNING" : 
                  summary.riskScore === "MODERATE" ? "STABLE" : "OPTIMAL",
            classification: summary.riskScore === "CRITICAL" ? "DISORDERED" :
                           summary.riskScore === "ELEVATED" ? "DRIFTING" :
                           summary.riskScore === "MODERATE" ? "ALIGNED" : "RESONANT",
          };
        }
      } catch (error) {
        console.error("[OGR_SIM] HCD calculation failed:", error);
      }
    }

    // 6. Validate we have at least some data to return
    if (!response.resonance && !response.hcd) {
      return res.status(400).json({ 
        error: "Insufficient data: Provide either 'ids' or 'metrics' for simulation." 
      });
    }

    // 7. Return successful response
    return res.status(200).json(response);

  } catch (error) {
    console.error("[OGR_SIM_ERROR]:", error);
    return res.status(500).json({ 
      error: "Internal System Error during simulation." 
    });
  }
}

export async function calculateResonance(
  ids: string[],
  options?: { includeConfidence?: boolean; calculateBand?: boolean }
) {
  // Your implementation here
  // This is a placeholder - implement based on your actual logic
  return {
    resonance: 0.75,
    friction: 25,
    complexity: 30,
    stability: 70,
    count: ids.length,
    confidence: 85,
    band: "STABLE",
    classification: "ALIGNED",
  };
}