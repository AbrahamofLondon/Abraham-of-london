/**
 * lib/diagnostics/assessment-result-mappers.ts
 *
 * Maps each assessment's native result type into the canonical AssessmentResult
 * contract for rendering via AssessmentResultSurface.
 *
 * Each mapper:
 * 1. Extracts the primary finding, failure pattern, and governance implication
 * 2. Builds the consequence timeline from available data
 * 3. Determines the earned next route
 * 4. Sets the evidence posture and record status
 */

import type { FastDiagnosticResult } from "@/lib/diagnostics/fast-diagnostic-dto";
import type { PurposeProfileResult } from "@/lib/alignment/types";
import type { EnterpriseAssessmentResult } from "@/lib/alignment/enterprise-types";
import type { TeamDecisionResult, EnterpriseDecisionResult, EnterpriseSectionScore } from "@/lib/diagnostics/decision-engine";
import type {
  AssessmentResult,
  AssessmentKind,
  EarnedRoute,
  EvidencePosture,
} from "./assessment-result-contract";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bandFromSeverity(severity?: string | null): string {
  switch (severity) {
    case "CRITICAL":
      return "CRITICAL";
    case "ALERT":
      return "ALERT";
    case "CONCERN":
      return "CONCERN";
    case "WATCH":
      return "WATCH";
    default:
      return "WATCH";
  }
}

function bandFromScore(score: number): string {
  if (score >= 70) return "ALERT";
  if (score >= 45) return "CONCERN";
  return "WATCH";
}

function evidencePostureFromSignal(signalStrength?: string | null): EvidencePosture {
  switch (signalStrength) {
    case "high":
      return "SYSTEM_INFERRED";
    case "moderate":
      return "SYSTEM_INFERRED";
    default:
      return "USER_REPORTED";
  }
}

function earnedRouteFromCondition(condition?: string | null): {
  route: EarnedRoute;
  label: string;
  href: string;
  reason: string;
} {
  switch (condition) {
    case "authority":
    case "accountability":
      return {
        route: "EXECUTIVE_REPORTING",
        label: "Request Executive Reporting",
        href: "/diagnostics/executive-reporting",
        reason: "Authority or accountability gap detected — requires structured intervention.",
      };
    case "governance":
      return {
        route: "DECISION_CENTRE",
        label: "Open in Decision Centre",
        href: "/decision-centre",
        reason: "Governance signal detected — monitor in Decision Centre before escalation.",
      };
    default:
      return {
        route: "DECISION_CENTRE",
        label: "Open in Decision Centre",
        href: "/decision-centre",
        reason: "Save this case to Decision Centre for continued tracking.",
      };
  }
}

// ─── Fast Diagnostic Mapper ──────────────────────────────────────────────────

export function mapFastDiagnosticToAssessmentResult(
  result: FastDiagnosticResult,
  decisionLabel?: string,
): AssessmentResult {
  const severity = result.highestSignalSeverity ?? null;
  const band = severity ? bandFromSeverity(severity) : bandFromScore(50);

  const primaryFinding =
    result.synthesis?.verdict ??
    result.conditionLabel ??
    "Decision condition identified but requires more detail.";

  const failurePattern =
    result.synthesis?.primaryContradiction ??
    result.contradictionText ??
    "The decision is being held open by an unresolved structural tension.";

  const governanceImplication =
    result.authorityIndex?.boardMeaning ??
    result.executionFailure?.whyExecutionWillStall ??
    "Unresolved decision conditions accumulate governance risk over time.";

  const recommendedNextMove =
    result.authorityIndex?.nextGovernanceMove ??
    result.synthesis?.concreteMove ??
    "Name one accountable owner and set the next admissible move.";

  const consequenceTimeline = result.forecast
    ? {
        sevenDays: result.forecast.sevenDays,
        thirtyDays: result.forecast.thirtyDays,
        ninetyDays: result.forecast.ninetyDays,
      }
    : result.costOfInaction
    ? {
        sevenDays: "Delay continues without visible escalation.",
        thirtyDays: result.costOfInaction.horizon30,
        ninetyDays: result.costOfInaction.horizon90,
      }
    : {
        sevenDays: "The condition remains active.",
        thirtyDays: "Cost of inaction accumulates.",
        ninetyDays: "Options narrow without intervention.",
      };

  const earnedRoute = earnedRouteFromCondition(result.condition);

  return {
    kind: "FAST_DIAGNOSTIC",
    title: decisionLabel ?? result.synthesis?.avoidedDecision ?? "Decision condition analysis",
    score: null,
    band,
    primaryFinding,
    failurePattern,
    evidencePosture: evidencePostureFromSignal(result.signalStrength),
    governanceImplication,
    recommendedNextMove,
    consequenceTimeline,
    earnedRoute: {
      route: earnedRoute.route,
      label: earnedRoute.label,
      href: earnedRoute.href,
      reason: earnedRoute.reason,
    },
    recordStatus: {
      level: "SESSION_PREVIEW",
      label: "Session preview — sign in to retain this record.",
    },
  };
}

