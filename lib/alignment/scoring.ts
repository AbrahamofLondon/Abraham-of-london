import {
  ALIGNMENT_DOMAIN_LABELS,
  ALIGNMENT_DOMAIN_ORDER,
  PURPOSE_ALIGNMENT_QUESTIONS,
} from "./checklist";
import { runPurposeAlignmentEngine } from "./intelligence-engine";
import type {
  AlignmentAssessmentInput,
  AlignmentAssessmentResult,
  AlignmentBand,
  AlignmentDomain,
  AlignmentDomainScore,
} from "./types";

function getBand(score: number): AlignmentBand {
  if (score >= 18) return "aligned";
  if (score >= 14) return "drifting";
  if (score >= 10) return "misaligned";
  return "disordered";
}

function getCorrections(weakestDomains: AlignmentDomain[]): string[] {
  const map: Record<AlignmentDomain, string> = {
    identity:
      "Rewrite your current mandate in one sentence and remove one commitment that does not serve it.",
    decision:
      "Review your last three major decisions and identify where pressure replaced principle.",
    environment:
      "Remove one recurring source of noise, sabotage, or confusion from your operating environment.",
    behaviour:
      "Rebuild one non-negotiable daily habit tied directly to your long-term outcomes.",
    emotional_order:
      "Stabilise sleep, input, and response rhythm before making further strategic decisions.",
    legacy:
      "Define one structure you are building that must outlast your current season.",
  };

  return weakestDomains.map((domain) => map[domain]);
}

function getStrengths(domainScores: AlignmentDomainScore[]): string[] {
  return domainScores
    .filter((score) => score.percent >= 67)
    .map(
      (score) =>
        `${ALIGNMENT_DOMAIN_LABELS[score.domain]} is currently operating above baseline.`
    );
}

/* ── Dual-axis scoring engine (resonance × certainty) ── */

function getCoherenceBand(percent: number): import("./types").CoherenceBand {
  if (percent >= 82) return "SOVEREIGN";
  if (percent >= 62) return "ALIGNED";
  if (percent >= 40) return "DRIFTING";
  return "FRAGMENTED";
}

function buildNarrative(
  band: import("./types").CoherenceBand,
  weakest: AlignmentDomain[],
): string {
  const bandNarrative: Record<import("./types").CoherenceBand, string> = {
    SOVEREIGN:
      "Your purpose alignment is operating at sovereign clarity. Identity, decisions, and behaviour are coherent with long-term direction.",
    ALIGNED:
      "Your alignment is strong but not yet unconditional. Minor drift areas exist that, left unaddressed, will compound over time.",
    DRIFTING:
      "Meaningful gaps exist between stated purpose and lived reality. Intervention is needed before drift becomes structural.",
    FRAGMENTED:
      "Purpose alignment has broken down across multiple domains. Foundational reconstruction is required before strategic action is viable.",
  };

  const domainContext = weakest.length > 0
    ? ` The most urgent attention is needed in ${weakest.map((d) => ALIGNMENT_DOMAIN_LABELS[d]).join(" and ")}.`
    : "";

  return bandNarrative[band] + domainContext;
}

function buildNextActions(
  band: import("./types").CoherenceBand,
  weakest: AlignmentDomain[],
): string[] {
  const actions: string[] = [];

  if (band === "FRAGMENTED" || band === "DRIFTING") {
    actions.push("Complete the Constitutional Diagnostic to identify structural root causes.");
  }

  const correctionMap: Record<AlignmentDomain, string> = {
    identity: "Rewrite your mandate in one sentence and test it against your last three major commitments.",
    decision: "Audit your last five decisions: which were principle-driven and which were pressure-driven?",
    environment: "Identify and remove one source of recurring confusion or misalignment in your environment.",
    behaviour: "Establish one non-negotiable daily discipline tied directly to your stated long-term outcomes.",
    emotional_order: "Stabilise your recovery rhythm — sleep, input quality, and response time under stress.",
    legacy: "Define one structure you are building that must outlast your current season and resource it accordingly.",
  };

  for (const domain of weakest.slice(0, 2)) {
    actions.push(correctionMap[domain]);
  }

  if (band === "ALIGNED" || band === "SOVEREIGN") {
    actions.push("Consider the Team Assessment to verify whether your alignment translates across your organisation.");
  }

  return actions;
}

export function scorePurposeProfile(
  input: import("./types").DualAxisInput,
): import("./types").PurposeProfileResult {
  return runPurposeAlignmentEngine(input);
}

/* ── Tension signal extraction for cross-stage memory ── */

import type { TensionSignal } from "@/lib/diagnostics/tension-thread";

type DualAxisAnswerForExtraction = { resonance: number; certainty: number };

