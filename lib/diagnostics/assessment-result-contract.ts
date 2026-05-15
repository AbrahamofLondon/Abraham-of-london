/**
 * lib/diagnostics/assessment-result-contract.ts
 *
 * Canonical governed assessment result contract.
 *
 * Every assessment surface — Fast Diagnostic, Purpose Alignment,
 * Constitutional Diagnostic, Team Assessment, Enterprise Assessment —
 * must produce exactly this shape before reaching the result surface.
 *
 * This is a READ-SIDE contract. Persistence uses existing Prisma models.
 * This type is the normalised projection that components and DC use.
 */

// ─── Assessment kind ─────────────────────────────────────────────────────────

export type AssessmentKind =
  | "FAST_DIAGNOSTIC"
  | "PURPOSE_ALIGNMENT"
  | "CONSTITUTIONAL_DIAGNOSTIC"
  | "TEAM_ASSESSMENT"
  | "ENTERPRISE_ASSESSMENT";

// ─── Evidence posture ─────────────────────────────────────────────────────────

export type EvidencePosture =
  | "USER_REPORTED"
  | "SYSTEM_INFERRED"
  | "OPERATOR_VERIFIED"
  | "THIRD_PARTY";

// ─── Earned route ─────────────────────────────────────────────────────────────

export type EarnedRoute =
  | "WATCH"
  | "NEXT_ASSESSMENT"
  | "DECISION_CENTRE"
  | "EXECUTIVE_REPORTING"
  | "STRATEGY_ROOM"
  | "RETAINER_OVERSIGHT"
  | "COUNSEL_REVIEW"
  | "BOARDROOM";

// ─── Consequence timeline ─────────────────────────────────────────────────────

export type ConsequenceTimeline = {
  sevenDays: string;
  thirtyDays: string;
  ninetyDays: string;
};

// ─── Assessment result ────────────────────────────────────────────────────────

export type AssessmentResult = {
  /** Which product surface produced this result */
  kind: AssessmentKind;
  /** Human-readable decision or case title */
  title: string;
  /** 0–100 severity score if quantifiable, otherwise null */
  score?: number | null;
  /** Named severity band (e.g. "ALERT", "WATCH", "CRITICAL") */
  band: string;
  /** Single-sentence primary finding */
  primaryFinding: string;
  /** The structural failure pattern driving this finding */
  failurePattern: string;
  /** Evidence quality and source classification */
  evidencePosture: EvidencePosture;
  /** Governance-level consequence of inaction */
  governanceImplication: string;
  /** The one concrete move required right now */
  recommendedNextMove: string;
  /** 7 / 30 / 90 day consequence projection */
  consequenceTimeline: ConsequenceTimeline;
  /** The single primary earned next action */
  earnedRoute: {
    route: EarnedRoute;
    label: string;
    href: string;
    reason: string;
  };
  /** Record persistence status */
  recordStatus: {
    level: "SESSION_PREVIEW" | "ACCOUNT_RECORD" | "GOVERNED_CASE";
    label: string;
    caseId?: string | null;
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a human-readable label for a given EvidencePosture. */
export function describeEvidencePosture(posture: EvidencePosture): string {
  switch (posture) {
    case "USER_REPORTED":
      return "User-reported — system has not independently verified this information.";
    case "SYSTEM_INFERRED":
      return "System-inferred from pattern matching across evidence nodes.";
    case "OPERATOR_VERIFIED":
      return "Operator-verified — a qualified reviewer has confirmed this finding.";
    case "THIRD_PARTY":
      return "Third-party sourced — derived from external data supplied to the system.";
  }
}

/** Returns the earned route href for a given EarnedRoute. */
export function earnedRouteHref(route: EarnedRoute): string {
  switch (route) {
    case "WATCH":
      return "/decision-centre";
    case "NEXT_ASSESSMENT":
      return "/diagnostics/fast";
    case "DECISION_CENTRE":
      return "/decision-centre";
    case "EXECUTIVE_REPORTING":
      return "/diagnostics/executive-reporting";
    case "STRATEGY_ROOM":
      return "/strategy-room";
    case "RETAINER_OVERSIGHT":
      return "/strategy-room";
    case "COUNSEL_REVIEW":
      return "/decision-centre";
    case "BOARDROOM":
      return "/strategy-room";
  }
}

/** Returns a short label for a given EarnedRoute. */
export function earnedRouteLabel(route: EarnedRoute): string {
  switch (route) {
    case "WATCH":
      return "Monitor in Decision Centre";
    case "NEXT_ASSESSMENT":
      return "Run the next assessment";
    case "DECISION_CENTRE":
      return "Open in Decision Centre";
    case "EXECUTIVE_REPORTING":
      return "Request Executive Reporting";
    case "STRATEGY_ROOM":
      return "Enter Strategy Room";
    case "RETAINER_OVERSIGHT":
      return "Activate Retainer Oversight";
    case "COUNSEL_REVIEW":
      return "Request Counsel Review";
    case "BOARDROOM":
      return "Escalate to Boardroom";
  }
}

/** Record status label for each persistence level. */
export function recordStatusLabel(
  level: AssessmentResult["recordStatus"]["level"],
  caseId?: string | null,
): string {
  switch (level) {
    case "SESSION_PREVIEW":
      return "Session preview — sign in to retain this record.";
    case "ACCOUNT_RECORD":
      return caseId ? `Account record — case ${caseId}` : "Account record — saved to your Decision Centre.";
    case "GOVERNED_CASE":
      return caseId ? `Governed case — ${caseId}` : "Governed case — case ID assigned.";
  }
}