// ─── Purpose Alignment Mapper ────────────────────────────────────────────────

export function mapPurposeAlignmentToAssessmentResult(
  result: PurposeProfileResult,
): AssessmentResult {
  const percent = result.percent ?? 50;
  const band = bandFromScore(100 - percent);
  const coherenceBand = result.coherenceBand ?? "DRIFTING";

  const primaryFinding =
    result.primaryPattern?.label ??
    (percent < 45
      ? "Personal direction is under structural drift."
      : percent < 65
      ? "Direction is visible but not yet anchored in behaviour."
      : "Personal alignment is present — the question is structural.");

  const failurePattern =
    result.primaryPattern?.consequence ??
    (percent < 45
      ? "Avoidance pattern is the primary pressure source, not external conditions."
      : "Gap between stated values and revealed behaviour is visible but not entrenched.");

  const governanceImplication =
    coherenceBand === "FRAGMENTED"
      ? "Decision behaviour pattern will repeat under pressure, producing delayed ownership and inconsistent execution."
      : coherenceBand === "DRIFTING"
      ? "Direction exists but is not yet consistently carrying action."
      : "Alignment is present. The risk is whether it holds under structural pressure.";

  const recommendedNextMove =
    result.primaryPattern?.firstAction ??
    "Write the avoided decision as a one-sentence statement. Name who is affected by the delay.";

  return {
    kind: "PURPOSE_ALIGNMENT",
    title: "Purpose Alignment Analysis",
    score: percent,
    band,
    primaryFinding,
    failurePattern,
    evidencePosture: "USER_REPORTED",
    governanceImplication,
    recommendedNextMove,
    consequenceTimeline: {
      sevenDays: "The pattern remains active without intervention.",
      thirtyDays: "Decision avoidance compounds — each deferred choice narrows future options.",
      ninetyDays: "Personal direction drift becomes organisational drag.",
    },
    earnedRoute: {
      route: "NEXT_ASSESSMENT",
      label: "Test the organisational structure",
      href: "/diagnostics/constitutional-diagnostic",
      reason: "This analysis reads you personally. The Constitutional Diagnostic reads your organisation structurally.",
    },
    recordStatus: {
      level: "SESSION_PREVIEW",
      label: "Session preview — sign in to retain this record.",
    },
  };
}

// ─── Team Assessment Mapper ───────────────────────────────────────────────────

