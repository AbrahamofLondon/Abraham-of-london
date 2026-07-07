/**
 * lib/playbooks/alignment-audit-playbook.ts
 *
 * The Alignment Audit Playbook — genuine alignment-condition analysis.
 *
 * The product diagnoses whether an organisation's STATED mandate matches its
 * ACTUAL incentives and authority distribution, and surfaces hidden conflict
 * before intervention. Its logic is distinct from Execution Integrity: it
 * compares mandate language against what actors are actually rewarded for and
 * who actually holds authority — not commitment/deadline structure.
 */

import {
  type Contradiction,
  type PlaybookAction,
  type PlaybookRunResult,
  type PlaybookRunPosture,
  type Severity,
  PLAYBOOK_CLAIM_BOUNDARY,
  maxSeverity,
} from "./playbook-run-types";

export const ALIGNMENT_AUDIT_PLAYBOOK_CODE = "alignment_audit_playbook";

export interface IncentiveRecord {
  actor: string;
  rewardedFor: string;
}
export interface AuthorityRecord {
  actor: string;
  authority: "high" | "medium" | "low";
}
export interface DecisionDisagreement {
  decision: string;
  factions: string[];
}

export interface AlignmentAuditInput {
  statedMandate?: string | null;
  actualIncentives?: IncentiveRecord[];
  authorityDistribution?: AuthorityRecord[];
  decisionDisagreements?: DecisionDisagreement[];
  executionDivergenceSignals?: string[];
}

export interface AlignmentFindings {
  mandateIncentiveGap: Severity;
  authorityImbalance: Severity;
  disagreementLoad: Severity;
  hiddenConflicts: string[];
  misalignedActors: string[];
}

const STOPWORDS = new Set([
  "the", "and", "a", "an", "to", "of", "for", "in", "on", "with", "our", "we",
  "is", "are", "be", "by", "at", "as", "that", "this", "will", "into", "growth",
  // generic temporal/scale tokens that create false alignment (e.g. long-term vs short-term)
  "term", "long", "short", "prioritise", "prioritize", "only", "new",
]);

function keywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

/** Does the reward language share meaningful vocabulary with the mandate? */
function rewardSupportsMandate(mandateKw: Set<string>, rewardedFor: string): boolean {
  if (mandateKw.size === 0) return true; // no mandate to contradict
  const rk = keywords(rewardedFor);
  for (const w of rk) if (mandateKw.has(w)) return true;
  return false;
}

