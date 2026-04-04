// lib/server/diagnostics/types.ts
export type ReportWatermarkPayload = {
  diagnosticRef: string;
  reportId: string;
  artifactId?: string | null;
  version: string;
  viewerEmail?: string | null;
  generatedAtISO: string;
  entitlementKey?: string | null;
};

export type ArtifactAccessDecision = {
  ok: boolean;
  reason?: string;
  artifactId?: string;
  grantId?: string;
};