export function mapTeamAssessmentToAssessmentResult(
  reading: TeamDecisionResult,
  overallLeader: number,
  overallReality: number,
  fragility: { status: string; score: number },
): AssessmentResult {
  const gapAbs = Math.abs(overallLeader - overallReality);
  const band =
    reading.route === "ENTERPRISE" || reading.route === "STRATEGY_ROOM"
      ? "SEVERE"
      : gapAbs >= 20
      ? "MODERATE"
      : "WATCH";

  const earnedRoute: AssessmentResult["earnedRoute"] =
    reading.route === "STRATEGY_ROOM"
      ? {
          route: "STRATEGY_ROOM",
          label: "Enter Strategy Room",
          href: "/strategy-room",
          reason: "Severe team-level authority gap requires coordinated governance. Enter the Strategy Room.",
        }
      : reading.route === "ENTERPRISE"
      ? {
          route: "NEXT_ASSESSMENT",
          label: "Run Enterprise Assessment",
          href: "/diagnostics/enterprise-assessment",
          reason:
            "Team-level finding requires enterprise-layer validation before governance escalation.",
        }
      : {
          route: "WATCH",
          label: "Monitor and return",
          href: "/decision-centre",
          reason:
            "Severity does not yet qualify for escalation. Monitor this case and re-assess after 30 days.",
        };

  return {
    kind: "TEAM_ASSESSMENT",
    title: reading.title,
    score: overallLeader,
    band,
    primaryFinding: reading.pattern,
    failurePattern:
      reading.escalationNote ||
      "The perception gap between leadership intent and team reality is producing execution drift.",
    evidencePosture: "USER_REPORTED",
    governanceImplication:
      fragility.status === "FRACTURED"
        ? "Team cohesion has broken below the threshold where normal operating rhythm can self-correct. Governance intervention is required before execution continues."
        : fragility.status === "VOLATILE"
        ? "Team variance is at the level where decisions made now will produce inconsistent results across the organisation."
        : "Leadership and team are not operating from the same map. Ungoverned, this gap widens with each cycle.",
    recommendedNextMove: reading.firstAction,
    consequenceTimeline: {
      sevenDays:
        "The perception gap remains invisible to both sides. Execution continues to diverge from intent.",
      thirtyDays: `The ${gapAbs}% leader–team gap has produced visible misalignment. Rework and misread signals compound.`,
      ninetyDays:
        reading.route === "ENTERPRISE" || reading.route === "STRATEGY_ROOM"
          ? "The gap has become a structural feature. Team and leadership operate from effectively different maps."
          : "Without explicit alignment, the gap normalises. Both sides believe they are aligned — the data says otherwise.",
    },
    earnedRoute,
    recordStatus: {
      level: "SESSION_PREVIEW",
      label: "Session preview — sign in to retain this record.",
    },
  };
}

// ─── Constitutional Diagnostic Mapper ────────────────────────────────────────

export type ConstitutionalBundle = {
  report: {
    authorityScore: number;
    interventionReadiness: number;
    posture: string;
    readinessTier: string;
    authorityType: string;
    summary: string;
    keyFindings: string[];
    failureModeCount: number;
  };
  decision: {
    route: "REJECT" | "DIAGNOSTIC" | "STRATEGY";
    rationale: string[];
    recommendedInterventions: string[];
    escalationAllowed: boolean;
  };
  routeSummary: {
    route: string;
    title: string;
    description: string;
    href: string;
    cta: string;
  };
};

