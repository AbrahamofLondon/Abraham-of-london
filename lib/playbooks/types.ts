export type PlaybookFailureMode =
  | "SIGNAL_FAILURE"
  | "AUTHORITY_BLINDSPOT"
  | "EXECUTION_DRIFT"
  | "SYSTEMIC_BREAKDOWN"
  | "TRUST_EROSION"
  | "GOVERNANCE_FAILURE"
  | "RISK_POSTURE_DEGRADATION"
  | "CULTURAL_DEFLATION"
  | "STRUCTURAL_MISALIGNMENT";

export type PlaybookReadiness =
  | "FRAGILE"
  | "EMERGING"
  | "STABILIZING"
  | "EXECUTION_READY"
  | "SOVEREIGN";

export type PlaybookRoute =
  | "CONSTITUTIONAL"
  | "TEAM"
  | "ENTERPRISE"
  | "EXECUTIVE_REPORTING"
  | "STRATEGY_ROOM";

export type PlaybookAuthorityType = "DIRECT" | "PROXY" | "UNCLEAR";

export type PlaybookDefinition = {
  id: string;
  title: string;
  summary: string;
  href: string;
  failureModes: PlaybookFailureMode[];
  readiness: PlaybookReadiness[];
  routes: PlaybookRoute[];
  dominantDomains?: string[];
  authorityTypes?: PlaybookAuthorityType[];
  severity?: "LOW" | "MEDIUM" | "HIGH";
};

export type PlaybookMatchContext = {
  route: PlaybookRoute;
  readiness: PlaybookReadiness | string;
  failureModes: string[];
  dominantDomains?: string[];
  authorityType?: string | null;
  /** From accumulated thread: team fragility status */
  teamFragility?: string | null;
  /** From accumulated thread: enterprise structural pattern */
  enterprisePattern?: string | null;
};

export type MatchedPlaybook = PlaybookDefinition & {
  score: number;
  reasons: string[];
};
