/**
 * lib/living-intelligence/living-product-view-model.ts
 *
 * Canonical output shape that living components consume.
 * This is the bridge between the living intelligence engine and the living UI.
 *
 * Every living component should consume this view model or a slice of it.
 * No component should render without real data from this model.
 */

export type EvidencePosture =
  | "verified"
  | "strongly_indicated"
  | "weakly_indicated"
  | "unverified"
  | "contradictory"
  | "needs_review";

export type ComponentBindingStatus =
  | "wired_real"
  | "wired_inferred"
  | "component_ready_unwired"
  | "decorative_or_static_risk"
  | "needs_review"
  | "missing";

export type DoctrineView = {
  claimId: string;
  posture: EvidencePosture;
  evidence: string[];
  contradictionCount: number;
};

export type FindingView = {
  id: string;
  title: string;
  domain: string;
  severity: string;
  evidencePosture: string;
  confidence: string;
  blocksDeployment: boolean;
  governedTension: boolean;
  recommendation: string;
  affectedItems: string[];
};

export type MemoryFindingView = {
  signature: string;
  title: string;
  status: string;
  recurrenceCount: number;
  lastSeen: string;
};

export type MemoryView = {
  newIssues: number;
  repeatedIssues: number;
  resolvedIssues: number;
  regressions: number;
  criticalFileChanges: number;
  rememberedFindings: MemoryFindingView[];
};

export type LivingComponentView = {
  component: string;
  status: ComponentBindingStatus;
  evidence: string[];
  requiredNextBinding?: string;
};

export type GovernedActionView = {
  label: string;
  reason: string;
  requiredEvidence: string[];
  owner: string;
  safeToAutomate: boolean;
};

export type LivingProductViewModel = {
  generatedAt: string;
  engineVersion: string;
  doctrine: DoctrineView[];
  findings: FindingView[];
  memory: MemoryView;
  livingComponents: LivingComponentView[];
  refusedToInfer: string[];
  nextGovernedActions: GovernedActionView[];
};
