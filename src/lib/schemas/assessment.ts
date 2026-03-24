import { z } from 'zod';

// --- ENUMS ---

export const AlignmentBandSchema = z.enum([
  'ALIGNED', 
  'DRIFTING', 
  'MISALIGNED', 
  'DISORDERED'
]);

// --- CORE ASSESSMENT OBJECTS ---

export const EnterpriseAssessmentSchema = z.object({
  id: z.string().cuid().optional(), // Internal DB ID
  campaignId: z.string().cuid(),
  participantId: z.string().cuid(),
  organisationId: z.string().cuid(),
  teamName: z.string().nullish(),
  
  // The raw JSON blob of respondent answers
  answersJson: z.any(), 
  
  // Calculated scoring metrics
  totalScore: z.number().int(),
  percentScore: z.number().int().min(0).max(100),
  band: AlignmentBandSchema, // Strictly typed to our enum
  
  // Breakdown by diagnostic domain (e.g., { "Operational": 85, "Cultural": 40 })
  domainScoresJson: z.record(z.string(), z.number()),
  
  submittedAt: z.date().optional(),
});

/**
 * An aggregated "Snapshot" of a campaign's results.
 * Used for high-level dashboard reporting.
 */
export const SnapshotSchema = z.object({
  campaignId: z.string().cuid(),
  organisationId: z.string().cuid(),
  respondentCount: z.number().int(),
  percentScore: z.number().int(),
  
  // Aggregated averages across all respondents
  domainScoresJson: z.record(z.string(), z.number()),
  
  // Statistical variance/drift between different teams or roles
  varianceScoresJson: z.record(z.string(), z.number()),
  
  generatedAt: z.date().default(() => new Date()),
});

// Derived Types
export type AlignmentBand = z.infer<typeof AlignmentBandSchema>;
export type EnterpriseAssessment = z.infer<typeof EnterpriseAssessmentSchema>;
export type AssessmentSnapshot = z.infer<typeof SnapshotSchema>;