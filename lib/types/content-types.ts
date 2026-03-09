// lib/types/content-types.ts — SSOT Content Types (AccessTier)
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AccessTier } from "@/lib/access/tier-policy";
import { requiredTierFromDoc, getTierLabel } from "@/lib/access/tier-policy";

/**
 * Content access level - SSOT aligned
 * This is the canonical type for all content access control
 */
export type ContentAccessLevel = AccessTier;

/**
 * Legacy status values - for backward compatibility only
 * Use ContentAccessLevel for access control, not status
 */
export type ContentStatus = "draft" | "published" | "archived";

/**
 * Base content interface - SSOT aligned
 * All content types should extend this
 */
export interface ContentBase {
  // Core fields
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  date?: string;
  author?: string;
  category?: string;
  tags?: string | string[];
  featured?: boolean;
  readTime?: number | string;
  coverImage?: string;
  content?: string;

  // Publication status (not access control)
  draft?: boolean;
  published?: boolean;
  status?: ContentStatus;

  // ACCESS CONTROL - SSOT fields
  // These are the source-of-truth fields for access decisions
  accessLevel?: string;
  accessLevelSafe?: string;
  tier?: string;
  classification?: string;
  clearance?: string;
  requiresAuth?: boolean;

  // Optional lock message for gated content
  lockMessage?: string;

  // Contentlayer raw data
  _raw?: any;
  _id?: string;

  // Allow additional fields
  [key: string]: any;
}

/**
 * Helper to get normalized access tier from any content object
 * Use this instead of directly accessing accessLevel
 */
export function getContentAccessTier(content: ContentBase): AccessTier {
  return requiredTierFromDoc(content);
}

/**
 * Get human-readable access level label
 */
export function getContentAccessLabel(content: ContentBase): string {
  return getTierLabel(getContentAccessTier(content));
}

/**
 * Check if content is publicly accessible
 */
export function isPublicContent(content: ContentBase): boolean {
  return getContentAccessTier(content) === "public";
}

/**
 * Check if content requires authentication
 */
export function contentRequiresAuth(content: ContentBase): boolean {
  return getContentAccessTier(content) !== "public";
}

// ============================================================================
// CONTENT TYPE SPECIFIC INTERFACES
// All extend ContentBase with their specific fields
// ============================================================================

/**
 * Download specific types
 */
export interface DownloadMeta extends ContentBase {
  downloadFile?: string;
  fileSize?: string | number;
  downloadType?: string;
  version?: string;
}

export interface Download extends DownloadMeta {
  body?: any;
  toc?: any;
}

/**
 * Post (blog) type
 */
export type Post = ContentBase;

/**
 * Book type
 */
export interface Book extends ContentBase {
  isbn?: string;
  format?: string;
  publisher?: string;
  pages?: number;
  volume?: string;
  series?: string;
}

/**
 * Event type
 */
export interface Event extends ContentBase {
  eventDate?: string;
  location?: string;
  duration?: string;
  capacity?: number;
}

/**
 * Page type
 */
export interface Page extends ContentBase {
  pageType?: string;
  parentPage?: string;
  showInNav?: boolean;
  order?: number;
}

/**
 * Print type
 */
export type Print = ContentBase;

/**
 * Resource type
 */
export interface Resource extends ContentBase {
  resourceType?: string;
  applications?: string[];
  downloadUrl?: string;
}

/**
 * Strategy type
 */
export type Strategy = ContentBase;

/**
 * Canon type
 */
export interface Canon extends ContentBase {
  volumeNumber?: string | number;
  order?: number;
  part?: string;
  chapter?: string;
}

/**
 * Short type
 */
export interface Short extends ContentBase {
  shortType?: string;
  readingTime?: number;
}

/**
 * Brief type
 */
export interface Brief extends ContentBase {
  briefType?: string;
  classification?: string;
  references?: string[];
}

/**
 * Framework type
 */
export interface Framework extends ContentBase {
  frameworkType?: string;
  components?: string[];
  version?: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isDownload(content: ContentBase): content is Download {
  return "downloadFile" in content || "downloadType" in content;
}

export function isBook(content: ContentBase): content is Book {
  return "isbn" in content || "pages" in content;
}

export function isEvent(content: ContentBase): content is Event {
  return "eventDate" in content;
}

export function isPage(content: ContentBase): content is Page {
  return "pageType" in content || "showInNav" in content;
}

export function isResource(content: ContentBase): content is Resource {
  return "resourceType" in content;
}

export function isCanon(content: ContentBase): content is Canon {
  return "volumeNumber" in content || "order" in content;
}

export function isShort(content: ContentBase): content is Short {
  return "shortType" in content;
}

export function isBrief(content: ContentBase): content is Brief {
  return "briefType" in content;
}

export function isFramework(content: ContentBase): content is Framework {
  return "frameworkType" in content || "components" in content;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract all tags from content (handles both string and array formats)
 */
export function extractTags(content: ContentBase): string[] {
  if (!content.tags) return [];
  if (Array.isArray(content.tags)) return content.tags;
  if (typeof content.tags === "string") {
    return content.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Format read time consistently
 */
export function formatReadTime(minutes: number | string): string {
  if (typeof minutes === "string") {
    const parsed = parseInt(minutes, 10);
    if (isNaN(parsed)) return minutes;
    minutes = parsed;
  }

  if (minutes < 1) return "Less than a minute";
  if (minutes === 1) return "1 minute";
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${hours} ${hours === 1 ? "hour" : "hours"} ${remainingMinutes} min`;
}