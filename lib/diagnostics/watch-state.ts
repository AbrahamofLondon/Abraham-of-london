export type WatchStateInput = {
  source?: string | null;
  state?: string | null;
  score?: number | null;
  watchpoints?: string[];
  nextRoute?: string | null;
};

export function buildWatchViewModel(input: WatchStateInput) {
  const score = typeof input.score === "number" ? input.score : null;
  const currentState =
    input.state || (score === null ? "WATCH" : score >= 70 ? "STABLE WATCH" : "WATCH");
  const watchpoints = input.watchpoints?.length
    ? input.watchpoints
    : [
        "whether leadership coherence degrades",
        "whether governance delay becomes repeated",
        "whether execution variance spreads across teams",
      ];

  return {
    currentState,
    source: input.source || "diagnostic_ladder",
    escalationNotJustifiedBecause:
      "The signal is real, but the evidence does not yet justify Executive Reporting or Strategy Room escalation.",
    watchedConditions: watchpoints,
    nextValidMove:
      input.nextRoute === "EXECUTIVE_REPORTING"
        ? "/diagnostics/executive-reporting"
        : "/diagnostics/enterprise-assessment",
    followUpRecommended: true,
    monitoringRecommended: true,
    cadence: score !== null && score < 65 ? "monthly" : "quarterly",
  };
}