export function extractPurposeTensions(
  profile: {
    domainProfiles: Array<{ domain: string; percent: number }>;
    weakestDomains: string[];
    contradictions?: Array<{ type: string; severity: "low" | "medium" | "high" | "critical"; domains: string[]; evidence: string }>;
    primaryPattern?: { id: string; label: string; consequence: string };
  },
  answers: Record<string, DualAxisAnswerForExtraction>,
): TensionSignal[] {
  const signals: TensionSignal[] = [];
  const src = "purpose_alignment" as const;

  if (profile.contradictions?.length || profile.primaryPattern) {
    for (const contradiction of profile.contradictions ?? []) {
      signals.push({
        domain: contradiction.domains.join(","),
        signal: contradiction.type,
        severity: contradiction.severity === "critical" ? "high" : contradiction.severity,
        source: src,
        evidence: contradiction.evidence,
      });
    }

    if (profile.primaryPattern) {
      signals.push({
        domain: profile.weakestDomains.join(",") || "mixed",
        signal: profile.primaryPattern.id,
        severity: profile.contradictions?.some((item) => item.severity === "high" || item.severity === "critical")
          ? "high"
          : "medium",
        source: src,
        evidence: `${profile.primaryPattern.label}: ${profile.primaryPattern.consequence}`,
      });
    }

    return signals;
  }

  for (const dp of profile.domainProfiles) {
    if (dp.domain === "identity" && dp.percent < 45) {
      signals.push({ domain: "identity", signal: "mandate_vacuum", severity: dp.percent < 30 ? "high" : "medium", source: src, evidence: `Identity domain scored ${dp.percent}% — mandate clarity is below structural threshold.` });
    }
    if (dp.domain === "decision" && dp.percent < 45) {
      signals.push({ domain: "decision", signal: "reactive_decision_pattern", severity: dp.percent < 30 ? "high" : "medium", source: src, evidence: `Decision Integrity scored ${dp.percent}% — decisions are driven by pressure rather than principle.` });
    }
    if (dp.domain === "environment" && dp.percent < 45) {
      signals.push({ domain: "environment", signal: "environmental_drag", severity: "medium", source: src, evidence: `Environmental Alignment scored ${dp.percent}% — the operating environment is working against stated direction.` });
    }
  }

  // Structural inconsistency: high variance between strongest and weakest
  const pcts = profile.domainProfiles.map(d => d.percent);
  if (Math.max(...pcts) - Math.min(...pcts) > 35) {
    signals.push({ domain: "mixed", signal: "structural_inconsistency", severity: "low", source: src, evidence: "Alignment varies significantly across domains — performing well in some areas while misaligned in others." });
  }

  // False alignment: high resonance, low certainty on any question
  for (const [id, a] of Object.entries(answers)) {
    if (a.resonance >= 7 && a.certainty <= 3) {
      signals.push({ domain: "mixed", signal: "false_alignment", severity: "low", source: src, evidence: `Stated high alignment but very low confidence on "${id}" — possible self-deception.` });
      break; // one is enough
    }
  }

  // Acknowledged failure: low resonance, high certainty
  for (const [id, a] of Object.entries(answers)) {
    if (a.resonance <= 3 && a.certainty >= 7) {
      signals.push({ domain: "mixed", signal: "acknowledged_failure", severity: "medium", source: src, evidence: `Clearly acknowledged weakness on "${id}" — known problem, not a blind spot.` });
      break;
    }
  }

  return signals;
}

/* ── Legacy boolean scoring (backward compat) ── */

export function scorePurposeAlignment(
  input: AlignmentAssessmentInput
): AlignmentAssessmentResult {
  const possibleScore = PURPOSE_ALIGNMENT_QUESTIONS.length;
  const totalScore = PURPOSE_ALIGNMENT_QUESTIONS.reduce(
    (sum, question) => sum + (input.answers[question.id] ? 1 : 0),
    0
  );

  const domainScores: AlignmentDomainScore[] = ALIGNMENT_DOMAIN_ORDER.map((domain) => {
    const domainQuestions = PURPOSE_ALIGNMENT_QUESTIONS.filter(
      (question) => question.domain === domain
    );

    const earned = domainQuestions.reduce(
      (sum, question) => sum + (input.answers[question.id] ? 1 : 0),
      0
    );

    const possible = domainQuestions.length;
    const percent = possible === 0 ? 0 : Math.round((earned / possible) * 100);

    return {
      domain,
      earned,
      possible,
      percent,
    };
  });

  const weakestDomains = [...domainScores]
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 2)
    .map((item) => item.domain);

  return {
    totalScore,
    possibleScore,
    percent: Math.round((totalScore / possibleScore) * 100),
    band: getBand(totalScore),
    domainScores,
    weakestDomains,
    strengths: getStrengths(domainScores),
    corrections: getCorrections(weakestDomains),
    createdAt: new Date().toISOString(),
  };
}
