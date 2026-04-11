import type {
  ExecutiveCommandCentreData,
  ConstitutionalHealthBand,
  RouteDistributionItem,
  LiveCaseRow,
  OperatorSummaryRow,
  DriftRow,
  TribunalRow,
  CommandMetricCard,
} from "./command-centre-types";
import { listCaseMemories } from "./memory-store";
import { listConstitutionalEvents, listDriftFlags, listTribunalCases } from "./observability-store";
import { buildConstitutionalDashboardSnapshot } from "./observability-dashboard";

function round(value: number, places = 1): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function pct(part: number, total: number): number {
  if (!total) return 0;
  return round((part / total) * 100, 1);
}

function healthBand(input: {
  routeIntegrityScore: number;
  recommendationIntegrityScore: number;
  openTribunals: number;
  totalCriticals: number;
  totalBreaches: number;
}): ConstitutionalHealthBand {
  if (
    input.routeIntegrityScore < 45 ||
    input.recommendationIntegrityScore < 45 ||
    input.totalCriticals >= 3 ||
    input.openTribunals >= 6
  ) {
    return "BREACH_RISK";
  }

  if (
    input.routeIntegrityScore < 60 ||
    input.recommendationIntegrityScore < 60 ||
    input.totalBreaches >= 8 ||
    input.openTribunals >= 3
  ) {
    return "STRAINED";
  }

  if (
    input.routeIntegrityScore < 75 ||
    input.recommendationIntegrityScore < 75 ||
    input.totalBreaches >= 3
  ) {
    return "WATCH";
  }

  return "SOUND";
}

function buildRouteDistribution(): RouteDistributionItem[] {
  const cases = listCaseMemories();
  const total = cases.length;

  const rejectCount = cases.filter((x) => x.latestRoute === "REJECT").length;
  const diagnosticCount = cases.filter((x) => x.latestRoute === "DIAGNOSTIC").length;
  const strategyCount = cases.filter((x) => x.latestRoute === "STRATEGY").length;

  return [
    {
      route: "REJECT",
      count: rejectCount,
      percentage: pct(rejectCount, total),
    },
    {
      route: "DIAGNOSTIC",
      count: diagnosticCount,
      percentage: pct(diagnosticCount, total),
    },
    {
      route: "STRATEGY",
      count: strategyCount,
      percentage: pct(strategyCount, total),
    },
  ];
}

function buildLiveCases(): LiveCaseRow[] {
  const events = listConstitutionalEvents();
  const breachCountByCase = new Map<string, number>();

  for (const event of events) {
    if (!event.caseKey) continue;
    if (event.type !== "CONSTITUTIONAL_BREACH") continue;
    breachCountByCase.set(
      event.caseKey,
      (breachCountByCase.get(event.caseKey) ?? 0) + 1,
    );
  }

  return listCaseMemories()
    .map((item) => ({
      caseKey: item.caseKey,
      operatorKey: item.operatorKey,
      latestRoute: item.latestRoute,
      confidence: item.latestConfidence,
      seriousness: item.latestSeriousness,
      readinessScore: item.latestReadinessScore,
      trajectory: item.latestTrajectory || "STABLE",
      lastUpdatedAt: item.updatedAt,
      openBreaches: breachCountByCase.get(item.caseKey) ?? 0,
    }))
    .sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt))
    .slice(0, 24);
}

function buildOperators(): OperatorSummaryRow[] {
  const cases = listCaseMemories();
  const grouped = new Map<string, typeof cases>();

  for (const item of cases) {
    const arr = grouped.get(item.operatorKey) ?? [];
    arr.push(item);
    grouped.set(item.operatorKey, arr);
  }

  return Array.from(grouped.entries())
    .map(([operatorKey, rows]) => {
      const totalCases = rows.length;
      const strategyCount = rows.filter((x) => x.latestRoute === "STRATEGY").length;
      const diagnosticCount = rows.filter((x) => x.latestRoute === "DIAGNOSTIC").length;
      const rejectCount = rows.filter((x) => x.latestRoute === "REJECT").length;
      const avgConfidence =
        rows.reduce((sum, x) => sum + x.latestConfidence, 0) / Math.max(1, rows.length);

      return {
        operatorKey,
        totalCases,
        strategyCount,
        diagnosticCount,
        rejectCount,
        averageConfidence: round(avgConfidence * 100, 1),
        repeatedWeakSignal: rejectCount >= 3 && strategyCount === 0,
        lastSeenAt: rows
          .map((x) => x.updatedAt)
          .sort((a, b) => b.localeCompare(a))[0] ?? "",
      };
    })
    .sort((a, b) => b.totalCases - a.totalCases)
    .slice(0, 20);
}

