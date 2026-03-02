// lib/content/contracts.ts — SSOT Content Contracts (single policy source)
import type { AccessTier } from "@/lib/access/tier-policy";
import {
  TIER_ORDER,
  TIER_LABELS,
  normalizeRequiredTier,
  normalizeUserTier,
  hasAccess,
} from "@/lib/access/tier-policy";

// Canonical enforcement levels
export const ACCESS_LEVELS = TIER_ORDER;
export type AccessLevel = AccessTier;

// Legacy/UI display tiers tolerated as inputs (normalizeRequiredTier handles these via SSOT aliases)
export const CONTENT_TIERS = [
  "public",
  "open",
  "free",
  "guest",
  "member",
  "basic",
  "inner-circle",
  "innercircle",
  "inner_circle",
  "ic",
  "premium",
  "client",
  "inner-circle-plus",
  "enterprise",
  "restricted",
  "private",
  "legacy",
  "elite",
  "inner-circle-elite",
  "architect",
  "founder",
  "owner",
  "admin",
  "top-secret",
  "confidential",
] as const;

export type ContentTier = (typeof CONTENT_TIERS)[number];

/**
 * Normalize any tier input to SSOT AccessLevel (required-context).
 * Unknown -> public (do not lock content by accident).
 */
export function normalizeToAccessLevel(input: string | null | undefined): AccessLevel {
  return normalizeRequiredTier(input);
}

/**
 * Check access (user-tier vs required-tier).
 * Unknown user tier -> public (never grant by accident).
 */
export function hasTierAccess(userTier: string | null | undefined, requiredTier: AccessLevel): boolean {
  const u = normalizeUserTier(userTier);
  const r = normalizeRequiredTier(requiredTier);
  return hasAccess(u, r);
}

/**
 * Get display label for a tier (SSOT).
 */
export function getTierLabel(tier: AccessLevel | ContentTier): string {
  return TIER_LABELS[normalizeRequiredTier(tier)];
}

// UI display variants for cover images
export const COVER_ASPECTS = ["wide", "book", "square"] as const;
export type CoverAspect = (typeof COVER_ASPECTS)[number];

export const COVER_FITS = ["cover", "contain"] as const;
export type CoverFit = (typeof COVER_FITS)[number];

export const COVER_POSITIONS = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "top left",
  "top right",
  "bottom left",
  "bottom right",
] as const;
export type CoverPosition = (typeof COVER_POSITIONS)[number];

/**
 * ✅ Download types enum
 */
export const DOWNLOAD_TYPES = [
  "other",
  "worksheet",
  "checklist",
  "template",
  "scorecard",
  "toolkit",
  "playbook",
  "cue-cards",
  "one-pager",
  "framework",
  "policy",
  "brief",
  "guide",
  "planner",
  "audit",
  "tracker",
  "deck",
  "canvas",
  "pack",
  "kit",
  "script",
  "liturgy",
  "diagnostic",
  "zip-bundle",
] as const;

export type DownloadType = (typeof DOWNLOAD_TYPES)[number];

export const DOWNLOAD_FORMATS = ["PDF", "EXCEL", "POWERPOINT", "DOCX", "ZIP", "IMAGE", "BINARY"] as const;
export type DownloadFormat = (typeof DOWNLOAD_FORMATS)[number];

export const RESOURCE_TYPES = [
  "guide",
  "toolkit",
  "framework",
  "template",
  "worksheet",
  "reference",
  "directory",
  "playbook",
  "policy",
  "brief",
  "other",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const SHORT_TYPES = ["other", "reflection", "principle", "field-note", "warning", "charge"] as const;
export type ShortType = (typeof SHORT_TYPES)[number];

export const EVENT_TYPES = ["other", "workshop", "salon", "webinar", "training", "live"] as const;
export type EventType = (typeof EVENT_TYPES)[number];