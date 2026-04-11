export type AuthorityType = "DIRECT" | "PROXY" | "UNCLEAR";
export type Route = "STRATEGY" | "DIAGNOSTIC" | "REJECT";
export type ReadinessTier =
  | "FRAGILE"
  | "EMERGING"
  | "STABILIZING"
  | "EXECUTION_READY"
  | "SOVEREIGN";

export type Posture =
  | "ORDERED"
  | "DRIFTING"
  | "MISALIGNED"
  | "DISORDERED";

export type FailureMode =
  | "narrative_incoherence"
  | "authority_ambiguity"
  | "execution_fragmentation"
  | "governance_erosion"
  | "trust_erosion";

export type ConstitutionalResult = {
  route: Route;
  confidence: number;
  clarity: number;
  coherence: number;
  readinessScore: number;
  readinessTier: ReadinessTier;
  authority: AuthorityType;
  posture: Posture;
  failureModes: FailureMode[];
  disqualifiers: string[];
};