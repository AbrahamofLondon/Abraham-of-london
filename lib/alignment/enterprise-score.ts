// lib/alignment/enterprise-score.ts
import { ENTERPRISE_ALIGNMENT_QUESTIONS } from "@/lib/alignment/enterprise-checklist";
import type {
  EnterpriseAlignmentBand,
  EnterpriseAlignmentDomain,
  EnterpriseAssessmentResult,
  EnterpriseDomainScore,
  EnterpriseVarianceScore,
  FragilitySignal,
} from "@/lib/alignment/enterprise-types";

type EnterpriseAnswerMap = Record<string, boolean>;

type DomainAccumulator = {
  domain: EnterpriseAlignmentDomain;
  earned: number;
  possible: number;
  answered: number;
  unanswered: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundPercent(earned: number, possible: number): number {
  if (possible <= 0) return 0;
  return Math.round((earned / possible) * 100);
}

export function determineEnterpriseBand(
  percentScore: number,
): EnterpriseAlignmentBand {
  if (percentScore >= 85) return "ALIGNED";
  if (percentScore >= 65) return "DRIFTING";
  if (percentScore >= 45) return "MISALIGNED";
  return "DISORDERED";
}

function normaliseAnswers(input: Record<string, unknown>): EnterpriseAnswerMap {
  const out: EnterpriseAnswerMap = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (typeof value === "boolean") out[key] = value;
  }
  return out;
}

function buildQuestionIndex() {
  const seen = new Set<string>();

  for (const question of ENTERPRISE_ALIGNMENT_QUESTIONS) {
    if (seen.has(question.id)) {
      throw new Error(
        `[EnterpriseAssessment] Duplicate question id detected: "${question.id}"`,
      );
    }
    seen.add(question.id);
  }

  return ENTERPRISE_ALIGNMENT_QUESTIONS;
}

function buildDomainAccumulators(
  answers: EnterpriseAnswerMap,
): Map<EnterpriseAlignmentDomain, DomainAccumulator> {
  const grouped = new Map<EnterpriseAlignmentDomain, DomainAccumulator>();

  for (const question of buildQuestionIndex()) {
    const current = grouped.get(question.domain) ?? {
      domain: question.domain,
      earned: 0,
      possible: 0,
      answered: 0,
      unanswered: 0,
    };

    current.possible += 1;

    if (Object.prototype.hasOwnProperty.call(answers, question.id)) {
      current.answered += 1;
      if (answers[question.id] === true) current.earned += 1;
    } else {
      current.unanswered += 1;
    }

    grouped.set(question.domain, current);
  }

  return grouped;
}

function buildDomainScores(
  answers: EnterpriseAnswerMap,
): EnterpriseDomainScore[] {
  const grouped = buildDomainAccumulators(answers);

  return Array.from(grouped.values())
    .map((value) => ({
      domain: value.domain,
      earned: value.earned,
      possible: value.possible,
      percent: roundPercent(value.earned, value.possible),
    }))
    .sort((a, b) => {
      if (b.percent !== a.percent) return b.percent - a.percent;
      return String(a.domain).localeCompare(String(b.domain));
    });
}

function pickWeakestDomains(
  domainScores: EnterpriseDomainScore[],
  count = 2,
): EnterpriseAlignmentDomain[] {
  return [...domainScores]
    .sort((a, b) => {
      if (a.percent !== b.percent) return a.percent - b.percent;
      return String(a.domain).localeCompare(String(b.domain));
    })
    .slice(0, count)
    .map((item) => item.domain);
}

function pickStrongestDomains(
  domainScores: EnterpriseDomainScore[],
  count = 2,
): EnterpriseAlignmentDomain[] {
  return [...domainScores]
    .sort((a, b) => {
      if (b.percent !== a.percent) return b.percent - a.percent;
      return String(a.domain).localeCompare(String(b.domain));
    })
    .slice(0, count)
    .map((item) => item.domain);
}

function computeVariance(values: number[]): number {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map((value) => (value - avg) ** 2);
  return Math.round(Math.sqrt(mean(squaredDiffs)));
}

function computePolygonArea(scores: number[]): number {
  const numPoints = scores.length;
  if (numPoints < 3) return 0;

  const angleStep = (2 * Math.PI) / numPoints;
  let area = 0;

  for (let i = 0; i < numPoints; i++) {
    const r1 = scores[i] ?? 0;
    const r2 = scores[(i + 1) % numPoints] ?? 0;
    area += 0.5 * r1 * r2 * Math.sin(angleStep);
  }

  return Math.round(area);
}

function computeVarianceScores(
  domainScores: EnterpriseDomainScore[],
): EnterpriseVarianceScore[] {
  return domainScores.map((item) => ({
    domain: item.domain,
    variance: computeVariance([item.percent]),
  }));
}

function computeFragilitySignal(
  percentScore: number,
  weakestScores: EnterpriseDomainScore[],
): FragilitySignal {
  const lowest = weakestScores.length
    ? Math.min(...weakestScores.map((item) => item.percent))
    : 100;

  if (percentScore < 45 || lowest < 30) return "HIGH";
  if (percentScore < 65 || lowest < 50) return "MEDIUM";
  return "LOW";
}

export function scoreEnterpriseAssessment(
  rawAnswers: Record<string, unknown>,
): EnterpriseAssessmentResult {
  const answers = normaliseAnswers(rawAnswers);
  const questions = buildQuestionIndex();
  const possibleScore = questions.length;

  let totalScore = 0;
  for (const question of questions) {
    if (answers[question.id] === true) totalScore += 1;
  }

  const percentScore = roundPercent(totalScore, possibleScore);
  const domainScores = buildDomainScores(answers);
  const weakestDomains = pickWeakestDomains(domainScores);
  const strongestDomains = pickStrongestDomains(domainScores);
  const weakestScores = domainScores
    .filter((item) => weakestDomains.includes(item.domain))
    .slice(0, 2);

  const varianceScores = computeVarianceScores(domainScores);
  const fragilitySignal = computeFragilitySignal(percentScore, weakestScores);
  const dissonanceArea = clamp(
    computePolygonArea(domainScores.map((item) => item.percent / 5)),
    0,
    100000,
  );

  return {
    totalScore,
    possibleScore,
    percentScore,
    band: determineEnterpriseBand(percentScore),
    weakestDomains,
    strongestDomains,
    domainScores,
    varianceScores,
    fragilitySignal,
    dissonanceArea,
  };
}