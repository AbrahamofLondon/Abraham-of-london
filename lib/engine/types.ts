import type {
  DiagnosticAnswers,
  ConstitutionalMicroReport,
  ConstitutionalRouteSummary,
} from "@/lib/diagnostics/constitutional-diagnostic-derivation";
import type { ConstitutionInput, ConstitutionalDecision } from "@/lib/constitution/rules";

export type EngineTelemetry = {
  startedAt?: string;
  submittedAt?: string;
  questionTimingsMs?: Record<string, number>;
  clientSessionId?: string;
};

export type EngineContext = {
  sessionContext: string;
  operatorKey: string;
  source: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  responseDetail?: "full" | "reduced";
};

export type ClassifiedSignalSet = {
  report: ConstitutionalMicroReport;
  constitutionalInput: ConstitutionInput;
  answers: DiagnosticAnswers;
};

export type HiddenSignals = {
  contradictionDensity: number;
  hesitationIndex: number;
  certaintyCompression: number;
  narrativeDrift: number;
};

export type SignalPacket = {
  visibleSeed: number;
  hidden: HiddenSignals;
  orderSeed: number;
};

export type WeightedSignalResult = {
  report: ConstitutionalMicroReport;
  constitutionalInput: ConstitutionInput;
  hiddenWeightShare: number;
  narrativeOrderSeed: number;
};

export type ArbitrationResult = {
  internalDecision: ConstitutionalDecision;
  clientDecision: {
    route: ConstitutionalDecision["route"];
    confidence: number;
    disqualifiersTriggered: string[];
    recommendedInterventions: string[];
    rationale: string[];
    escalationAllowed: boolean;
  };
};

export type NarrativeResult = {
  report: ConstitutionalMicroReport;
  routeSummary: ConstitutionalRouteSummary;
};
