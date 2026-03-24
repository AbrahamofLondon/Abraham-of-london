import { z } from "zod";
import { ENTERPRISE_ALIGNMENT_QUESTIONS } from "./enterprise-checklist";

// Ensure QUESTION_IDS are extracted for runtime validation
const QUESTION_IDS = ENTERPRISE_ALIGNMENT_QUESTIONS.map((q) => q.id);

/**
 * ORGANISATION SCHEMA
 * Hardened with automatic string trimming and null-transformation
 */
export const createOrganisationSchema = z.object({
  name: z.string()
    .min(2, "Organisation name must be at least 2 characters")
    .max(120)
    .trim(),
  slug: z.string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, alphanumeric, and use hyphens only")
    .trim(),
  sector: z.string().max(120).trim().nullable().optional().transform(v => v === "" ? null : v),
  sizeBand: z.string().max(120).trim().nullable().optional().transform(v => v === "" ? null : v),
  region: z.string().max(120).trim().nullable().optional().transform(v => v === "" ? null : v),
});

/**
 * CAMPAIGN SCHEMA
 * Defines the temporal and strategic bounds of an OGR audit cycle
 */
export const createCampaignSchema = z.object({
  organisationId: z.string().min(1, "Organisation ID is required"),
  title: z.string().min(3, "Title must be at least 3 characters").max(160).trim(),
  objective: z.string().max(1000).trim().nullable().optional(),
  opensAt: z.string().datetime({ message: "Invalid ISO 8601 date string" }).nullable().optional(),
  closesAt: z.string().datetime({ message: "Invalid ISO 8601 date string" }).nullable().optional(),
  cadenceType: z.enum(["ad_hoc", "quarterly", "annual"]).default("ad_hoc"),
  createdByMembershipId: z.string().nullable().optional(),
});

/**
 * MEMBERSHIPS SCHEMA
 * Bulk intake for team participants
 */
export const createMembershipsSchema = z.object({
  organisationId: z.string().min(1),
  members: z
    .array(
      z.object({
        email: z.string().email("Invalid email format").toLowerCase().trim(),
        fullName: z.string().max(160).trim().nullable().optional(),
        roleTitle: z.string().max(160).trim().nullable().optional(),
        teamName: z.string().max(160).trim().nullable().optional(),
        functionName: z.string().max(160).trim().nullable().optional(),
        seniorityBand: z.string().max(80).trim().nullable().optional(),
        isExecutive: z.boolean().default(false),
      })
    )
    .min(1, "At least one member must be provided"),
});

/**
 * CAMPAIGN INVITES SCHEMA
 * Logic-heavy validation to prevent duplicate transmissions
 */
export const createCampaignInvitesSchema = z.object({
  campaignId: z.string().min(1),
  participants: z
    .array(
      z.object({
        membershipId: z.string().min(1).nullable().optional(),
        email: z.string().email().toLowerCase().trim(),
      })
    )
    .min(1)
    .max(500)
    .superRefine((participants, ctx) => {
      const seenEmails = new Set<string>();

      for (const [index, participant] of participants.entries()) {
        const normalizedEmail = participant.email;

        if (seenEmails.has(normalizedEmail)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate email in invite batch: ${participant.email}`,
            path: [index, "email"],
          });
        }
        seenEmails.add(normalizedEmail);
      }
    }),
});

/**
 * ASSESSMENT SUBMISSION SCHEMA
 * Dynamic key validation against the verified checklist IDs
 */
export const submitEnterpriseAssessmentSchema = z.object({
  answers: z.record(z.string(), z.boolean()).superRefine((value, ctx) => {
    for (const key of Object.keys(value)) {
      if (!QUESTION_IDS.includes(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Security Alert: Unknown or unauthorized question ID detected: ${key}`,
        });
      }
    }
  }),
});