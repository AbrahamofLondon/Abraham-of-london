/**
 * SOVEREIGN PREDICTIVE DIAGNOSTIC v4.0
 * USP: The "Managerial Effort Index" (MEI)
 * Calculates the exact cognitive load required for intervention based on cohort entropy.
 */

export interface DomainDiagnostic {
  domain: string;
  score: number;      // Resonance (The "What")
  friction: number;   // Variance (The "How hard to fix")
  effortIndex: number; // 0-100 (Managerial energy required)
  trajectory: 'STAGNANT' | 'IMPROVING' | 'DECAYING';
  recommendedAction: string;
  interventionScript: string; // The "What to say" for the manager
}

export function analyzeDomainTactics(responses: any[], historicalMean?: number): DomainDiagnostic[] {
  const domains = [...new Set(responses.map(r => r.domain))];

  return domains.map(domain => {
    const subset = responses.filter(r => r.domain === domain);
    const n = subset.length;
    
    const mean = subset.reduce((acc, r) => acc + r.resonance, 0) / n;
    const variance = subset.reduce((acc, r) => acc + Math.pow(r.resonance - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // USP Logic: Managerial Effort Index
    // Effort is higher when people disagree (Friction) than when they just have low scores.
    const effortIndex = Math.round((stdDev * 0.7) + ((100 - mean) * 0.3));

    // Trajectory Logic
    const trajectory = !historicalMean ? 'STAGNANT' : 
                       mean > historicalMean + 2 ? 'IMPROVING' : 
                       mean < historicalMean - 2 ? 'DECAYING' : 'STAGNANT';

    return {
      domain,
      score: Math.round(mean),
      friction: parseFloat(stdDev.toFixed(2)),
      effortIndex,
      trajectory,
      recommendedAction: getAction(mean, stdDev),
      interventionScript: getScript(domain, mean, stdDev)
    };
  });
}

function getAction(mean: number, stdDev: number): string {
  if (stdDev > 18) return "DE-ESCALATE & ALIGN"; // High disagreement
  if (mean < 40) return "RE-FOUNDATION";       // Low score, high agreement
  if (mean > 80 && stdDev < 10) return "AMPLIFY & REWARD";
  return "STABILIZE PROCESS";
}

function getScript(domain: string, mean: number, stdDev: number): string {
  if (stdDev > 18) return `Team, we have a diversity of perspective on ${domain}. I want to surface the conflicting views today to find a unified path forward.`;
  if (mean < 40) return `We are currently under-performing in ${domain}. This isn't a lack of effort, but a lack of shared infrastructure. Let's rebuild the baseline.`;
  return `Our ${domain} is stable. Let's identify the 1% improvement that moves us to elite status.`;
}