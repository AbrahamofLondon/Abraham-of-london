export type BehavioralSignalSnapshotRecord = {
  id: string;
  userId: string;
  organisationId?: string | null;
  accountId?: string | null;

  source: string;
  sourceLabel?: string | null;
  evidencePosture?: string | null;

  signalKey: string;
  signalValue: unknown;
  confidence?: number | null;

  evidenceWindowStart?: string | null;
  evidenceWindowEnd?: string | null;
  generatedAt: string;

  integrationConnectedAt?: string | null;
  rawCountBasis?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};
