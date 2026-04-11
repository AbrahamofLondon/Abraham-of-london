export type RouteBucket = "REJECT" | "DIAGNOSTIC" | "STRATEGY";

export type CommandMetricCard = {
  id: string;
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn" | "bad";
  help?: string;
};

export type RouteDistributionItem = {
  route: RouteBucket;
  count: number;
  percentage: number;
};

export type LiveCaseRow = {
  caseKey: string;
  operatorKey: string;
  latestRoute: RouteBucket;
  confidence: number;
  seriousness: number;
  readinessScore: number;
  trajectory: string;
  lastUpdatedAt: string;
  openBreaches: number;
};

export type OperatorSummaryRow = {
  operatorKey: string;
  totalCases: number;
  strategyCount: number;
  diagnosticCount: number;
  rejectCount: number;
  averageConfidence: number;
  repeatedWeakSignal: boolean;
  lastSeenAt: string;
};

export type DriftRow = {
  id: string;
  category: string;
  severity: string;
  title: string;
  affectedCaseCount: number;
  createdAt: string;
};

export type TribunalRow = {
  id: string;
  title: string;
  status: string;
  reviewers: number;
  findingsCount: number;
  updatedAt: string;
};

export type ConstitutionalHealthBand =
  | "SOUND"
  | "WATCH"
  | "STRAINED"
  | "BREACH_RISK";

export type ExecutiveCommandCentreData = {
  generatedAt: string;
  healthBand: ConstitutionalHealthBand;
  metrics: CommandMetricCard[];
  routeDistribution: RouteDistributionItem[];
  liveCases: LiveCaseRow[];
  operators: OperatorSummaryRow[];
  driftFlags: DriftRow[];
  tribunals: TribunalRow[];
  notes: string[];
};