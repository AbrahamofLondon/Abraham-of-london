/**
 * lib/diagnostics/earned-route.ts
 *
 * Deterministic earned route derivation.
 *
 * Rules (in priority order):
 *   1. Insufficient evidence → NEXT_ASSESSMENT (no fake admission)
 *   2. Enterprise + high severity → EXECUTIVE_REPORTING or RETAINER_OVERSIGHT
 *   3. Team + severe + verified evidence → STRATEGY_ROOM
 *   4. Team + severe + user-reported only → ENTERPRISE_ASSESSMENT gate
 *   5. Severe authority/accountability gap → STRATEGY_ROOM
 *   6. Severe non-authority finding → EXECUTIVE_REPORTING
 *   7. Moderate drift → DECISION_CENTRE
 *   8. Mild / low severity → WATCH
 *
 * Every path returns exactly one EarnedRoute. No ambiguity.
 */

import type { AssessmentKind, EarnedRoute, EvidencePosture } from "./assessment-result-contract";
import { earnedRouteHref, earnedRouteLabel } from "./assessment-result-contract";

// ─── Input ────────────────────────────────────────────────────────────────────

export type EarnedRouteInput = {
  kind: AssessmentKind;
  /** The band string from the assessment (e.g. "ALERT", "CRITICAL", "weak") */
  band: string;
  /** Primary condition key or label (used for authority gap detection) */
  primaryFinding: string;
  /** Evidence quality */
  evidencePosture: EvidencePosture;
  /** 0–100 severity score, if available */
  score?: number | null;
};

// ─── Output ───────────────────────────────────────────────────────────────────

export type EarnedRouteResult = {
  route: EarnedRoute;
  label: string;
  href: string;
  reason: string;
};

// ─── Severity helpers ─────────────────────────────────────────────────────────

const SEVERE_BANDS = new Set([
  "critical", "severe", "high", "alert", "red", "urgent",
  "CRITICAL", "SEVERE", "HIGH", "ALERT", "RED", "URGENT",
]);

const MODERATE_BANDS = new Set([
  "moderate", "significant", "amber", "yellow", "strained", "watch",
  "MODERATE", "SIGNIFICANT", "AMBER", "YELLOW", "STRAINED", "WATCH",
]);

const INSUFFICIENT_BANDS = new Set([
  "insufficient", "insufficient_evidence", "incomplete", "unclassified",
  "INSUFFICIENT", "INSUFFICIENT_EVIDENCE", "INCOMPLETE", "UNCLASSIFIED",
]);

function isSevereBand(band: string): boolean {
  return SEVERE_BANDS.has(band);
}

function isModerateBand(band: string): boolean {
  return MODERATE_BANDS.has(band) && !SEVERE_BANDS.has(band);
}

function isInsufficientBand(band: string): boolean {
  return INSUFFICIENT_BANDS.has(band);
}

function isHighSeverityScore(score: number | null | undefined): boolean {
  return score !== null && score !== undefined && score >= 70;
}

function isModerateSeverityScore(score: number | null | undefined): boolean {
  return score !== null && score !== undefined && score >= 40 && score < 70;
}

function hasVerifiedEvidence(evidencePosture: EvidencePosture): boolean {
  return evidencePosture === "OPERATOR_VERIFIED" || evidencePosture === "THIRD_PARTY";
}

/** Detects authority or accountability gap from the primary finding string. */
function isAuthorityOrAccountabilityGap(primaryFinding: string): boolean {
  const lower = primaryFinding.toLowerCase();
  return (
    lower.includes("authority") ||
    lower.includes("accountability") ||
    lower.includes("mandate") ||
    lower.includes("ownership") ||
    lower.includes("accountable") ||
    lower.includes("decision-maker") ||
    lower.includes("decision maker") ||
    lower.includes("no owner") ||
    lower.includes("unclear owner")
  );
}

// ─── Core derivation ──────────────────────────────────────────────────────────

/**
 * Derives the single primary earned route from an assessment result.
 *
 * Returns a complete EarnedRouteResult with label, href, and reason.
 * Never returns ambiguous or null — always produces one path forward.
 */
export function deriveEarnedRoute(input: EarnedRouteInput): EarnedRouteResult {
  const { kind, band, primaryFinding, evidencePosture, score } = input;

  const severe = isSevereBand(band) || isHighSeverityScore(score);
  const moderate = !severe && (isModerateBand(band) || isModerateSeverityScore(score));
  const insufficient = isInsufficientBand(band);

  // ── 1. Insufficient evidence — no admission without evidence ────────────────
  if (insufficient) {
    return result(
      "NEXT_ASSESSMENT",
      "Repair the evidence gap before this case can be governed. Run the Fast Diagnostic to classify the primary condition.",
    );
  }

  // ── 2. Enterprise Assessment ────────────────────────────────────────────────
  if (kind === "ENTERPRISE_ASSESSMENT") {
    if (severe) {
      return result(
        "EXECUTIVE_REPORTING",
        "Enterprise-level severity requires Executive Reporting to surface board-grade consequence framing.",
      );
    }
    if (moderate) {
      return result(
        "STRATEGY_ROOM",
        "Enterprise-scale drift requires coordinated execution oversight. Enter the Strategy Room to begin.",
      );
    }
    return result(
      "DECISION_CENTRE",
      "Monitor this case in Decision Centre and return when evidence matures.",
    );
  }

  // ── 3. Team Assessment ──────────────────────────────────────────────────────
  if (kind === "TEAM_ASSESSMENT") {
    if (severe && hasVerifiedEvidence(evidencePosture)) {
      return result(
        "STRATEGY_ROOM",
        "Verified severe team-level failure pattern qualifies this case for coordinated governance. Enter Strategy Room.",
      );
    }
    if (severe) {
      return result(
        "NEXT_ASSESSMENT",
        "Severe team issue requires independent verification before escalation. Run the Enterprise Assessment.",
      );
    }
    if (moderate) {
      return result(
        "DECISION_CENTRE",
        "Track this pattern in Decision Centre. Escalate if the condition persists across the next cycle.",
      );
    }
    return result(
      "WATCH",
      "Severity does not yet qualify for intervention. Monitor this case and re-assess after 30 days.",
    );
  }

  // ── 4. Fast Diagnostic, Purpose Alignment, Constitutional Diagnostic ────────
  if (severe) {
    if (isAuthorityOrAccountabilityGap(primaryFinding)) {
      return result(
        "STRATEGY_ROOM",
        "Severe authority or accountability gap detected. This pattern requires coordinated governance intervention.",
      );
    }
    return result(
      "EXECUTIVE_REPORTING",
      "Severity level requires board-grade consequence framing before operational response. Request Executive Reporting.",
    );
  }

  if (moderate) {
    return result(
      "DECISION_CENTRE",
      "Moderate finding is tracked and eligible for governed intervention. Open in Decision Centre.",
    );
  }

  // ── 5. Default: Watch ───────────────────────────────────────────────────────
  return result(
    "WATCH",
    "No immediate governance action is required. Monitor this case and return when evidence changes.",
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function result(route: EarnedRoute, reason: string): EarnedRouteResult {
  return {
    route,
    label: earnedRouteLabel(route),
    href: earnedRouteHref(route),
    reason,
  };
}
