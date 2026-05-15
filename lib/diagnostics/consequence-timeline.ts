/**
 * Consequence Timeline Generator — structured 7/30/90 day forecast for all assessments.
 * Uses assessment type + score + domain data to produce specific, not generic, timelines.
 *
 * `buildConsequenceTimeline` — new contract-aligned builder for AssessmentResult.
 * `generateConsequenceTimeline` — legacy detailed builder, kept for existing callers.
 */

import type { AssessmentKind, ConsequenceTimeline } from "./assessment-result-contract";

// ─── New contract-aligned builder ─────────────────────────────────────────────

export type ConsequenceTimelineInput = {
  kind: AssessmentKind;
  band: string;
  primaryFinding: string;
  weeklyCost?: number | null;
  delayWeeks?: number | null;
};

function isSevereBand(band: string): boolean {
  const b = band.toLowerCase();
  return b === "critical" || b === "severe" || b === "high" || b === "alert" || b === "red" || b === "urgent";
}

function isModerateBand(band: string): boolean {
  const b = band.toLowerCase();
  return b === "moderate" || b === "significant" || b === "amber" || b === "yellow" || b === "strained" || b === "watch";
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `£${(amount / 1_000_000).toFixed(1)}m`;
  if (amount >= 1_000) return `£${(amount / 1_000).toFixed(0)}k`;
  return `£${amount.toFixed(0)}`;
}

const SEVERE: Record<AssessmentKind, ConsequenceTimeline> = {
  FAST_DIAGNOSTIC: {
    sevenDays: "Ambiguity hardens into working assumption; teams fill the governance gap with informal workarounds that are difficult to unwind.",
    thirtyDays: "Execution drag becomes normalised; the pattern is embedded in operating rhythms and requires active intervention to surface.",
    ninetyDays: "Structural cost compounds; stakeholder fatigue and political friction increase significantly, narrowing the viable correction window.",
  },
  PURPOSE_ALIGNMENT: {
    sevenDays: "Misalignment between stated purpose and operative decisions becomes entrenched at team level.",
    thirtyDays: "Conflicting mandates emerge publicly; trust between governing parties deteriorates.",
    ninetyDays: "Institutional legitimacy of the governing body comes under question; external correction required.",
  },
  CONSTITUTIONAL_DIAGNOSTIC: {
    sevenDays: "Constitutional ambiguity hardens into precedent; informal authority patterns solidify.",
    thirtyDays: "Competing governance claims escalate; formal dispute or restructure becomes likely.",
    ninetyDays: "Constitutional failure is cited in external reviews; recovery requires full structural redesign.",
  },
  TEAM_ASSESSMENT: {
    sevenDays: "Team dysfunction becomes visible to adjacent stakeholders; morale indicators deteriorate.",
    thirtyDays: "High-performance members disengage; critical institutional knowledge becomes at risk.",
    ninetyDays: "Structural team failure creates cascading delivery risk; leadership credibility under formal challenge.",
  },
  ENTERPRISE_ASSESSMENT: {
    sevenDays: "Enterprise-level execution failure signals reach board-grade stakeholders; escalation imminent.",
    thirtyDays: "Systemic pattern is now externally observable; market-facing consequence exposure begins.",
    ninetyDays: "Enterprise-grade reversal required; commercial, regulatory, and reputational cost compounds.",
  },
};

