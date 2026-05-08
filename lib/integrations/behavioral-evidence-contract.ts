/**
 * Behavioral evidence contract shared by Google Calendar sync,
 * Strategy Room verification, and Pattern-Breaker contracts.
 */

export type BehavioralEvidenceSource = "google_calendar" | "slack" | "manual";

export type CommitmentVerificationStatus =
  | "verified"
  | "partially_verified"
  | "unverified"
  | "conflicted";

export type BehavioralEvidenceContract = {
  source: BehavioralEvidenceSource;
  sessionId: string | null;
  userId: string | null;
  observedAt: string;
  meetingCompletion: number | null;
  responsePatterns: {
    attendanceRate: number | null;
    cancellationRate: number | null;
    recurringCompletionRate: number | null;
  };
  commitmentVerification: {
    status: CommitmentVerificationStatus;
    matchedCommitments: string[];
    missingCommitments: string[];
    verificationNotes: string[];
  };
  patternBreakerCompatible: boolean;
};

export type BehavioralEvidenceProvider = {
  provider: BehavioralEvidenceSource;
  fetchEvidence(input: {
    userId: string;
    sessionId?: string | null;
    commitments?: string[];
  }): Promise<BehavioralEvidenceContract | null>;
};
