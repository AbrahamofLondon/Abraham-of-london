/**
 * Pattern Reading Engine — extracted from PurposeAlignmentAssessment.
 *
 * The core synthesis layer: reads specific pattern of scores and produces
 * a diagnosis tied to what the person actually answered. Not generic band text.
 */

import type { AlignmentDomain, DualAxisAnswer, PurposeProfileResult } from "./types";
import { PURPOSE_ALIGNMENT_QUESTIONS } from "./checklist";

export type ScoredStatement = {
  id: string;
  domain: AlignmentDomain;
  statement: string;
  resonance: number;
  certainty: number;
  weighted: number;
  gap: number;
};

export type PatternReading = {
  primaryPattern: string;
  patternTitle: string;
  urgentStatement: string | null;
  uncertaintyNote: string | null;
  firstAction: string;
  escalationNote: string;
  weakestDomain: AlignmentDomain;
  sharpestSignal?: { statement: string; resonance: number; certainty: number } | null;
};

const ACTION_MAP: Record<AlignmentDomain, string> = {
  identity: "Rewrite your current mandate in one sentence. Not what you want it to be — what it actually is, evidenced by how your last 30 days have been spent. Then identify one commitment that contradicts it.",
  decision: "Retrieve the last five decisions of consequence you made in the past 60 days. For each one, note whether it was made from principle or from pressure. The pattern is the diagnosis.",
  environment: "List every regular input — relationships, information sources, recurring meetings — that produced confusion, doubt, or diffusion of focus in the last quarter. Remove the highest-cost one.",
  behaviour: "Open your calendar for the last two weeks and mark every block that directly served your stated long-term outcomes. Everything else is the gap between intention and operation.",
  emotional_order: "Track your response time and decision quality under stress for seven consecutive days. Do not attempt to change anything yet — the first step is accurate observation, not correction.",
  legacy: "Name the one structure — not a goal, a structure — that you are building which must outlast your current season. If you cannot name it, that is the diagnosis.",
};