const MODERATE: Record<AssessmentKind, ConsequenceTimeline> = {
  FAST_DIAGNOSTIC: {
    sevenDays: "Drift continues at the current rate with no natural correction mechanism in the operating rhythm.",
    thirtyDays: "Misalignment becomes embedded; harder to surface without a structured governance review.",
    ninetyDays: "Evidence of systemic pattern emerges; correction now requires formal governance action rather than informal adjustment.",
  },
  PURPOSE_ALIGNMENT: {
    sevenDays: "Purpose drift is detectable at operational level but not yet creating external consequence.",
    thirtyDays: "Decisions made without alignment to stated purpose compound; correction window narrows.",
    ninetyDays: "Purpose misalignment is embedded in culture and operating rhythm; realignment requires formal intervention.",
  },
  CONSTITUTIONAL_DIAGNOSTIC: {
    sevenDays: "Authority gaps are being filled by informal workarounds with no audit trail.",
    thirtyDays: "Informal authority patterns become load-bearing; removing them requires formal restructure.",
    ninetyDays: "Constitutional drift is entrenched; a governance review with external input is now warranted.",
  },
  TEAM_ASSESSMENT: {
    sevenDays: "Team friction is visible at the work level; output quality begins to be affected.",
    thirtyDays: "Collaboration breakdowns become patterns; delivery timeline risk increases.",
    ninetyDays: "Team dysfunction is now structurally embedded; return to baseline requires deliberate intervention.",
  },
  ENTERPRISE_ASSESSMENT: {
    sevenDays: "Moderate enterprise drift creates compounding misalignment risk across business units.",
    thirtyDays: "Cross-functional coordination failures become visible to leadership; reputational exposure begins.",
    ninetyDays: "Enterprise drift is now embedded in operational norms; a structured governance reset is required.",
  },
};

const MILD: Record<AssessmentKind, ConsequenceTimeline> = {
  FAST_DIAGNOSTIC: {
    sevenDays: "No immediate escalation risk; monitoring is the earned response at current evidence level.",
    thirtyDays: "Pattern may consolidate if left unexamined; periodic governance review is sufficient.",
    ninetyDays: "Record remains open pending additional evidence cycles. Re-assess if conditions change.",
  },
  PURPOSE_ALIGNMENT: {
    sevenDays: "Purpose alignment is within acceptable variation; no immediate corrective action required.",
    thirtyDays: "Continue monitoring. Re-assess if new decisions surface that diverge from stated purpose.",
    ninetyDays: "Sustained alignment suggests healthy governance rhythm. Record and move forward.",
  },
  CONSTITUTIONAL_DIAGNOSTIC: {
    sevenDays: "Constitutional posture is stable; governance structures are functioning as designed.",
    thirtyDays: "No structural changes required. Conduct a review if significant decisions are made.",
    ninetyDays: "Governance integrity maintained. Normal oversight cycle applies.",
  },
  TEAM_ASSESSMENT: {
    sevenDays: "Team health indicators are within normal range; no immediate intervention required.",
    thirtyDays: "Continue with standard operating rhythm. Re-assess after next delivery cycle.",
    ninetyDays: "No governance escalation warranted. Record remains open for monitoring.",
  },
  ENTERPRISE_ASSESSMENT: {
    sevenDays: "Enterprise indicators are stable; standard governance oversight is sufficient.",
    thirtyDays: "No cross-functional risk detected. Continue operating rhythm.",
    ninetyDays: "Enterprise health is within acceptable parameters. Re-assess annually or on material change.",
  },
};

/**
 * Builds a 7/30/90-day consequence timeline for an AssessmentResult.
 * Uses quantitative projections when weeklyCost is supplied;
 * falls back to qualitative timelines calibrated by severity band and kind.
 */
export function buildConsequenceTimeline(
  input: ConsequenceTimelineInput,
): ConsequenceTimeline {
  const { kind, band, weeklyCost } = input;

  if (weeklyCost && weeklyCost > 0) {
    const sevenDay = weeklyCost;
    const thirtyDay = Math.round(weeklyCost * (30 / 7));
    const ninetyDay = Math.round(weeklyCost * (90 / 7));
    return {
      sevenDays: `${formatCurrency(sevenDay)} in execution cost exposure accrued at the current weekly rate.`,
      thirtyDays: `${formatCurrency(thirtyDay)} cumulative exposure if the delay continues for 30 days.`,
      ninetyDays: `${formatCurrency(ninetyDay)} total exposure at 90 days — beyond which reversal cost typically exceeds continuation cost.`,
    };
  }

  if (isSevereBand(band)) return SEVERE[kind];
  if (isModerateBand(band)) return MODERATE[kind];
  return MILD[kind];
}

// ─── Legacy detailed builder ─────────────────────────────────────────────────

export type TimelineOutput = {
  alreadyIncurred?: string;
  sevenDays: string;
  thirtyDays: string;
  ninetyDays: string;
  controlShiftSummary?: string;
};