export function runAlignmentAuditPlaybook(
  input: AlignmentAuditInput,
): PlaybookRunResult<AlignmentFindings> {
  const statedMandate = (input?.statedMandate ?? "").trim();
  const incentives = Array.isArray(input?.actualIncentives) ? input!.actualIncentives! : [];
  const authority = Array.isArray(input?.authorityDistribution) ? input!.authorityDistribution! : [];
  const disagreements = Array.isArray(input?.decisionDisagreements) ? input!.decisionDisagreements! : [];
  const divergence = Array.isArray(input?.executionDivergenceSignals) ? input!.executionDivergenceSignals! : [];

  const base: Omit<PlaybookRunResult<AlignmentFindings>, "posture" | "overallSeverity" | "score"> = {
    playbook: ALIGNMENT_AUDIT_PLAYBOOK_CODE,
    findings: { mandateIncentiveGap: "LOW", authorityImbalance: "LOW", disagreementLoad: "LOW", hiddenConflicts: [], misalignedActors: [] },
    contradictions: [],
    evidenceGaps: [],
    actions: [],
    claimBoundary: PLAYBOOK_CLAIM_BOUNDARY,
  };

  // Insufficient-evidence: cannot audit alignment with neither mandate nor incentives.
  if (!statedMandate && incentives.length === 0) {
    return {
      ...base,
      posture: "INSUFFICIENT_EVIDENCE",
      overallSeverity: "LOW",
      score: null,
      evidenceGaps: ["No stated mandate and no incentive records — alignment cannot be assessed."],
    };
  }

  const evidenceGaps: string[] = [];
  const contradictions: Contradiction[] = [];
  const mandateKw = keywords(statedMandate);
  let penalty = 0;

  // 1. Mandate–incentive gap
  const misalignedActors: string[] = [];
  const hiddenConflicts: string[] = [];
  if (statedMandate && incentives.length > 0) {
    for (const inc of incentives) {
      if (!rewardSupportsMandate(mandateKw, inc.rewardedFor)) {
        misalignedActors.push(inc.actor);
        penalty += 12;
      }
    }
  } else if (!statedMandate) {
    evidenceGaps.push("No stated mandate supplied — mandate–incentive gap not evaluable.");
  } else {
    evidenceGaps.push("No incentive records supplied — mandate–incentive gap not evaluable.");
  }
  const mandateIncentiveGap: Severity =
    misalignedActors.length === 0 ? "LOW" : misalignedActors.length >= Math.max(2, incentives.length / 2) ? "HIGH" : "MEDIUM";

  // 2. Authority imbalance: concentration (one high, rest low) or diffusion (no high at all).
  let authorityImbalance: Severity = "LOW";
  if (authority.length > 0) {
    const highs = authority.filter((a) => a.authority === "high");
    const lows = authority.filter((a) => a.authority === "low");
    if (highs.length === 0) {
      authorityImbalance = "MEDIUM";
      penalty += 8;
    } else if (highs.length === 1 && lows.length >= authority.length - 1 && authority.length >= 3) {
      authorityImbalance = "HIGH";
      penalty += 12;
    }
    // Hidden conflict: a misaligned actor also holds HIGH authority.
    for (const a of authority) {
      if (a.authority === "high" && misalignedActors.includes(a.actor)) {
        hiddenConflicts.push(
          `${a.actor} holds high authority but is rewarded for goals divergent from the stated mandate.`,
        );
        penalty += 10;
      }
    }
  } else {
    evidenceGaps.push("No authority distribution supplied — authority imbalance not evaluable.");
  }

  // 3. Decision disagreement load
  const factionTotal = disagreements.reduce((n, d) => n + (Array.isArray(d.factions) ? d.factions.length : 0), 0);
  const disagreementLoad: Severity =
    disagreements.length === 0 ? "LOW" : factionTotal >= 5 || disagreements.length >= 3 ? "HIGH" : "MEDIUM";
  penalty += disagreements.length * 4;

  // Execution divergence adds weight.
  penalty += divergence.length * 3;

  // Contradiction: a mandate claims a priority, yet every incentive rewards the opposite.
  if (statedMandate && incentives.length > 0 && misalignedActors.length === incentives.length) {
    contradictions.push({
      ref: "mandate",
      detail: "Stated mandate is contradicted by every supplied incentive — the mandate is nominal, not operative.",
    });
  }

  const actions: PlaybookAction[] = [];
  if (misalignedActors.length > 0) {
    actions.push({
      action: `Re-cut incentives for misaligned actors: ${Array.from(new Set(misalignedActors)).join(", ")}.`,
      rationale: "Actors are rewarded for outcomes divergent from the stated mandate.",
      severity: mandateIncentiveGap,
    });
  }
  if (hiddenConflicts.length > 0) {
    actions.push({
      action: "Resolve authority-level conflict: a high-authority actor is misaligned with the mandate.",
      rationale: "Misalignment concentrated in high authority produces durable, hidden drift.",
      severity: "HIGH",
    });
  }
  if (disagreementLoad !== "LOW") {
    actions.push({
      action: "Adjudicate the open decision disagreements before intervention.",
      rationale: "Unresolved decision factions will re-diverge any intervention.",
      severity: disagreementLoad,
    });
  }

  const score = Math.max(0, Math.min(100, 100 - penalty));
  const overallSeverity = maxSeverity([mandateIncentiveGap, authorityImbalance, disagreementLoad]);

  let posture: PlaybookRunPosture;
  if (contradictions.length > 0) posture = "CONTRADICTORY_INPUT";
  else if (evidenceGaps.length > 0) posture = "PARTIAL";
  else posture = "ACTIONABLE";

  return {
    ...base,
    posture,
    overallSeverity,
    score,
    findings: { mandateIncentiveGap, authorityImbalance, disagreementLoad, hiddenConflicts, misalignedActors },
    contradictions,
    evidenceGaps,
    actions,
  };
}