export function derivePatternReading(
  answers: Record<string, DualAxisAnswer>,
  result: PurposeProfileResult,
): PatternReading {
  // If intelligence engine already produced a reading, use it
  if (result.primaryPattern && (result as any).reportNarrative) {
    const rn = (result as any).reportNarrative;
    return {
      primaryPattern: [rn.conditionStatement, rn.classificationExplanation, rn.contradictionExplanation, rn.consequenceBlock, rn.nextStepBlock].join(" "),
      patternTitle: result.primaryPattern.label,
      urgentStatement: (result as any).evidence?.sharpestWeakSignal
        ? `"${(result as any).evidence.sharpestWeakSignal.statement}" — ${(result as any).evidence.sharpestWeakSignal.resonance}/10 resonance with ${(result as any).evidence.sharpestWeakSignal.certainty}/10 certainty. This is the sharpest weak evidence in the profile.`
        : null,
      uncertaintyNote: result.contradictions?.length ? result.contradictions.map((item) => item.evidence).join(" ") : null,
      firstAction: result.firstAction ?? rn.firstActionBlock,
      escalationNote: (result as any).routingRecommendation?.reason ?? rn.nextStepBlock,
      weakestDomain: result.weakestDomains[0] ?? "identity",
      sharpestSignal: (result as any).evidence?.sharpestWeakSignal,
    };
  }

  // Score every answered statement
  const scored: ScoredStatement[] = PURPOSE_ALIGNMENT_QUESTIONS
    .filter((q) => answers[q.id])
    .map((q) => {
      const a = answers[q.id]!;
      return {
        id: q.id,
        domain: q.domain,
        statement: q.statement,
        resonance: a.resonance,
        certainty: a.certainty,
        weighted: a.resonance * (a.certainty / 10),
        gap: a.resonance - a.certainty,
      };
    });

  const lowest = [...scored].sort((a, b) => a.weighted - b.weighted)[0] ?? null;
  const strongest = [...scored].sort((a, b) => b.weighted - a.weighted)[0] ?? null;
  const acknowledgedProblems = scored.filter((s) => s.resonance < 5 && s.certainty >= 6).sort((a, b) => a.resonance - b.resonance);
  const unexaminedWeakness = scored.filter((s) => s.resonance <= 5 && s.certainty <= 4).sort((a, b) => a.weighted - b.weighted);

  const weakestDomain = result.weakestDomains[0] ?? "identity";
  const secondWeakest = result.weakestDomains[1] ?? "decision";
  const highVariance = result.domainProfiles.some((d) => d.percent >= 70) && result.domainProfiles.some((d) => d.percent < 40);

  let primaryPattern = "";
  let patternTitle = "";

  const wkPct = result.domainProfiles.find((d) => d.domain === weakestDomain)?.percent ?? 0;
  const skPct = result.domainProfiles.find((d) => d.domain === secondWeakest)?.percent ?? 0;
  const bandWord = result.coherenceBand === "FRAGMENTED" ? "fragmented" : result.coherenceBand === "DRIFTING" ? "drifting" : result.coherenceBand === "ALIGNED" ? "aligned" : "sovereign";

  if (weakestDomain === "identity" || weakestDomain === "decision") {
    if (weakestDomain === "identity" && secondWeakest === "decision") {
      patternTitle = "Mandate without architecture";
      primaryPattern = `Your alignment reads as ${bandWord}. This is not a motivation problem or a capability problem — it is a direction problem. Identity scored ${wkPct}% and Decision Integrity scored ${skPct}%. Together, these create a specific condition: decisions are being made, but not from a coherent centre. The downstream effect is predictable — where time and money go will keep drifting from what you say matters.`;
    } else if (weakestDomain === "identity") {
      patternTitle = "Unclear mandate driving downstream confusion";
      primaryPattern = `Your alignment reads as ${bandWord}, with Identity & Mandate at ${wkPct}% — the lowest in your profile. This is the root layer. When identity is unclear, everything downstream becomes harder to prioritise. The pattern is not poor decisions individually — it is decisions that do not cohere over time, because they are not anchored to a stable mandate.`;
    } else {
      patternTitle = "Principled intent, pressure-driven execution";
      primaryPattern = `Your alignment reads as ${bandWord}. You know what you stand for — Identity is relatively strong — but Decision Integrity scored ${wkPct}%. This is the pattern of someone whose values are clear but whose recent decisions do not reflect them under pressure. The gap between stated principle and actual choices is the structural problem.`;
    }
  } else if (weakestDomain === "environment" || weakestDomain === "behaviour") {
    if (weakestDomain === "environment" && secondWeakest === "behaviour") {
      patternTitle = "Environmental drag producing behavioural erosion";
      primaryPattern = `Your alignment reads as ${bandWord}. Environment scored ${wkPct}% and Behaviour scored ${skPct}%. The environment is not reinforcing your direction — and the behavioural evidence confirms it. Even clear intention will struggle to hold when operating conditions produce friction faster than discipline can absorb.`;
    } else if (weakestDomain === "environment") {
      patternTitle = "Environment working against direction";
      primaryPattern = `Your alignment reads as ${bandWord}, with Environmental Alignment at ${wkPct}%. The relationships, inputs, and operating contexts around you are not reinforcing your stated direction. This is a structural problem, not a willpower problem. You cannot consistently outperform an environment that is working against you.`;
    } else {
      patternTitle = "Declared priorities not reflected in daily operation";
      primaryPattern = `Your alignment reads as ${bandWord}. Operational Behaviour scored ${wkPct}% — the most observable domain in the system. The calendar, habits, and measurable output are not tracking with stated purpose. This is where intention meets evidence: it shows up in how time is actually spent.`;
    }
  } else if (weakestDomain === "emotional_order") {
    patternTitle = "Internal instability constraining strategic capacity";
    primaryPattern = `Your alignment reads as ${bandWord}, with Emotional & Internal Order at ${wkPct}%. Under-regulation here is expensive — reactive decisions, dependency on external validation, slow recovery from disruption. These costs do not appear on any report but they determine the quality of everything else.`;
  } else if (weakestDomain === "legacy") {
    patternTitle = "Operating in the immediate at the expense of the structural";
    primaryPattern = `Your alignment reads as ${bandWord}, with Legacy Orientation at ${wkPct}%. The operating posture is weighted toward managing the present rather than building what outlasts it. This is a sequencing problem, not a character one — but without correction, tactical competence will continue to substitute for strategic architecture.`;
  } else {
    patternTitle = "Distributed misalignment across multiple domains";
    primaryPattern = `Your alignment reads as ${bandWord}. Misalignment is distributed across domains rather than concentrated in one. There is no single root cause, which makes correction harder. The work is sequential: stabilise Identity first, then Decision Integrity, then the operational domains.`;
  }

  if (highVariance) {
    primaryPattern += ` The significant gap between your strongest and weakest domains reveals that your alignment is situational — performing well in some areas while operating from misalignment in others. That inconsistency is itself the tension.`;
  }

  if (lowest && strongest && lowest.id !== strongest.id) {
    primaryPattern += ` Your sharpest weak signal is "${lowest.statement}" (${lowest.weighted.toFixed(1)} weighted). Your strongest signal is "${strongest.statement}" (${strongest.weighted.toFixed(1)} weighted). The distance between those two points defines your current operating condition.`;
  }

  let urgentStatement: string | null = null;
  if (lowest && lowest.weighted < 3) {
    urgentStatement = `"${lowest.statement}" — you scored ${lowest.resonance}/10 resonance with ${lowest.certainty}/10 certainty. This is not a soft weakness. It is the point where your alignment is most visibly failing.`;
  }

  let uncertaintyNote: string | null = null;
  if (unexaminedWeakness.length > 0 && acknowledgedProblems.length === 0) {
    const q = unexaminedWeakness[0]!;
    uncertaintyNote = `You scored low on "${q.statement}" — but with low certainty. You are not sure how bad this is. That uncertainty is more dangerous than a known weakness, because you cannot correct what you have not yet seen clearly.`;
  } else if (acknowledgedProblems.length > 0) {
    const q = acknowledgedProblems[0]!;
    uncertaintyNote = `You scored "${q.statement}" at ${q.resonance}/10 resonance with ${q.certainty}/10 certainty. You know this is failing. That clarity is an asset — acknowledged problems can be corrected. Unexamined ones compound.`;
  }

  const firstAction = ACTION_MAP[weakestDomain];
  let escalationNote = "";
  if (result.coherenceBand === "FRAGMENTED" || result.coherenceBand === "DRIFTING") {
    escalationNote = "The Constitutional Diagnostic will surface whether this misalignment extends into the operating structure of the organisation — or whether it is contained at the individual level. Run it before taking strategic action.";
  } else if (result.coherenceBand === "ALIGNED") {
    escalationNote = "The Team Assessment will verify whether your alignment translates across the people carrying your organisation's direction. Individual alignment that does not propagate is a governance problem.";
  } else {
    escalationNote = "At sovereign alignment, the Team Assessment surfaces whether the people around you are operating at the same standard — or whether there is a gap between your clarity and the organisation's execution.";
  }

  return {
    primaryPattern, patternTitle, urgentStatement, uncertaintyNote,
    firstAction, escalationNote, weakestDomain,
    sharpestSignal: lowest ? { statement: lowest.statement, resonance: lowest.resonance, certainty: lowest.certainty } : null,
  };
}
