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
