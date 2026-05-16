/**
 * lib/product/stale-governed-case-detector.ts
 *
 * Pure logic for detecting and classifying stale governed cases.
 *
 * A case is "stale" when it has been open (status: active) without
 * meaningful activity for longer than the threshold window. Staleness
 * compounds accountability risk — a case that receives no attention
 * after a governed finding is not neutral; it is an implicit decision
 * to defer accountability.
 *
 * Thresholds:
 *   WATCH    ≥ 30 days since last activity
 *   ALERT    ≥ 60 days since last activity
 *   CRITICAL ≥ 90 days since last activity
 *
 * This module is pure logic. It does not call Prisma or any external
 * service. Pass in the case list; it returns the classified results.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type StalenessBand = "WATCH" | "ALERT" | "CRITICAL";

export type StaleCaseActionKind =
  | "RUN_NEXT_ASSESSMENT"
  | "REQUEST_RETURN_BRIEF"
  | "CLOSE_CASE"
  | "ESCALATE_TO_COUNSEL"
  | "SCHEDULE_REVIEW";

export type StaleCaseAction = {
  kind: StaleCaseActionKind;
  label: string;
  description: string;
  href: string;
  primary?: boolean;
};

export type StaleCaseInput = {
  caseId: string;
  title: string;
  lastActivityAt: Date | string;
  status: string;
  /** Whether this case has already had a Return Brief triggered */
  returnBriefTriggered?: boolean;
  /** Whether counsel escalation has been flagged */
  counselWarranted?: boolean;
};

export type StaleCaseResult = {
  caseId: string;
  title: string;
  band: StalenessBand;
  daysInactive: number;
  lastActivityAt: string;
  headline: string;
  consequence: string;
  actions: StaleCaseAction[];
};

// ─── Thresholds ───────────────────────────────────────────────────────────────

export const STALE_THRESHOLDS_DAYS = {
  WATCH: 30,
  ALERT: 60,
  CRITICAL: 90,
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(value: Date | string): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function classifyBand(daysInactive: number): StalenessBand | null {
  if (daysInactive >= STALE_THRESHOLDS_DAYS.CRITICAL) return "CRITICAL";
  if (daysInactive >= STALE_THRESHOLDS_DAYS.ALERT) return "ALERT";
  if (daysInactive >= STALE_THRESHOLDS_DAYS.WATCH) return "WATCH";
  return null;
}

function buildHeadline(band: StalenessBand, days: number): string {
  switch (band) {
    case "CRITICAL":
      return `${days} days without a governed move. Accountability risk is now material.`;
    case "ALERT":
      return `${days} days of inaction. The cost of delay is compounding.`;
    case "WATCH":
      return `${days} days since last activity. A decision is forming by default.`;
  }
}

function buildConsequence(band: StalenessBand): string {
  switch (band) {
    case "CRITICAL":
      return "A governed case that receives no attention for 90 days or more signals either implicit closure or structural avoidance. Either way, the accountability record is incomplete. If the underlying decision has been made, close the case. If it has not, the window for clean resolution is narrowing.";
    case "ALERT":
      return "Two months without a governed move means the decision is either being made informally or not at all. Both carry risk. Informal decisions made outside the governed record cannot be defended to a board, regulator, or client. The case needs a next move now.";
    case "WATCH":
      return "A month of inactivity is the first signal of decision drift. The case was opened because the situation warranted governance. That need has not gone away — it has accumulated without a record.";
  }
}

function buildActions(input: StaleCaseInput, band: StalenessBand): StaleCaseAction[] {
  const { caseId, returnBriefTriggered, counselWarranted } = input;

  const actions: StaleCaseAction[] = [
    {
      kind: "RUN_NEXT_ASSESSMENT",
      label: "Run the next assessment",
      description: "Update the governed record with a fresh diagnostic reading.",
      href: "/diagnostics/fast",
      primary: true,
    },
  ];

  if (!returnBriefTriggered) {
    actions.push({
      kind: "REQUEST_RETURN_BRIEF",
      label: "Request a Return Brief",
      description: "Generate a structured re-engagement document for this case.",
      href: `/decision-centre/case/${caseId}`,
    });
  }

  actions.push({
    kind: "SCHEDULE_REVIEW",
    label: "Schedule a review",
    description: "Log a formal review commitment against this case.",
    href: `/decision-centre/case/${caseId}`,
  });

  if (band === "ALERT" || band === "CRITICAL") {
    actions.push({
      kind: "CLOSE_CASE",
      label: "Close this case",
      description: "If the decision has been resolved, close the case to keep the record clean.",
      href: `/decision-centre/case/${caseId}`,
    });
  }

  if ((band === "CRITICAL" || counselWarranted) && !returnBriefTriggered) {
    actions.push({
      kind: "ESCALATE_TO_COUNSEL",
      label: "Escalate to counsel review",
      description: "Request a formal review if the case involves unresolved legal or fiduciary risk.",
      href: `/counsel`,
    });
  }

  return actions;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Classify a list of cases by staleness.
 *
 * Only cases with status "active" are evaluated.
 * Returns only cases that meet at least the WATCH threshold.
 * Results are sorted by daysInactive descending (most stale first).
 *
 * @param cases - Array of case inputs (any status; non-active filtered out)
 * @param now   - Reference date (defaults to current time; injectable for tests)
 */
export function detectStaleCases(
  cases: StaleCaseInput[],
  now: Date = new Date(),
): StaleCaseResult[] {
  const results: StaleCaseResult[] = [];

  for (const c of cases) {
    if (c.status !== "active") continue;

    const lastActivity = toDate(c.lastActivityAt);
    if (!lastActivity) continue;

    const daysInactive = daysBetween(lastActivity, now);
    const band = classifyBand(daysInactive);
    if (!band) continue;

    results.push({
      caseId: c.caseId,
      title: c.title,
      band,
      daysInactive,
      lastActivityAt: lastActivity.toISOString(),
      headline: buildHeadline(band, daysInactive),
      consequence: buildConsequence(band),
      actions: buildActions(c, band),
    });
  }

  return results.sort((a, b) => b.daysInactive - a.daysInactive);
}

/**
 * Returns a summary count broken down by band.
 */
export function staleCaseSummary(results: StaleCaseResult[]): {
  total: number;
  watch: number;
  alert: number;
  critical: number;
} {
  return {
    total: results.length,
    watch: results.filter((r) => r.band === "WATCH").length,
    alert: results.filter((r) => r.band === "ALERT").length,
    critical: results.filter((r) => r.band === "CRITICAL").length,
  };
}
