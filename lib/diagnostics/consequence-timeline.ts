/**
 * Consequence Timeline Generator — structured 7/30/90 day forecast for all assessments.
 * Uses assessment type + score + domain data to produce specific, not generic, timelines.
 */

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
