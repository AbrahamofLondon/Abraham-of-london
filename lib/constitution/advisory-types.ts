export type AdvisoryActionType =
  | "HOLD"
  | "DIAGNOSE"
  | "STABILISE"
  | "ESCALATE"
  | "INTERVENE"
  | "REJECT";

export type AdvisoryPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AdvisoryRecommendation = {
  id: string;
  title: string;
  rationale: string;
  actionType: AdvisoryActionType;
  priority: AdvisoryPriority;
  owner: string;
  horizon: "NOW" | "NEXT_7_DAYS" | "NEXT_30_DAYS" | "LONGER_TERM";
};

export type AdvisoryMemo = {
  route: "REJECT" | "DIAGNOSTIC" | "STRATEGY";
  posture: string;
  advisoryPosition: string;
  immediateInstruction: string;
  recommendations: AdvisoryRecommendation[];
  escalationPermitted: boolean;
  escalationReason?: string;
  warnings: string[];
};