import { z } from 'zod';

// --- ENUMS & CONSTANTS ---
export const CampaignStatus = z.enum(["draft", "scheduled", "open", "closed", "archived"]);
export const ParticipantStatus = z.enum(["invited", "opened", "completed", "bounced"]);

// --- SUPPORTING SCHEMAS ---
const JsonValue = z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.any()), z.record(z.any())]);

// --- CORE ENTERPRISE MODELS ---

export const OrganisationSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  sector: z.string().nullish(),
  sizeBand: z.string().nullish(),
  region: z.string().nullish(),
});

export const AlignmentCampaignSchema = z.object({
  id: z.string().cuid().optional(),
  organisationId: z.string().cuid(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  objective: z.string().nullish(),
  status: CampaignStatus.default("draft"),
  opensAt: z.coerce.date().nullish(),
  closesAt: z.coerce.date().nullish(),
  cadenceType: z.string().default("ad_hoc"),
  createdByMembershipId: z.string().cuid().nullish(),
});

export const CampaignParticipantSchema = z.object({
  id: z.string().cuid().optional(),
  campaignId: z.string().cuid(),
  membershipId: z.string().cuid().nullish(),
  email: z.string().email("Invalid participant email"),
  inviteTokenHash: z.string(),
  status: ParticipantStatus.default("invited"),
  invitedAt: z.coerce.date().default(() => new Date()),
});

// --- COMPOSITE SCHEMA (For creating a campaign with a list of people) ---
export const CreateCampaignWithParticipantsSchema = AlignmentCampaignSchema.extend({
  participants: z.array(
    z.object({
      email: z.string().email("Valid email required"),
      fullName: z.string().nullish(),
      teamName: z.string().nullish(),
      roleTitle: z.string().nullish(),
    })
  ).min(1, "At least one participant is required"),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignWithParticipantsSchema>;