export function mapConstitutionalToAssessmentResult(
  bundle: ConstitutionalBundle,
): AssessmentResult {
  const { report, decision, routeSummary } = bundle;
  const route = decision.route;

  const band =
    route === "STRATEGY" ? "ALERT" : route === "DIAGNOSTIC" ? "MODERATE" : "mild";

  const primaryFinding =
    report.keyFindings[0] ?? report.summary ?? "Constitutional posture assessed.";

  const failurePattern =
    report.keyFindings[1] ??
    (route === "STRATEGY"
      ? "The constitutional structure cannot hold this decision under current authority conditions."
      : route === "DIAGNOSTIC"
      ? "A developing structural condition requires reinforcement before escalation."
      : "No structural constitutional failure detected at current evidence level.");

  const governanceImplication =
    routeSummary.description ||
    (route === "STRATEGY"
      ? "Escalation is constitutionally justified. Governed intervention is required before execution proceeds."
      : route === "DIAGNOSTIC"
      ? "Constitutional evidence is developing. Additional diagnostic layers will determine the required governance response."
      : "No constitutional escalation warranted. Continue with standard governance rhythm.");

  const recommendedNextMove =
    decision.recommendedInterventions[0] ??
    (route === "STRATEGY"
      ? "Advance to Team Assessment to confirm organisational execution capacity before intervention."
      : "Complete a Team Assessment to strengthen the constitutional reading with execution-layer evidence.");

  const earnedRoute: AssessmentResult["earnedRoute"] =
    route === "REJECT"
      ? {
          route: "WATCH",
          label: "Monitor and return",
          href: "/decision-centre",
          reason:
            "Constitutional posture is stable at current evidence level. Re-assess if conditions change.",
        }
      : {
          route: "NEXT_ASSESSMENT",
          label: "Continue to Team Assessment",
          href: "/diagnostics/team-assessment",
          reason:
            route === "STRATEGY"
              ? "Constitutional route confirmed. Team Assessment validates execution capacity against this structural reading."
              : "Build additional evidence through Team Assessment before determining the constitutional intervention.",
        };

  return {
    kind: "CONSTITUTIONAL_DIAGNOSTIC",
    title: routeSummary.title || "Constitutional reading",
    score: Math.round((report.authorityScore + report.interventionReadiness) / 2),
    band,
    primaryFinding,
    failurePattern,
    evidencePosture: "USER_REPORTED",
    governanceImplication,
    recommendedNextMove,
    consequenceTimeline: {
      sevenDays:
        route === "STRATEGY"
          ? "Constitutional ambiguity hardens into precedent; informal authority patterns solidify."
          : "Constitutional posture is stable; governance structures are functioning as designed.",
      thirtyDays:
        route === "STRATEGY"
          ? "Competing governance claims escalate; formal dispute or restructure becomes likely without intervention."
          : "No structural changes required. Conduct a review if significant decisions are made.",
      ninetyDays:
        route === "STRATEGY"
          ? "Constitutional failure is cited in external reviews; recovery requires full structural redesign."
          : "Governance integrity maintained. Normal oversight cycle applies.",
    },
    earnedRoute,
    recordStatus: {
      level: "SESSION_PREVIEW",
      label: "Session preview — sign in to retain this record.",
    },
  };
}

// ─── Enterprise Assessment Mapper ────────────────────────────────────────────

export function mapEnterpriseToAssessmentResult(
  result: EnterpriseAssessmentResult,
): AssessmentResult {
  const percentScore = result.percentScore ?? 50;
  const bandLabel = result.band ?? "STRAINED";
  const band = bandLabel === "ALIGNED" ? "WATCH" : bandLabel === "DRIFTING" ? "CONCERN" : "ALERT";
  const fragility = result.fragilitySignal ?? null;
  const weakestDomain = result.weakestDomains?.[0] ?? null;

  const primaryFinding =
    fragility === "HIGH"
      ? "The operating structure is under distributed strain."
      : `Enterprise showing a ${bandLabel.toLowerCase()} posture. Pressure concentrated in ${weakestDomain ?? "weakest domain"}.`;

  const failurePattern =
    fragility === "HIGH"
      ? "Multiple operating domains are adapting to unresolved governance weakness instead of correcting it."
      : "One domain is carrying more structural load than it should.";

  const governanceImplication =
    fragility === "HIGH" || fragility === "MEDIUM"
      ? "Decisions are already being made by whoever acts first rather than by who should decide."
      : "Institutional drag compounds quietly. Execution slows without a single visible failure.";

  const recommendedNextMove =
    weakestDomain
      ? `Name the single decision in ${weakestDomain} that has been deferred longest. Assign one accountable owner.`
      : "Identify which governance boundary is being crossed most often and enforce it.";

  return {
    kind: "ENTERPRISE_ASSESSMENT",
    title: "Enterprise Assessment",
    score: percentScore,
    band,
    primaryFinding,
    failurePattern,
    evidencePosture: "USER_REPORTED",
    governanceImplication,
    recommendedNextMove,
    consequenceTimeline: {
      sevenDays: "The condition remains active.",
      thirtyDays: fragility === "HIGH" || fragility === "MEDIUM"
        ? "Each cycle deepens the informal authority structure."
        : "Institutional drag accumulates without visible escalation.",
      ninetyDays: fragility === "HIGH"
        ? "Structural impairment shifts from operational friction to governance failure."
        : "Recovery cost increases non-linearly.",
    },
    earnedRoute: {
      route: "DECISION_CENTRE",
      label: "Open in Decision Centre",
      href: "/decision-centre",
      reason: "Save this assessment to Decision Centre for continued monitoring.",
    },
    recordStatus: {
      level: "SESSION_PREVIEW",
      label: "Session preview — sign in to retain this record.",
    },
  };
}

