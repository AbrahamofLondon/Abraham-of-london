// lib/content/contracts.ts
export const ACCESS_LEVELS = [
  "public",
  "free",
  "inner-circle",
  "basic",
  "inner-circle-plus",
  "premium",
  "inner-circle-elite",
  "enterprise",
  "private",
  "restricted",
] as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[number];

// Optional legacy/UX “tier” field (maps to membership display, not enforcement)
export const CONTENT_TIERS = [
  "public",
  "free",
  "inner-circle",
  "basic",
  "inner-circle-plus",
  "premium",
  "inner-circle-elite",
  "enterprise",
  "private",
  "restricted",
] as const;

export type ContentTier = (typeof CONTENT_TIERS)[number];

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
 * ✅ “24 download types” enum (use consistently)
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

export const DOWNLOAD_FORMATS = [
  "PDF",
  "EXCEL",
  "POWERPOINT",
  "DOCX",
  "ZIP",
  "IMAGE",
  "BINARY",
] as const;

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