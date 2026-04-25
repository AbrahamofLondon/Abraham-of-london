// lib/alignment/contract-types.ts

export type ContractStatus = "pending" | "completed" | "breached" | "extended" | "archived";

export interface PatternBreakerContract {
  id: string;
  subjectId: string;
  
  // The pattern from derivePatternReading
  weakestDomain: string;
  patternTitle: string;
  primaryPattern: string;
  sharpestSignal: {
    statement: string;
    resonance: number;
    certainty: number;
  } | null;
  
  // User commitments
  userCommitment: string;
  deadline: string; // ISO date
  consequenceOfInaction: string;
  
  // Demographic context (anonymized for trend detection)
  demographic: {
    role: string;
    industry: string;
    teamSize?: string;
    gender?: string | null;
    yearsInRole?: string;
    ageRange?: string;
  };
  
  // Enforcement
  verificationToken: string;
  status: ContractStatus;
  signedAt: string;
  completedAt?: string;
  breachedAt?: string;
  breachReason?: string;
  
  // Learning
  recurrenceCount: number; // How many times same pattern returned
  previousContractId?: string; // Link to prior contract
  
  // System metadata
  createdAt: string;
  updatedAt: string;
}

export interface PeerComparison {
  role: string;
  weakestDomain: string;
  totalContracts: number;
  breachRate: number;
  completionRate: number;
  averageCompletionDays: number;
  percentileRank: number; // 0-100, higher = worse than peers
}

export interface VerificationRequest {
  contractId: string;
  sentAt: string;
  respondedAt?: string;
  response: "completed" | "breached" | null;
  userNote?: string;
}