// ─── Enterprise Decision Result Mapper (inline assessment page) ───────────────
// Maps EnterpriseDecisionResult (from decision-engine) + totalPct into AssessmentResult.
// Distinct from mapEnterpriseToAssessmentResult which maps EnterpriseAssessmentResult
// (from the alignment-based assessment flow).

export function mapEnterpriseDecisionToAssessmentResult(
  reading: EnterpriseDecisionResult,
  totalPct: number,
  sections: EnterpriseSectionScore[],
): AssessmentResult {
  const band =
    reading.band === "ESCALATE"
      ? "CRITICAL"
      : reading.band === "FRAGILE"
      ? "SEVERE"
      : reading.band === "WATCH"
      ? "MODERATE"
      : "WATCH";

  const weakSections = sections.filter((s) => s.pct < 50);

  const earnedRoute: AssessmentResult["earnedRoute"] =
    reading.route === "EXECUTIVE_REPORTING"
      ? {
          route: "EXECUTIVE_REPORTING",
          label: "Request Executive Reporting",
          href: "/diagnostics/executive-reporting",
          reason:
            "Enterprise-level severity requires board-grade consequence framing before operational response.",
        }
      : reading.route === "STRATEGY_ROOM"
      ? {
          route: "STRATEGY_ROOM",
          label: "Enter Strategy Room",
          href: "/strategy-room",
          reason:
            "Enterprise-scale drift requires coordinated execution oversight.",
        }
      : {
          route: "WATCH",
          label: "Monitor in Decision Centre",
          href: "/decision-centre",
          reason:
            "Enterprise indicators are within acceptable range. Monitor and re-assess if conditions change.",
        };

  return {
    kind: "ENTERPRISE_ASSESSMENT",
    title: reading.patternTitle || "Enterprise assessment",
    score: totalPct,
    band,
    primaryFinding: reading.primaryReading,
    failurePattern:
      reading.dominantFailure
        ? `Primary structural failure concentrated in: ${reading.dominantFailure}.`
        : reading.escalationNote || "Distributed operating strain across enterprise domains.",
    evidencePosture: "USER_REPORTED",
    governanceImplication:
      reading.route === "EXECUTIVE_REPORTING"
        ? "Decisions are already being made by whoever acts first rather than by who should decide. Governance mechanisms are at or near capacity."
        : weakSections.length > 0
        ? `Operating strain concentrated in ${weakSections.map((s) => s.title).join(", ")}. Ungoverned, this pattern will embed.`
        : "Enterprise posture shows developing strain. Monitoring with structured governance review is warranted.",
    recommendedNextMove: reading.firstAction,
    consequenceTimeline: {
      sevenDays:
        reading.route === "EXECUTIVE_REPORTING"
          ? "Enterprise-level execution failure signals reach board-grade stakeholders; escalation imminent."
          : "Enterprise drift continues at the current rate with no natural correction mechanism.",
      thirtyDays:
        reading.route === "EXECUTIVE_REPORTING"
          ? "Systemic pattern is now externally observable; market-facing consequence exposure begins."
          : "Cross-functional coordination failures become visible to leadership; reputational exposure begins.",
      ninetyDays:
        reading.route === "EXECUTIVE_REPORTING"
          ? "Enterprise-grade reversal required; commercial, regulatory, and reputational cost compounds."
          : "Enterprise drift is now embedded in operational norms; a structured governance reset is required.",
    },
    earnedRoute,
    recordStatus: {
      level: "SESSION_PREVIEW",
      label: "Session preview — sign in to retain this record.",
    },
  };
}
