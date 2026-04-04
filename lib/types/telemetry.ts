// lib/types/telemetry.ts
export interface TelemetryMetrics {
  load: number;
  friction: number;
  dissonance: number;
  burnoutIndex: number;
  replacementLiability: number;
  avgUtilization: number;
}

export interface TelemetryData {
  resonance: number;
  activeNodes: number;
  logs: string[];
  metrics: TelemetryMetrics;
  timestamp: string;
}

export interface TelemetryResponse {
  success: boolean;
  data?: TelemetryData;
  error?: string;
}

export interface CorrectionNode {
  id: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'LIQUIDATED';
  domain: string;
  action: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlignmentCampaign {
  id: string;
  status: string;
  participants: Array<{ id: string; status: string }>;
}