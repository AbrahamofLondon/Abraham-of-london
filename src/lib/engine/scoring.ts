import { 
  EnterpriseAssessmentResult, 
  EnterpriseLeadershipGap, 
  LeadershipGapView,
  EnterpriseAlignmentDomain 
} from "@/lib/services/database"; // Adjust path as needed

export function calculateLeadershipGap(
  assessments: any[] // EnterpriseAssessment[] from Prisma
): LeadershipGapView {
  const domains: EnterpriseAlignmentDomain[] = [
    "mandate_clarity",
    "decision_integrity",
    "environmental_coherence",
    "operational_discipline",
    "emotional_cultural_order",
    "legacy_continuity_orientation",
  ];

  const execs = assessments.filter((a) => a.isExecutive);
  const nonExecs = assessments.filter((a) => !a.isExecutive);

  if (execs.length === 0 || nonExecs.length === 0) {
    return { overallGapPercent: 0, domainGaps: [], interpretationFlags: ["Insufficient cohort data"] };
  }

  const domainGaps: EnterpriseLeadershipGap[] = domains.map((domain) => {
    const avgExec = getAverageForDomain(execs, domain);
    const avgNonExec = getAverageForDomain(nonExecs, domain);

    return {
      domain,
      executivePercent: Math.round(avgExec),
      nonExecutivePercent: Math.round(avgNonExec),
      delta: Math.round(avgExec - avgNonExec),
    };
  });

  const overallGap = domainGaps.reduce((acc, g) => acc + Math.abs(g.delta), 0) / domains.length;

  return {
    overallGapPercent: Math.round(overallGap),
    domainGaps,
    interpretationFlags: generateFlags(domainGaps),
  };
}

function getAverageForDomain(assessments: any[], domain: string): number {
  const scores = assessments.map((a) => {
    // Navigate the JSON structure we saved in the database
    const domainScore = (a.domainScoresJson as any[]).find((d) => d.domain === domain);
    return domainScore ? domainScore.percent : 0;
  });
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

function generateFlags(gaps: EnterpriseLeadershipGap[]): string[] {
  const flags: string[] = [];
  const highGaps = gaps.filter((g) => Math.abs(g.delta) > 20);
  
  if (highGaps.length > 0) flags.push("Significant Strategic Drift");
  if (gaps.some(g => g.delta < -5)) flags.push("Executive Underrating (Frontline Optimism)");
  
  return flags;
}