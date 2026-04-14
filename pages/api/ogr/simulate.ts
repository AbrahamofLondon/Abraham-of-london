import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { calculateResonance, ResonanceResult } from "@/lib/ogr/simulation-engine";
import { 
  calculateHCDelta, 
  aggregateHCDMetrics, 
  calculateHCDContagion,
  type HCDMetrics,
  type HCDResult,
  type HCDAggregate,
  type HCDContagion
} from "@/lib/alignment/human-capital-delta";

// ============================================================================
// TYPES
// ============================================================================

interface OGRSimulateRequest {
  ids?: string[];
  metrics?: HCDMetrics[];
  includeHCD?: boolean;
  targetDomains?: string[];
}

interface OGRSimulateResponse {
  resonance?: ResonanceResult;
  hcd?: HCDResult[];
  hcdSummary?: HCDAggregate;
  contagion?: HCDContagion[];
  error?: string;
  message?: string;
}

// ============================================================================
// API HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OGRSimulateResponse>
) {
  // 1. Method validation
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // 2. Authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized: Sovereign access required." });
  }

  try {
    // 3. Parse and validate request body
    let body: OGRSimulateRequest;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ message: "Invalid JSON payload" });
    }

    const { ids, metrics, includeHCD = true, targetDomains = ["CULTURAL_COHESION", "TRUST_INDEX", "OPERATIONAL_CLARITY"] } = body;

    // 4. Prepare response object
    const response: OGRSimulateResponse = {};

    // 5. Calculate resonance from brief IDs (if provided)
    if (ids && Array.isArray(ids) && ids.length > 0) {
      try {
        const resonance = await calculateResonance(
          ids.map((id) => ({ id })),
          {
            includeConfidence: true,
            calculateBand: true,
          },
        );
        response.resonance = resonance;
      } catch (error) {
        console.error("[OGR_SIM] Resonance calculation failed:", error);
        // Continue without resonance data
      }
    }

    // 6. Calculate HCD metrics (if metrics provided)
    if (includeHCD && metrics && Array.isArray(metrics) && metrics.length > 0) {
      try {
        const hcdResults = calculateHCDelta(metrics);
        const hcdSummary = aggregateHCDMetrics(hcdResults);
        const contagion = calculateHCDContagion(hcdResults, targetDomains);

        response.hcd = hcdResults;
        response.hcdSummary = hcdSummary;
        response.contagion = contagion;

        // Optionally merge resonance with HCD data
        if (response.resonance) {
          // Add HCD context to resonance
          response.resonance = {
            ...response.resonance,
            // Map burnout to resonance for unified view
            hcdBurnoutIndex: hcdSummary.overallBurnoutIndex,
            hcdRiskScore: hcdSummary.riskScore,
          } as any;
        }
      } catch (error) {
        console.error("[OGR_SIM] HCD calculation failed:", error);
        // Continue without HCD data
      }
    }

    // 7. Return results
    return res.status(200).json(response);

  } catch (error) {
    console.error("[OGR_SIM_ERROR]:", error);
    return res.status(500).json({ 
      message: "Internal System Error during simulation.",
      error: process.env.NODE_ENV === "development" ? String(error) : undefined
    });
  }
}

// ============================================================================
// OPTIONAL: Extended simulation with batch processing
// ============================================================================

export async function batchOGRSimulation(
  simulations: Array<{ ids?: string[]; metrics?: HCDMetrics[] }>
): Promise<Array<OGRSimulateResponse>> {
  const results = await Promise.all(
    simulations.map(async ({ ids, metrics }) => {
      const response: OGRSimulateResponse = {};

      if (ids && ids.length > 0) {
        try {
          response.resonance = await calculateResonance(
            ids.map((id) => ({ id })),
            {
              includeConfidence: true,
              calculateBand: true,
            },
          );
        } catch (error) {
          console.error("[OGR_SIM_BATCH] Resonance failed:", error);
        }
      }

      if (metrics && metrics.length > 0) {
        try {
          const hcdResults = calculateHCDelta(metrics);
          response.hcd = hcdResults;
          response.hcdSummary = aggregateHCDMetrics(hcdResults);
          response.contagion = calculateHCDContagion(hcdResults, [
            "CULTURAL_COHESION", 
            "TRUST_INDEX", 
            "OPERATIONAL_CLARITY"
          ]);
        } catch (error) {
          console.error("[OGR_SIM_BATCH] HCD failed:", error);
        }
      }

      return response;
    })
  );

  return results;
}