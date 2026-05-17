/**
 * lib/outbound/linkedin-types.ts — LinkedIn Outbound Types
 *
 * Shared types for the LinkedIn outbound publishing workflow.
 */

export type LinkedInStatus = "draft" | "ready" | "posted" | "archived" | "needs_review";

export type LinkedInPillar =
  | "decision_authority"
  | "strategy_room"
  | "provenance"
  | "executive_reporting"
  | "decision_centre"
  | "leadership"
  | "faith_strategy"
  | "market_intelligence";

export type LinkedInAudience =
  | "operators"
  | "founders"
  | "executives"
  | "boards"
  | "consultants"
  | "general";

export interface LinkedInFrontmatter {
  title: string;
  platform: string;
  channel: string;
  status: LinkedInStatus;
  campaign: string;
  pillar: LinkedInPillar;
  audience: LinkedInAudience;
  ctaLabel: string;
  ctaUrl: string;
  hashtags: string[];
  scheduledFor: string | null;
  postedAt: string | null;
  linkedinPostUrl: string | null;
  source: string | null;
}

export interface LinkedInPost {
  filename: string;
  frontmatter: Partial<LinkedInFrontmatter>;
  body: string;
  wordCount: number;
  charCount: number;
  isPosted: boolean;
  isLinkedInReady: boolean;
  warnings: string[];
  classification: "post" | "script" | "essay" | "misplaced_asset";
}

export interface MarkPostedRequest {
  filename: string;
  linkedinPostUrl: string;
  postedAt?: string;
}

export interface UpdateStatusRequest {
  filename: string;
  status: LinkedInStatus;
}
