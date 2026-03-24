import { z } from 'zod';

// --- ENUMS ---

export const CampaignStatusSchema = z.enum([
  'draft', 
  'scheduled', 
  'open', 
  'closed', 
  'archived'
]);

export const ParticipantStatusSchema = z.enum([
  'invited', 
  'opened', 
  'completed', 
  'bounced'
]);

// --- CORE CAMPAIGN OBJECTS ---

export const AlignmentCampaignSchema = z.object({
  id: z.string().cuid().optional(),
  organisationId: z.string().cuid(),
  title: z.string().min(3, "Title is too short"),
  objective: z.string().nullish(),
  status: CampaignStatusSchema.default('draft'),
  opensAt: z.coerce.date().nullish(),
  closesAt: z.coerce.date().nullish(),
  cadenceType: z.string().default('ad_hoc'),
});

export const CampaignParticipantSchema = z.object({
  id: z.string().cuid().optional(),
  campaignId: z.string().cuid(),
  membershipId: z.string().cuid().nullish(),
  email: z.string().email(),
  inviteTokenHash: z.string(),
  status: ParticipantStatusSchema.default('invited'),
  reminderCount: z.number().int().default(0),
});

// --- COMPOSITE SCHEMAS (For Forms & CSV Imports) ---

/**
 * Used when creating a campaign and its participants in a single batch.
 * This extends the base campaign schema to include the nested participant array.
 */
export const CreateCampaignRequestSchema = AlignmentCampaignSchema.extend({
  participants: z.array(
    z.object({
      email: z.string().email("A valid email is required"),
      fullName: z.string().nullish(),
      teamName: z.string().nullish(),
      roleTitle: z.string().nullish(), // Added to match Identity Membership needs
    })
  ).min(1, "At least one participant is required to launch a campaign"),
});

// Derived Types
export type AlignmentCampaign = z.infer<typeof AlignmentCampaignSchema>;
export type CampaignParticipant = z.infer<typeof CampaignParticipantSchema>;
export type CreateCampaignRequest = z.infer<typeof CreateCampaignRequestSchema>;