function buildDriftRows(): DriftRow[] {
  return listDriftFlags()
    .map((item) => ({
      id: item.id,
      category: item.category,
      severity: item.severity,
      title: item.title,
      affectedCaseCount: item.affectedCaseKeys.length,
      createdAt: item.createdAt,
    }))
    .slice(0, 20);
}

function buildTribunalRows(): TribunalRow[] {
  return listTribunalCases()
    .map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      reviewers: item.assignedReviewers.length,
      findingsCount: item.findings.length,
      updatedAt: item.updatedAt,
    }))
    .slice(0, 20);
}

function buildMetrics(): {
  snapshot: ReturnType<typeof buildConstitutionalDashboardSnapshot>;
  cards: CommandMetricCard[];
} {
  const snapshot = buildConstitutionalDashboardSnapshot();

  const cards: CommandMetricCard[] = [
    {
      id: "route-integrity",
      label: "Route integrity",
      value: `${snapshot.routeIntegrityScore}`,
      tone:
        snapshot.routeIntegrityScore >= 75
          ? "good"
          : snapshot.routeIntegrityScore >= 60
            ? "warn"
            : "bad",
      help: "How trustworthy route assignment has been over recent learning cycles.",
    },
    {
      id: "recommendation-integrity",
      label: "Recommendation integrity",
      value: `${snapshot.recommendationIntegrityScore}`,
      tone:
        snapshot.recommendationIntegrityScore >= 75
          ? "good"
          : snapshot.recommendationIntegrityScore >= 60
            ? "warn"
            : "bad",
      help: "How often surfaced guidance appears to hold up downstream.",
    },
    {
      id: "breaches",
      label: "Active breach load",
      value: `${snapshot.totalBreaches}`,
      tone:
        snapshot.totalBreaches <= 2
          ? "good"
          : snapshot.totalBreaches <= 7
            ? "warn"
            : "bad",
      help: "Logged constitutional breach events currently on the books.",
    },
    {
      id: "criticals",
      label: "Critical events",
      value: `${snapshot.totalCriticals}`,
      tone:
        snapshot.totalCriticals === 0
          ? "good"
          : snapshot.totalCriticals <= 2
            ? "warn"
            : "bad",
      help: "Critical constitutional events requiring executive attention.",
    },
    {
      id: "tribunals",
      label: "Open tribunals",
      value: `${snapshot.openTribunals}`,
      tone:
        snapshot.openTribunals === 0
          ? "good"
          : snapshot.openTribunals <= 2
            ? "warn"
            : "bad",
      help: "Formal drift reviews currently unresolved.",
    },
    {
      id: "drift-pressure",
      label: "Tribunal pressure",
      value: `${snapshot.tribunalPressureScore}`,
      tone:
        snapshot.tribunalPressureScore < 20
          ? "good"
          : snapshot.tribunalPressureScore < 45
            ? "warn"
            : "bad",
      help: "Composite strain score from open tribunals and serious breaches.",
    },
  ];

  return { snapshot, cards };
}

function buildNotes(
  band: ConstitutionalHealthBand,
  distribution: RouteDistributionItem[],
): string[] {
  const notes: string[] = [];

  const strategy = distribution.find((x) => x.route === "STRATEGY")?.percentage ?? 0;
  const diagnostic = distribution.find((x) => x.route === "DIAGNOSTIC")?.percentage ?? 0;
  const reject = distribution.find((x) => x.route === "REJECT")?.percentage ?? 0;

  if (band === "BREACH_RISK") {
    notes.push("Constitutional strain is high. The estate needs formal review, not cosmetic optimisation.");
  } else if (band === "STRAINED") {
    notes.push("The estate is still functioning, but governance pressure is visible and rising.");
  } else if (band === "WATCH") {
    notes.push("Core routing remains viable, but integrity is no longer strong enough to ignore.");
  } else {
    notes.push("The estate is operating within acceptable constitutional tolerances.");
  }

  if (strategy > 45) {
    notes.push("Strategy routing share is unusually high. Check for over-escalation or weak middle-layer discipline.");
  }

  if (diagnostic < 15) {
    notes.push("Diagnostic holding appears too thin. The estate may be collapsing nuance into binary routing.");
  }

  if (reject > 55) {
    notes.push("Rejection density is heavy. Review whether seriousness and readiness are being read too harshly.");
  }

  return notes;
}

export function buildExecutiveCommandCentreData(): ExecutiveCommandCentreData {
  const distribution = buildRouteDistribution();
  const { snapshot, cards } = buildMetrics();
  const band = healthBand(snapshot);

  return {
    generatedAt: new Date().toISOString(),
    healthBand: band,
    metrics: cards,
    routeDistribution: distribution,
    liveCases: buildLiveCases(),
    operators: buildOperators(),
    driftFlags: buildDriftRows(),
    tribunals: buildTribunalRows(),
    notes: buildNotes(band, distribution),
  };
}