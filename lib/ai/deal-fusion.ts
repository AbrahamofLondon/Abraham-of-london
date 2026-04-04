// lib/ai/deal-fusion.ts
// ============================================================================
// DEAL FUSION ENGINE v3.0 — THE SOVEREIGN PROTOCOL
// Refined for high-fidelity institutional vetting. 
// Adds: Proxy Authority, Whale-Tier scaling, and Multi-Signal Resonance.
// ============================================================================

export type DealRoute = "REJECT" | "DIAGNOSTIC" | "STRATEGY";
export type DealPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "SOVEREIGN";
export type FusionTemperature = "COLD" | "WARM" | "HOT" | "SCORCHING";

export interface DealFusionInput {
  ruleScore: number;           // 0-100
  aiScore: number;             // 0-100
  aiConfidence?: number;       // 0-1
  revenue?: number;            // numeric revenue
  authority?: string | boolean;
  urgency?: string;
  problem?: string;
  sessionDepth?: number;
  timeOnSite?: number;
  returnVisitor?: boolean;
}

export interface DealFusionResult {
  route: DealRoute;
  fusedScore: number;
  routeConfidence: number;
  priority: DealPriority;
  temperature: FusionTemperature;
  rationale: string[];
}

/** * HELPER UTILITIES 
 */
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const roundTo = (v: number, d = 2) => Number(v.toFixed(d));
const safeNumber = (v: unknown, f = 0): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : f;
  if (typeof v === "string") {
    const p = Number(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(p) ? p : f;
  }
  return f;
};

/**
 * ELEVATED LOGIC MODULES
 */

// Recognizes 'Strategic Proxies' (Chief of Staff, VP Strategy) as High Authority
function assessAuthority(value: unknown): { isDirect: boolean; isProxy: boolean } {
  const raw = String(value ?? "").trim().toLowerCase();
  const directTerms = ["founder", "owner", "ceo", "md", "decision maker", "true", "1", "yes"];
  const proxyTerms = ["chief of staff", "vp strategy", "head of operations", "special projects", "director"];
  
  return {
    isDirect: directTerms.includes(raw) || value === true,
    isProxy: proxyTerms.some(term => raw.includes(term))
  };
}

// Whale-Tier scaling for $10M+ deals
function revenueLift(rev: number): number {
  if (rev >= 10_000_000) return 12; // Whale Tier
  if (rev >= 5_000_000) return 8;
  if (rev >= 1_000_000) return 5;
  if (rev >= 250_000) return 2.5;
  return 0;
}

function problemDepth(p: string): { lift: number; keywordsFound: string[] } {
  const text = p.toLowerCase().trim();
  const keywords = ["scale", "execution", "alignment", "friction", "governance", "board", "restructure"];
  const found = keywords.filter(k => new RegExp(`\\b${k}\\b`).test(text));
  
  let lift = 0;
  if (text.length > 250) lift += 5;
  lift += (found.length * 1.5); // Reward density of complex terminology
  
  return { lift, keywordsFound: found };
}

/**
 * MAIN FUSION ENGINE
 */
export function fuseScores(input: DealFusionInput): DealFusionResult {
  const rationale: string[] = [];
  
  const ruleScore = clamp(safeNumber(input.ruleScore), 0, 100);
  const aiScore = clamp(safeNumber(input.aiScore), 0, 100);
  const aiConf = clamp(safeNumber(input.aiConfidence, 0.7), 0, 1);
  const revenue = safeNumber(input.revenue);
  const auth = assessAuthority(input.authority);

  // 1. DYNAMIC WEIGHTING (Resonance aware)
  const aiWeight = 0.2 + (aiConf * 0.3); // Max 0.5 weight to AI
  const ruleWeight = 1 - aiWeight;
  let fusedScore = (ruleScore * ruleWeight) + (aiScore * aiWeight);

  // 2. SIGNAL ACCRETION (The Lifts)
  const rLift = revenueLift(revenue);
  const pData = problemDepth(input.problem ?? "");
  const bLift = (safeNumber(input.sessionDepth) * 0.8) + (safeNumber(input.timeOnSite) / 120);

  fusedScore += rLift + pData.lift + clamp(bLift, 0, 10);

  // 3. AUTHORITY CORRECTION (The 10/10 Pivot)
  if (auth.isDirect) {
    fusedScore += 5;
    rationale.push("Direct Decision Authority confirmed (+5).");
  } else if (auth.isProxy) {
    fusedScore += 3;
    rationale.push("Strategic Proxy detected (High-level vetting) (+3).");
  } else {
    fusedScore -= 2; // Reduced penalty: don't kill the deal if revenue is high
    rationale.push("Authority unclear (-2).");
  }

  // 4. RESONANCE BONUS (Non-linear snap)
  // If Revenue is high AND Problem is complex, add 'Fit Resonance'
  if (revenue >= 1_000_000 && pData.keywordsFound.length >= 2) {
    fusedScore += 7;
    rationale.push("Signal Resonance: High-value problem matched with scale (+7).");
  }

  fusedScore = roundTo(clamp(fusedScore, 0, 100), 2);

  // 5. INFER OUTPUTS
  const route: DealRoute = (fusedScore >= 80 && (auth.isDirect || auth.isProxy)) ? "STRATEGY" : 
                           (fusedScore >= 55) ? "DIAGNOSTIC" : "REJECT";

  const priority: DealPriority = (revenue >= 10_000_000) ? "SOVEREIGN" :
                                 (fusedScore >= 85) ? "CRITICAL" :
                                 (fusedScore >= 70) ? "HIGH" : "MEDIUM";

  const temperature: FusionTemperature = (fusedScore >= 88) ? "SCORCHING" :
                                         (fusedScore >= 75) ? "HOT" : "WARM";

  // 6. ROUTE CONFIDENCE (Mathematical distance + AI certainty)
  const variance = Math.abs(ruleScore - aiScore);
  const routeConfidence = roundTo(clamp((aiConf * 40) + (100 - variance * 0.6), 0, 100));

  return {
    route,
    fusedScore,
    routeConfidence,
    priority,
    temperature,
    rationale: [...new Set(rationale)] // Deduplicate
  };
}