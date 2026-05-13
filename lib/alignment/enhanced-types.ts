// lib/alignment/enhanced-types.ts
// All new types for the hardened system

import type { DualAxisAnswer, AlignmentDomain, CoherenceBand } from "./types";

export type { DualAxisAnswer, AlignmentDomain, CoherenceBand };

export type DemographicData = {
  role?: string;
  seniority?: string;
  industry?: string;
  companySize?: string;
  yearsInRole?: number;
  region?: string;
};

export type ContractStatus = "pending" | "completed" | "breached" | "extended" | "archived";

export interface ExecutionTrace {
  contractId: string;
  checkpoints: Array<{
    scheduledAt: string;
    type: "email" | "push" | "sms" | "in_app";
    status: "pending" | "sent" | "opened" | "clicked" | "responded";
    userResponse?: string;
    deliveredAt?: string;
    respondedAt?: string;
  }>;
  microActions: Array<{
    action: string;
    completedAt: string;
    source: "user_report" | "integrated_calendar" | "email_tracking" | "slack_command";
    evidence?: string;
  }>;
  currentProgress: number; // 0-100
  predictedCompletion: string | null;
  lastCheckinAt: string;
  nextCheckinAt: string;
  extensionGranted?: boolean;
  extensionReason?: string;
  modifiedDeadline?: string;
  extensionCount?: number;
}

export interface DecisionTrace {
  traceId: string;
  contractId: string;
  subjectId: string;
  
  // Inputs gathered
  assessmentAnswers: Record<string, DualAxisAnswer>;
  reflections: { avoidedDecision: string; lastSevenDays: string; dissenter: string };
  demographicContext: DemographicData;
  
  // Policies applied
  scoringMethodology: "resonance_x_certainty_div_10";
  patternClassification: string;
  weakestDomain: AlignmentDomain;
  coherenceBand: CoherenceBand;
  percentScore: number;
  
  // Exceptions granted
  extensionGranted: boolean;
  extensionReason?: string;
  originalDeadline: string;
  modifiedDeadline?: string;
  extensionCount: number;
  
  // Why decisions were made (synthesis rationale)
  synthesisRationale: string;
  deterministicScore: number;
  generativeOutputUsed: boolean;
  tournamentVerdict: "deterministic_wins" | "generative_wins" | "contradiction_detected";
  contradictionsDetected: string[];
  
  // Outcomes
  status: ContractStatus;
  verifiedAt?: string;
  actualOutcome?: string;
  breachReason?: string;
  
  // Learning that compounds
  updatedConfidenceScore: number; // 0-100, adjusts future recommendations
  patternReinforced: boolean;
  previousTraceId?: string; // Link to prior trace for recurrence detection
  
  // Timestamps
  signedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationContext {
  orgId: string;
  name: string;
  members: string[];
  inviteCode: string;
  createdAt: string;
  
  // Aggregated intelligence (calculated periodically)
  patternDistribution: Record<AlignmentDomain, number>;
  avgBreachRate: number;
  avgCompletionTime: number;
  totalContracts: number;
  activeContracts: number;
  
  // Leadership dashboard data
  highRiskMembers: Array<{ subjectId: string; riskScore: number; pattern: string; currentContractId?: string }>;
  teamTrends: Array<{ month: string; breachRate: number; completionRate: number }>;
  
  // Comparative advantage
  vsIndustryBenchmark?: {
    percentile: number;
    betterThanXPercent: number;
    industry: string;
  };
}

export interface BehavioralDataSource {
  type: "calendar" | "email" | "slack" | "jira" | "linear" | "github" | "notion";
  connectionId: string;
  connectedAt: string;
  lastSyncAt: string;
  status: "active" | "error" | "disconnected";
  sourceLabel?: string;
  evidencePosture?: string;
  evidenceWindowStart?: string;
  evidenceWindowEnd?: string;
  integrationConnectedAt?: string;
  rawCountBasis?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  
  // Extracted signals
  signals: {
    // Calendar (Google Calendar)
    meetingCompletion?: number;        // % of events with status "confirmed" vs total
    meetingAttendanceRate?: number;    // % of meetings where self.responseStatus === "accepted"
    meetingCancellationRate?: number;  // % of events with status "cancelled" vs total
    recurringMeetingStability?: number; // % of recurring events that are confirmed

    // Email
    emailResponsiveness?: number;      // Avg response time to key stakeholders (hours)

    // Task management (Jira, Linear)
    taskClosureRate?: number;          // % of tasks closed vs created
    jiraTicketVelocity?: number;       // Tickets moved to done per week

    // Code (GitHub)
    codeMergeFrequency?: number;       // PRs merged per week

    // Slack
    slackResponsiveness?: number;      // Avg response time in key channels (hours)

    // Notion / docs
    documentActivity?: number;         // Edits/views in key docs
  };
}

export interface TournamentResult {
  deterministicOutput: string;
  generativeOutput: string;
  arbiterVerdict: "deterministic_wins" | "generative_wins" | "contradiction_detected";
  winningOutput: string;
  confidence: number;
  contradictions: string[];
  quotedUserLanguage: boolean;
}

export interface GlobalTrends {
  totalContracts: number;
  totalUsers: number;
  roleBreakdown: Array<{ name: string; breachRate: number; completionRate: number; count: number }>;
  industryBreakdown: Array<{ name: string; breachRate: number; completionRate: number; count: number }>;
  domainDifficulty: Array<{ name: string; difficulty: number; recurrenceRate: number }>;
  orgCompletionRate: number;
  orgVsBenchmark: number;
  orgPercentile: number;
  actionableInsight: string;
  topPerformingRoles: string[];
  highestRiskDomains: string[];
}

export interface MicroCheckin {
  contractId: string;
  daysRemaining: number;
  userResponse?: "completed" | "in_progress" | "blocked" | "need_extension";
  blockerDescription?: string;
  progressUpdate?: string;
  timestamp: string;
}
