import { ENTERPRISE_ALIGNMENT_QUESTIONS } from "@/lib/alignment/enterprise-checklist";
import type {
  EnterpriseAlignmentBand,
  EnterpriseAlignmentDomain,
  EnterpriseAssessmentResult,
  EnterpriseDomainScore,
} from "@/lib/alignment/enterprise-types";

/**
 * Determines the strategic band based on percentage.
 * Now returns canonical Uppercase values.
 */
function determineEnterpriseBand(percentScore: number): EnterpriseAlignmentBand {
  if (percentScore >= 85) return "ALIGNED";
  if (percentScore >= 65) return "DRIFTING";
  if (percentScore >= 45) return "MISALIGNED";
  return "DISORDERED";
}

function roundPercent(earned: number, possible: number): number {
  if (possible <= 0) return 0;
  return Math.round((earned / possible) * 100);
}

function buildDomainScores(
  answers: Record<string, boolean>
): EnterpriseDomainScore[] {
  const grouped = new Map<
    EnterpriseAlignmentDomain,
    { earned: number; possible: number }
  >();

  // Use the questions to build the structure
  for (const question of ENTERPRISE_ALIGNMENT_QUESTIONS) {
    if (!grouped.has(question.domain)) {
      grouped.set(question.domain, { earned: 0, possible: 0 });
    }
    
    const current = grouped.get(question.domain)!;
    current.possible += 1;
    if (answers[question.id] === true) {
      current.earned += 1;
    }
  }

  return Array.from(grouped.entries()).map(([domain, value]) => ({
    domain,
    earned: value.earned,
    possible: value.possible,
    percent: roundPercent(value.earned, value.possible),
  }));
}

function pickWeakestDomains(
  domainScores: EnterpriseDomainScore[],
  count = 2
): EnterpriseAlignmentDomain[] {
  return [...domainScores]
    .sort((a, b) => a.percent - b.percent)
    .slice(0, count)
    .map((item) => item.domain);
}

function pickStrongestDomains(
  domainScores: EnterpriseDomainScore[],
  count = 2
): EnterpriseAlignmentDomain[] {
  return [...domainScores]
    .sort((a, b) => b.percent - a.percent)
    .slice(0, count)
    .map((item) => item.domain);
}

export function scoreEnterpriseAssessment(
  answers: Record<string, boolean>
): EnterpriseAssessmentResult {
  const possibleScore = ENTERPRISE_ALIGNMENT_QUESTIONS.length;

  const totalScore = ENTERPRISE_ALIGNMENT_QUESTIONS.reduce((sum, question) => {
    return sum + (answers[question.id] === true ? 1 : 0);
  }, 0);

  const percentScore = roundPercent(totalScore, possibleScore);
  const domainScores = buildDomainScores(answers);

  return {
    totalScore,
    possibleScore,
    percentScore,
    band: determineEnterpriseBand(percentScore),
    weakestDomains: pickWeakestDomains(domainScores),
    strongestDomains: pickStrongestDomains(domainScores),
    domainScores,
  };
}