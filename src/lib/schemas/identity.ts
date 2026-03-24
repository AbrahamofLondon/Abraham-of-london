import { z } from 'zod';

// --- ENUMS (Must match Prisma exactly to avoid validation drift) ---

export const AccessTierSchema = z.enum([
  'member', 
  'client', 
  'partner', 
  'executive', 
  'sovereign'
]);

export const MemberRoleSchema = z.enum([
  'ADMIN', 
  'STRATEGIST', 
  'MEMBER', 
  'CLIENT'
]);

export const MemberStatusSchema = z.enum([
  'active', 
  'inactive', 
  'pending', 
  'suspended'
]);

// Widened to match the stabilized Prisma Enum
export const ContentTypeSchema = z.enum([
  'Briefs',
  'Dossier',
  'Operational_Framework',
  'Landing',
  'Leadership',
  'Audit',
  'Research',
  'Sovereign_Intelligence',
  'Lexicon',
  'Intelligence',
  'Prints',
  'Strategy'
]);

// --- CORE IDENTITY OBJECTS ---

export const OrganizationSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1, "Organization name is required"),
  slug: z.string().min(1, "Slug is required"),
  sector: z.string().nullish(),
  sizeBand: z.string().nullish(),
  region: z.string().nullish(),
});

export const OrganizationMembershipSchema = z.object({
  id: z.string().cuid().optional(),
  organisationId: z.string().cuid(),
  userId: z.string().uuid().nullish(),
  email: z.string().email("Invalid email"),
  fullName: z.string().nullish(),
  teamName: z.string().nullish(),
  roleTitle: z.string().nullish(),
  isExecutive: z.boolean().default(false),
  status: MemberStatusSchema.default('active'),
});

// Derived Types for use in TypeScript interfaces
export type AccessTier = z.infer<typeof AccessTierSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type OrganizationMembership = z.infer<typeof OrganizationMembershipSchema>;