export function generateConsequenceTimeline(input: {
  assessmentType: "purpose" | "constitutional" | "team" | "enterprise";
  score: number;
  weakestDomain?: string;
  route?: string;
}): TimelineOutput {
  const { assessmentType, score, weakestDomain, route } = input;
  const severe = score < 40;
  const moderate = score >= 40 && score < 65;

  if (assessmentType === "purpose") {
    const domain = weakestDomain ?? "alignment";
    return {
      alreadyIncurred: severe
        ? `Repeated misalignment in ${domain} — decisions already made against stated purpose.`
        : `Accumulated ${domain} drift — daily decisions already diverging from priorities.`,
      sevenDays: severe
        ? `The ${domain} misalignment continues to produce decisions that contradict stated purpose. No visible failure yet — but the pattern is compounding.`
        : `The ${domain} gap persists. Daily decisions continue to drift from stated priorities without correction.`,
      thirtyDays: severe
        ? "Behavioural erosion has now set precedent. Reversing the pattern requires confrontation with established habits, not just awareness."
        : "The gap between stated purpose and daily operation has widened. Correction is still possible but requires deliberate structural change.",
      ninetyDays: severe
        ? "The misalignment has embedded as normal operating state. Recovery requires identity reconstruction, not incremental adjustment."
        : "Drift has compounded. What was a gap is now a structural feature. Intervention cost has increased significantly.",
    };
  }

  if (assessmentType === "constitutional") {
    return {
      alreadyIncurred: severe
        ? "Structural governance erosion — informal authority already displacing formal decision rights."
        : "Unresolved constitutional strain — energy already absorbed by internal friction rather than execution.",
      sevenDays: severe
        ? "The structural condition persists. Internal friction absorbs energy that should produce execution."
        : "The constitutional reading holds. The condition is stable but untested under new pressure.",
      thirtyDays: severe
        ? "Informal authority has begun replacing formal governance. Reversing this requires visible confrontation."
        : "The condition has not improved without intervention. Stakeholder positions are hardening.",
      ninetyDays: severe
        ? "The constitutional condition has become structural. Recovery requires reconstitution, not adjustment."
        : "Without intervention, the condition will have embedded. Future correction costs significantly more than present action.",
      controlShiftSummary: severe
        ? "Control is shifting from formal authority to informal power structures."
        : undefined,
    };
  }

  if (assessmentType === "team") {
    return {
      alreadyIncurred: severe
        ? "Leadership-team perception gap already active — execution diverging from intent before this assessment."
        : "Accumulated perception drift — team and leadership already operating on different assumptions.",
      sevenDays: "The perception gap between leadership and team remains invisible to both sides. Execution continues to diverge from intent.",
      thirtyDays: severe
        ? "The gap has produced visible misalignment. Team members are executing against different interpretations. Rework is compounding."
        : "The gap persists. Team trust erodes incrementally. Alignment conversations become harder as positions crystallise.",
      ninetyDays: severe
        ? "The perception gap has become a structural feature. The team and leadership operate in effectively different organisations."
        : "Without explicit alignment, the gap will have normalised. Both sides will believe they are aligned — the data says otherwise.",
    };
  }

  // Enterprise
  return {
    alreadyIncurred: severe
      ? "Institutional governance at capacity — structural risk already compounding before this assessment."
      : "Unpriced institutional condition — operational strain already absorbed as normal.",
    sevenDays: route === "EXECUTIVE_REPORTING"
      ? "The institutional condition is active. Governance mechanisms are absorbing pressure but capacity is finite."
      : "The institutional signal is present but not yet acute. The condition is evolving.",
    thirtyDays: severe
      ? "The institutional condition has crossed from operational strain to structural risk. Governance mechanisms are at capacity."
      : "The condition persists. Without pricing and enforcement, it will be absorbed as normal operating reality.",
    ninetyDays: severe
      ? "The institution has adapted to dysfunction. Recovery requires structural intervention, not operational adjustment. Cost has compounded."
      : "The condition has embedded. What was detectable three months ago now requires significantly more effort to correct.",
    controlShiftSummary: severe
      ? "Institutional control is shifting from governance to operational inertia."
      : undefined,
  };
}
