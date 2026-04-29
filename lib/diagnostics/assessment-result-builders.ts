/**
 * Assessment Result Builders — transform engine output into the canonical contract.
 *
 * Each builder takes the raw scoring output and produces an AssessmentDecisionResult.
 * The UI renders only this object. No UI computes meaning.
 */

import type { AssessmentDecisionResult, EvidenceLink } from "./assessment-contract";
import { computeSignalStrength, buildEvidenceChain } from "./assessment-contract";
import { detectInternalContradictions, specificityScore } from "@/lib/scoring-math";

// ─────────────────────────────────────────────────────────────────────────────
// PURPOSE ALIGNMENT
// ─────────────────────────────────────────────────────────────────────────────

export function buildPurposeResult(input: {
  percent: number;
  coherenceBand: string;
  primaryPattern?: { label: string; consequence: string; firstAction: string; reasons: string[]; score: number } | null;
  domainProfiles: Array<{ domain: string; label: string; percent: number; resonance: number; certainty: number }>;
  contradictions?: Array<{ type: string; severity: string; evidence: string }>;
  reflections: { avoidedDecision: string; lastSevenDays: string; dissenter: string };
}): AssessmentDecisionResult {
  const { percent, primaryPattern, domainProfiles, contradictions, reflections } = input;

  // Internal consistency check
  const consistency = detectInternalContradictions(
    domainProfiles.map((d) => ({ domain: d.domain, score: d.percent })),
  );

  // Signal strength
  const specificityInput = [reflections.avoidedDecision, reflections.lastSevenDays, reflections.dissenter].filter(Boolean).join(" ");
  const strength = computeSignalStrength({
    consistencyScore: consistency.consistencyScore,
    specificityScore: specificityScore(specificityInput),
    inputCoverage: domainProfiles.length > 0 ? 1 : 0,
    contradictionCount: consistency.contradictions.length,
  });

  // Evidence chain
  const evidence = buildEvidenceChain(
    domainProfiles.map((d) => ({
      source: `${d.label} domain`,
      pattern: d.percent < 40
        ? `Low alignment (${d.percent}%) — resonance ${d.resonance}, certainty ${d.certainty}`
        : d.percent < 65
        ? `Partial alignment (${d.percent}%) — gap between stated values and revealed behaviour`
        : `Aligned (${d.percent}%) — consistent signal across both axes`,
      score: 100 - d.percent,
      maxScore: 100,
      explanation: d.resonance > d.certainty + 2
        ? `High stated resonance but low certainty suggests claimed alignment that hasn't been tested under pressure.`
        : d.certainty > d.resonance + 2
        ? `High certainty about a weakness — the problem is known but not yet acted on.`
        : `Resonance and certainty are close — signal is internally consistent for this domain.`,
    })),
  );

  // Decision framing
  const decisionInFrontOfYou = percent < 45
    ? `Whether to confront the avoided decision now, or continue operating around it. The signal suggests the avoidance pattern is the primary pressure source, not the external conditions.`
    : percent < 65
    ? `Whether to commit to the stated direction or re-evaluate before the next pressure point. The gap between intent and behaviour is visible but not yet entrenched.`
    : `Whether to lock the current direction or test whether the organisation shares it. Personal alignment is present — the question is structural.`;

  return {
    assessmentType: "PURPOSE",
    primarySignal: primaryPattern
      ? `${primaryPattern.label}. ${primaryPattern.consequence}`
      : percent < 50
        ? "Personal direction is under structural drift. Pressure is producing inconsistent decision ownership."
        : "Direction is visible, but it is not yet fully anchored in behaviour and environment.",
    signalStrength: strength,
    evidenceChain: evidence,
    internalContradictions: [
      ...consistency.contradictions.map((c) => c.note),
      ...(contradictions ?? []).map((c) => c.evidence),
    ],
    decisionInFrontOfYou,
    patternRecognition: percent < 45
      ? "This is not isolated. This pattern appears repeatedly when stated values are clearer than the decisions required to defend them."
      : "This is not isolated. This pattern appears when personal direction is understood conceptually but not yet enforced under pressure.",
    minimumViableMove: reflections.avoidedDecision
      ? `Write "${reflections.avoidedDecision.slice(0, 60)}" as a one-sentence decision statement. Name the person affected if it remains unresolved for seven days. Share it with one person who can hold you accountable.`
      : primaryPattern?.firstAction ?? "Identify the decision you are currently avoiding and write it in one sentence. Name who is affected by the delay.",
    ifUnchanged: primaryPattern?.consequence ?? "This decision behaviour pattern will repeat under pressure, producing delayed ownership and inconsistent execution.",
    boardPerspective: percent < 45
      ? "From a senior governance perspective, this is a direction and accountability issue, not a temporary motivation issue."
      : "From a senior governance perspective, this is a reinforcement issue: direction exists, but it is not yet consistently carrying action.",
    validityBoundary: "This result is based on your submitted answers from a single session. It is strongest when compared against live decision records or repeated under active pressure. It identifies a likely pattern, not a confirmed condition.",
    whatWouldStrengthenThis: [
      "Repeat this assessment when a real decision is actively on the table — not retrospectively.",
      "Compare with the Constitutional Diagnostic to test whether this pattern extends into organisational structure.",
      "Ask someone who works closely with you whether they recognise this pattern.",
    ],
    scaleImplication: "At scale, personal decision avoidance becomes organisational drift. Teams compensate by creating informal authority structures that bypass the stated chain.",
    scores: Object.fromEntries(domainProfiles.map((d) => [d.domain, d.percent])),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTITUTIONAL
// ─────────────────────────────────────────────────────────────────────────────

export function buildConstitutionalResult(input: {
  route: string;
  confidence: number;
  scores: { coherence: number; trust: number; governance: number; seriousness: number; authorityType: string; posture: string; readinessTier: string };
  disqualifiers: string[];
  failureModes: Array<{ code: string; severity: number }>;
  reflections: { structuralProblem: string; priorAttempts: string; shadowAuthority: string };
}): AssessmentDecisionResult {
  const { route, confidence, scores, disqualifiers, failureModes, reflections } = input;

  const consistency = detectInternalContradictions([
    { domain: "coherence", score: scores.coherence },
    { domain: "trust", score: scores.trust },
    { domain: "governance", score: scores.governance },
    { domain: "seriousness", score: scores.seriousness },
  ]);

  const specificityInput = [reflections.structuralProblem, reflections.priorAttempts, reflections.shadowAuthority].filter(Boolean).join(" ");
  const strength = computeSignalStrength({
    consistencyScore: consistency.consistencyScore,
    specificityScore: specificityScore(specificityInput),
    inputCoverage: 1,
    contradictionCount: consistency.contradictions.length + disqualifiers.length,
  });

  const evidence = buildEvidenceChain([
    { source: "Coherence signal", pattern: `${scores.coherence}% structural coherence`, score: 100 - scores.coherence, maxScore: 100, explanation: scores.coherence < 50 ? "The organisation's stated structure and actual authority behaviour are not aligned." : "Structural coherence is present. The signal is about governance discipline, not fundamental misalignment." },
    { source: "Authority posture", pattern: `Authority type: ${scores.authorityType}`, score: scores.authorityType === "UNCLEAR" ? 80 : scores.authorityType === "PROXY" ? 40 : 10, maxScore: 100, explanation: scores.authorityType === "UNCLEAR" ? "Authority ownership is not established. Decisions default to whoever acts first." : scores.authorityType === "PROXY" ? "Authority exists but is delegated or sponsored. This creates latency under pressure." : "Direct authority is present. The question is whether it's exercised." },
    { source: "Governance discipline", pattern: `${scores.governance}% governance reliability`, score: 100 - scores.governance, maxScore: 100, explanation: scores.governance < 50 ? "Governance structures exist in name but are not reliably enforced." : "Governance is functional. The risk is whether it holds under pressure." },
    { source: "Trust condition", pattern: `${scores.trust}% trust baseline`, score: 100 - scores.trust, maxScore: 100, explanation: scores.trust < 50 ? "Trust deficit is active. This produces political decision-making and hidden agendas." : "Trust baseline is sufficient for governed decision-making." },
  ]);

  const decisionInFrontOfYou = route === "STRATEGY"
    ? "Whether to escalate to governed intervention now, or attempt internal correction first. The signal suggests structural weakness that internal action alone may not resolve."
    : scores.authorityType === "UNCLEAR"
    ? "Whether to clarify authority ownership immediately, or continue with contested mandate. The longer authority remains unclear, the more informal structures entrench."
    : "Whether to enforce the identified constitutional boundary, or accept the current governance gap. The gap is visible but not yet producing acute failure.";

  return {
    assessmentType: "CONSTITUTIONAL",
    primarySignal: scores.authorityType === "UNCLEAR"
      ? "Decision authority is fragmented. Ownership is implied rather than assigned."
      : scores.governance < 50
        ? "Decision governance is not carrying enough order. Authority exists, but it is not reliably holding."
        : `Authority is ${scores.authorityType.toLowerCase()} with a ${scores.posture.toLowerCase()} posture. The structural pressure is governance discipline, not simple effort.`,
    signalStrength: strength,
    evidenceChain: evidence,
    internalContradictions: [
      ...consistency.contradictions.map((c) => c.note),
      ...(reflections.shadowAuthority ? [`Shadow authority reported: "${reflections.shadowAuthority}". This suggests formal authority structure is being bypassed.`] : []),
    ],
    decisionInFrontOfYou,
    patternRecognition: scores.authorityType === "UNCLEAR"
      ? "This is not isolated. This pattern appears repeatedly in organisations where ownership is assumed socially but not assigned structurally."
      : "This is not isolated. This pattern appears when formal governance exists, but operating decisions are still being routed through informal authority.",
    minimumViableMove: scores.authorityType === "UNCLEAR"
      ? "Name the one person authorised to make the most contested current decision. Document what they can decide without further permission. Communicate this to the three people who need to hear it."
      : "Identify the single constitutional boundary that is currently being crossed most often. Enforce it once in the next decision cycle and observe what resistance surfaces.",
    ifUnchanged: scores.governance < 50
      ? "Authority leakage at this level typically produces parallel decision routes within 30 days. Decisions get made by whoever acts first, not by who should decide."
      : "The structural condition will persist as background friction. Execution quality degrades incrementally rather than failing visibly — until accumulated cost surfaces under pressure.",
    boardPerspective: route === "STRATEGY"
      ? "From a board perspective, this signals a governance exposure that may require structured intervention rather than local correction."
      : "From a board perspective, this signals a decision-governance weakness, not a temporary execution issue.",
    validityBoundary: "This result is based on 10 self-reported responses from a single session. It identifies a likely authority signal and governance pressure point. It is strongest when validated against actual decision records and compared with assessments from other respondents.",
    whatWouldStrengthenThis: [
      "Validate the authority finding against actual decision records — who decided the last three contested decisions?",
      "Ask the person identified as authority holder whether they agree they hold authority.",
      "Compare with Team Assessment to check whether leadership perception matches team experience.",
    ],
    scaleImplication: "At scale, unresolved authority ambiguity produces parallel decision-making. Teams create informal power structures that contradict the stated governance model. Recovery cost increases non-linearly.",
    scores: { coherence: scores.coherence, trust: scores.trust, governance: scores.governance, seriousness: scores.seriousness },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEAM
// ─────────────────────────────────────────────────────────────────────────────

export function buildTeamResult(input: {
  varianceIndex: number;
  trustGap: number;
  avgFriction: number;
  condition: { label: string; reading: string };
  isMultiSource: boolean;
  respondentCount: number;
  nextAction: string;
  reflections?: { confidenceBaseline: number; falseAssumption: string; showScoresReaction: string };
}): AssessmentDecisionResult {
  const { varianceIndex, trustGap, avgFriction, condition, isMultiSource, respondentCount, nextAction, reflections } = input;

  const consistency = detectInternalContradictions([
    { domain: "variance", score: varianceIndex },
    { domain: "trust_gap", score: trustGap },
    { domain: "friction", score: avgFriction },
  ], 25);

  const strength = computeSignalStrength({
    consistencyScore: consistency.consistencyScore,
    specificityScore: reflections?.falseAssumption ? specificityScore(reflections.falseAssumption) : 20,
    inputCoverage: isMultiSource ? 0.85 : 0.40,
    contradictionCount: consistency.contradictions.length,
  });

  const respondentBasis = isMultiSource
    ? `Multi-source: ${respondentCount} respondents.`
    : `Single-source: one respondent's estimate of team dynamics.`;

  const evidence = buildEvidenceChain([
    { source: "Variance index", pattern: `${varianceIndex}% variance across teams`, score: varianceIndex, maxScore: 100, explanation: varianceIndex > 40 ? "Teams are operating from materially different understandings of priority and direction." : varianceIndex > 20 ? "Meaningful variance exists between teams. Instructions may be interpreted differently." : "Variance is within expected range." },
    { source: "Trust gap", pattern: `${trustGap}% gap between leadership and team trust`, score: trustGap, maxScore: 100, explanation: trustGap > 30 ? "Leadership perception of execution trust significantly exceeds estimated team experience." : "Trust gap is present but not yet producing visible execution failure." },
    { source: "Operating friction", pattern: `${avgFriction}% average friction`, score: avgFriction, maxScore: 100, explanation: avgFriction > 50 ? "Coordination cost is actively consuming decision bandwidth." : "Friction is present but manageable." },
  ]);

  return {
    assessmentType: "TEAM",
    primarySignal: `${respondentBasis} ${condition.label}. ${varianceIndex > 40 ? "Instructions are being interpreted differently across teams." : trustGap > 30 ? "Leadership perception and team experience have diverged." : "Team dynamics show a pressure pattern that will compound under strain."}`,
    signalStrength: strength,
    evidenceChain: evidence,
    internalContradictions: [
      ...consistency.contradictions.map((c) => c.note),
      ...(reflections?.falseAssumption ? [`Leadership identified a likely false assumption: "${reflections.falseAssumption}". This itself is diagnostic — awareness of the gap without correction is a common pattern.`] : []),
    ],
    decisionInFrontOfYou: varianceIndex > 40
      ? "Whether to address the perception gap directly with the team, or continue operating on leadership assumptions. The variance level suggests silent instruction failure is already occurring."
      : trustGap > 30
      ? "Whether to rebuild execution trust through visible follow-through, or accept the trust deficit as normal friction."
      : "Whether to maintain current team structure, or restructure communication ownership before the next pressure cycle.",
    patternRecognition: varianceIndex > 40
      ? "This is not isolated. This pattern appears when leadership believes direction is clear but the operating layer is working from a different map."
      : trustGap > 30
        ? "This is not isolated. This pattern appears when information still flows upward, but trust no longer carries enough weight to correct the system."
        : "This is not isolated. This pattern appears when teams still look functional on the surface but coherence is beginning to thin under pressure.",
    minimumViableMove: varianceIndex > 40
      ? "Ask three team members to restate the current top priority, who owns it, the deadline, and the main blocker — without prompting or preparation. Compare their answers. The gap is the problem."
      : "Name the single decision where leadership and team are most likely to disagree on urgency. Resolve that one before issuing the next directive.",
    ifUnchanged: varianceIndex > 40
      ? "Teams operating with this variance level will compensate by ignoring directives they disagree with. Instructions fail silently rather than visibly."
      : "The gap between leadership perception and team experience will widen under pressure. Each decision cycle reinforces the divergence.",
    boardPerspective: varianceIndex > 40 || trustGap > 30
      ? "From a board perspective, this signals an execution-governance risk: leadership intent is no longer translating cleanly into operating behaviour."
      : "From a board perspective, this is an early coherence warning rather than a fully escalated governance failure.",
    validityBoundary: isMultiSource
      ? `This result is based on ${respondentCount} respondents. Signal strength increases with additional respondents and repeat measurement.`
      : "This result reflects one person's view of the team, not the team itself. It is a perception signal, not measured team evidence. It is strongest when compared against direct team responses.",
    whatWouldStrengthenThis: [
      isMultiSource ? "Repeat with more respondents for higher confidence." : "Collect 3-5 direct team responses using the multi-respondent campaign.",
      "Compare leadership estimates against actual team scores. The gap between estimate and reality is itself diagnostic.",
      "Ask team members to identify the single biggest blocker independently. If answers diverge, variance is confirmed.",
    ],
    scaleImplication: "At scale, leadership-team perception divergence produces instruction failure. Directives are interpreted differently across teams, and the variance compounds with each layer of management.",
    scores: { variance: varianceIndex, trust_gap: trustGap, friction: avgFriction },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTERPRISE
// ─────────────────────────────────────────────────────────────────────────────

export function buildEnterpriseResult(input: {
  posture: string;
  composite: number;
  heatDomains: string[];
  domains: Array<{ label: string; authority: number; governance: number; clarity: number; execution: number; trust: number }>;
  nextAction: string;
}): AssessmentDecisionResult {
  const { posture, composite, heatDomains, domains, nextAction } = input;

  const domainScores = domains.map((d) => ({
    domain: d.label,
    score: Math.round((d.authority + d.governance + d.clarity + d.execution + d.trust) / 5),
  }));

  const consistency = detectInternalContradictions(domainScores, 20);

  const strength = computeSignalStrength({
    consistencyScore: consistency.consistencyScore,
    specificityScore: domains.length >= 3 ? 50 : 25,
    inputCoverage: domains.length >= 3 ? 0.7 : 0.4,
    contradictionCount: consistency.contradictions.length,
  });

  const weakestDomain = [...domainScores].sort((a, b) => a.score - b.score)[0];

  const evidence = buildEvidenceChain(
    domains.map((d) => {
      const avg = Math.round((d.authority + d.governance + d.clarity + d.execution + d.trust) / 5);
      const weakest = Math.min(d.authority, d.governance, d.clarity, d.execution, d.trust);
      const weakestMetric = d.authority === weakest ? "authority" : d.governance === weakest ? "governance" : d.clarity === weakest ? "clarity" : d.execution === weakest ? "execution" : "trust";
      return {
        source: `${d.label} domain`,
        pattern: `Average health ${avg}%, weakest metric: ${weakestMetric} (${weakest}%)`,
        score: 100 - avg,
        maxScore: 100,
        explanation: avg < 45 ? `${d.label} is under active pressure. The weakest point (${weakestMetric}) is likely where failure surfaces first.` : `${d.label} is functional but ${weakestMetric} at ${weakest}% creates vulnerability under pressure.`,
      };
    }),
  );

  return {
    assessmentType: "ENTERPRISE",
    primarySignal: posture === "DISORDERED"
      ? "This is not a local execution issue. The operating structure is under distributed strain."
      : posture === "CONTESTED"
        ? "Authority and governance are out of order. The enterprise is carrying conflict through structure, not just through workload."
        : `The enterprise is showing a ${posture.toLowerCase()} posture. The live pressure is concentrated in ${heatDomains[0] ?? "the weakest operating domain"}.`,
    signalStrength: strength,
    evidenceChain: evidence,
    internalContradictions: consistency.contradictions.map((c) => c.note),
    decisionInFrontOfYou: posture === "DISORDERED"
      ? "Whether to intervene at governance level immediately, or accept structural disorder as the operating norm. At this posture, decisions are already being made by whoever acts first."
      : posture === "CONTESTED"
      ? "Whether to resolve contested authority before the next decision cycle, or allow execution to continue under conflicting mandates."
      : heatDomains.length > 0
      ? `Whether to concentrate governance on ${heatDomains[0]} (the dominant pressure point), or spread attention across all domains equally.`
      : "Whether to lock the current governance cadence, or restructure operational authority proactively.",
    patternRecognition: posture === "DISORDERED"
      ? "This is not isolated. This pattern appears when multiple operating domains adapt to unresolved governance weakness instead of correcting it."
      : posture === "CONTESTED"
        ? "This is not isolated. This pattern appears when authority remains disputed long enough for execution to build workarounds around the dispute."
        : "This is not isolated. This pattern appears when the enterprise is still functional, but one domain is carrying more structural load than it should.",
    minimumViableMove: heatDomains.length > 0
      ? `Name the single decision in ${heatDomains[0]} that has been deferred longest. Assign one accountable owner and set a seven-day deadline. Report the outcome.`
      : "Identify which governance boundary is being crossed most often and enforce it once before the next operating cycle.",
    ifUnchanged: posture === "DISORDERED" || posture === "CONTESTED"
      ? "At this posture, decisions are already being made by whoever acts first rather than by who should decide. Each cycle deepens the informal authority structure."
      : "Institutional drag at this level compounds quietly. Execution becomes progressively slower without a single visible failure — until the accumulated cost surfaces under pressure.",
    boardPerspective: posture === "DISORDERED" || posture === "CONTESTED"
      ? "From a board perspective, this is a decision-governance exposure. Delay shifts the cost from operational friction to structural impairment."
      : "From a board perspective, this is a governed watch condition: the enterprise is still moving, but one pressure line is beginning to accumulate consequence.",
    validityBoundary: "This result identifies organisational pressure signals from a single intake. One respondent's domain scores cannot prove enterprise-wide condition. It is strongest when compared against assessments from multiple respondents across leadership, execution, and governance roles.",
    whatWouldStrengthenThis: [
      "Have leadership, execution, and governance respondents complete this independently. Compare where they diverge.",
      "Run the multi-stakeholder campaign to identify where authority disagrees across roles.",
      "Compare current domain scores against the same assessment in 30 days to detect trajectory.",
    ],
    scaleImplication: "At scale, institutional drag becomes indistinguishable from normal operating friction. The organisation adapts to dysfunction rather than resolving it, and recovery cost increases non-linearly.",
    scores: Object.fromEntries(domainScores.map((d) => [d.domain, d.score])),
  };
}
