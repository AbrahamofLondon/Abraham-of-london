export type TrajectoryInput = {
  snapshots?: Array<{
    timestamp: string;
    escalationLevel?: number;
    severity?: number;
    unresolvedTensionCount?: number;
  }>;
  currentDiagnosticState?: string;
  tensionSeverity?: number;
  escalationTrend?: number;
  failureDensity?: number;
  interventionHistory?: Array<{ status: string; effectScore?: number }>;
  economicsExposure?: number;
};

export type TrajectoryResult = {
  trajectory: "stabilising" | "drifting" | "fragilising" | "escalating";
  forecastWindowDays: number;
  confidence: number;
  keyDrivers: string[];
  scenarioSummary: string;
};

export type ScenarioResult = {
  scenario: "if_unchanged" | "if_corrective_action_taken" | "if_escalation_delayed";
  likelyOutcomeCategory: string;
  exposureMovement: "down" | "flat" | "up";
  confidence: number;
  uncertaintyNote: string;
};

function trend(values: number[]): number {
  if (values.length < 2) return 0;
  return (values[values.length - 1] ?? 0) - (values[0] ?? 0);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function resolveTrajectory(input: TrajectoryInput): TrajectoryResult {
  const snapshots = input.snapshots || [];
  const severityTrend = trend(snapshots.map((s) => s.severity ?? 0));
  const escalationTrend = input.escalationTrend ?? trend(snapshots.map((s) => s.escalationLevel ?? 0));
  const tensionSeverity = input.tensionSeverity ?? snapshots.at(-1)?.severity ?? 50;
  const failureDensity = input.failureDensity ?? snapshots.at(-1)?.unresolvedTensionCount ?? 0;
  const interventionEffect = (input.interventionHistory || []).reduce(
    (sum, item) => sum + (item.status === "completed" ? item.effectScore ?? 5 : 0),
    0,
  );

  const pressure = tensionSeverity + failureDensity * 6 + escalationTrend * 10 + severityTrend - interventionEffect;
  const trajectory =
    pressure >= 85
      ? "escalating"
      : pressure >= 65
        ? "fragilising"
        : pressure >= 40
          ? "drifting"
          : "stabilising";

  const keyDrivers: string[] = [];
  if (severityTrend > 0) keyDrivers.push("severity rising across snapshots");
  if (escalationTrend > 0) keyDrivers.push("escalation level increasing");
  if (failureDensity >= 3) keyDrivers.push("failure density is elevated");
  if ((input.economicsExposure || 0) > 250000) keyDrivers.push("financial exposure is material");
  if (interventionEffect > 0) keyDrivers.push("completed intervention history is reducing pressure");
  if (!keyDrivers.length) keyDrivers.push("current diagnostic state is the dominant input");

  return {
    trajectory,
    forecastWindowDays: snapshots.length >= 2 ? 90 : 45,
    confidence: clamp(45 + snapshots.length * 12 + Math.min(20, keyDrivers.length * 4), 35, 90),
    keyDrivers,
    scenarioSummary:
      trajectory === "escalating"
        ? "Without correction, current pressure is likely to compound inside the forecast window."
        : trajectory === "fragilising"
          ? "The system is weakening but still has room for governed correction."
          : trajectory === "drifting"
            ? "The system is not collapsing, but unresolved tensions are likely to persist."
            : "The current pattern suggests improvement or contained strain.",
  };
}

export function buildTrajectoryScenarios(result: TrajectoryResult): ScenarioResult[] {
  const severe = result.trajectory === "escalating" || result.trajectory === "fragilising";
  return [
    {
      scenario: "if_unchanged",
      likelyOutcomeCategory: severe ? "pressure compounds" : "drift persists",
      exposureMovement: severe ? "up" : "flat",
      confidence: result.confidence,
      uncertaintyNote: "Rule-based projection from current trajectory; not an ML prediction.",
    },
    {
      scenario: "if_corrective_action_taken",
      likelyOutcomeCategory: severe ? "strain stabilises" : "condition improves",
      exposureMovement: "down",
      confidence: clamp(result.confidence - 8, 20, 85),
      uncertaintyNote: "Assumes intervention is aligned to the highest-pressure drivers.",
    },
    {
      scenario: "if_escalation_delayed",
      likelyOutcomeCategory: severe ? "avoidable escalation risk rises" : "watch condition hardens",
      exposureMovement: "up",
      confidence: clamp(result.confidence - 5, 20, 85),
      uncertaintyNote: "Delay scenario is sensitive to external pressure and leadership authority.",
    },
  ];
}
