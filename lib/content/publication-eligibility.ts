/**
 * lib/content/publication-eligibility.ts
 *
 * Shared publication classifier for all MDX content.
 *
 * Single source of truth for determining whether a document or series
 * is PUBLIC_NOW, SCHEDULED, DRAFT, RESTRICTED, or INTERNAL.
 *
 * All MDX route/audit scripts and series resolvers must use this classifier
 * or mirror it through a testable shared implementation.
 */

// ─── Today's date for publication eligibility ────────────────────────────────
// Use system date in production; override for testing.
export function getToday(): Date {
  if (process.env.MDX_PUBLICATION_TODAY) {
    const override = new Date(process.env.MDX_PUBLICATION_TODAY);
    if (Number.isFinite(override.getTime())) return override;
  }
  return new Date();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type PublicationClass =
  | "PUBLIC_NOW"    // Published, not draft, not future-dated, public tier
  | "SCHEDULED"     // Future-dated or publicationStatus=scheduled
  | "DRAFT"         // draft=true or status=draft
  | "RESTRICTED"    // Non-public tier (member, verified, restricted)
  | "INTERNAL"      // Internal document type (outbound, dispatch)
  | "UNKNOWN";      // Cannot determine

export type SeriesPublicationState =
  | "HIDDEN"        // Zero PUBLIC_NOW parts, no approved teaser
  | "SCHEDULED"     // All parts future-dated/scheduled
  | "IN_PROGRESS"   // Some PUBLIC_NOW parts, some not public yet
  | "COMPLETE"      // All intended parts PUBLIC_NOW
  | "DRAFT"         // All parts draft
  | "MIXED_REVIEW"; // Inconsistent metadata requiring manual review

export interface SeriesPublicationInfo {
  totalParts: number;
  publicNowParts: number;
  scheduledParts: number;
  draftParts: number;
  restrictedParts: number;
  firstPublicDate: string | null;
  nextScheduledDate: string | null;
  seriesVisibility: SeriesPublicationState;
  seriesStatusLabel: string;
}

// ─── Authorised overrides ────────────────────────────────────────────────────
// Documents that are intentionally public despite future dates
const AUTHORISED_OVERRIDES = new Set<string>([]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeStr(v: unknown, fallback = ""): string {
  return (v && typeof v === "string") ? v.trim() : fallback;
}

function safeBool(v: unknown, fallback = false): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "1", "yes"].includes(s)) return true;
    if (["false", "0", "no"].includes(s)) return false;
  }
  return fallback;
}

function parseDate(value: unknown): Date | null {
  const s = safeStr(value);
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

// ─── Main classifier ─────────────────────────────────────────────────────────

/**
 * Classify a single document's publication state.
 *
 * Inputs: draft, status, publicationStatus, published, date, accessLevel, tier
 * Returns one of: PUBLIC_NOW, SCHEDULED, DRAFT, RESTRICTED, INTERNAL, UNKNOWN
 */
export function classifyPublication(
  doc: any,
  now: Date = getToday(),
): PublicationClass {
  if (!doc) return "UNKNOWN";

  // Internal document types
  const type = safeStr(doc.type || doc.docKind || "");
  if (["LinkedInOutbound", "FacebookOutbound", "XOutbound", "Dispatch"].includes(type)) {
    return "INTERNAL";
  }

  // Check explicit draft/published fields
  const draft = safeBool(doc.draft, false);
  const published = safeBool(doc.published, true);
  const status = (safeStr(doc.status || doc.publicationStatus)).toLowerCase();

  // Explicit draft markers
  if (draft) return "DRAFT";
  if (published === false) return "DRAFT";
  if (status === "draft") return "DRAFT";

  // Check access tier
  const tier = safeStr(doc.accessTierSafe || doc.accessTier || doc.accessLevel || doc.tier || doc.classification || "public").toLowerCase();
  if (!["public", "open", "free", "unclassified"].includes(tier)) {
    return "RESTRICTED";
  }

  // Check future date
  const dateStr = safeStr(doc.date || doc.eventDate || doc.startDate || doc.scheduledDate || doc.releaseDate);
  if (dateStr) {
    const d = parseDate(dateStr);
    if (d && d > now) {
      // Check for authorised override
      const routePath = safeStr(doc.routePath || doc.hrefSafe || doc.href || "");
      if (AUTHORISED_OVERRIDES.has(routePath)) {
        return "PUBLIC_NOW";
      }
      return "SCHEDULED";
    }
  }

  // Check status field for scheduled
  if (status === "scheduled" || status === "limited") return "SCHEDULED";

  // Default: public now
  return "PUBLIC_NOW";
}

/**
 * Check if a document is public now (convenience wrapper).
 */
export function isPublicNow(doc: any, now: Date = getToday()): boolean {
  return classifyPublication(doc, now) === "PUBLIC_NOW";
}

/**
 * Check if a document is scheduled (future-dated but not draft).
 */
export function isScheduled(doc: any, now: Date = getToday()): boolean {
  return classifyPublication(doc, now) === "SCHEDULED";
}

// ─── Series-level classifier ─────────────────────────────────────────────────

/**
 * Compute series publication state from its parts.
 *
 * @param parts - Array of document objects that belong to the series
 * @param now - Reference date (defaults to today)
 * @returns SeriesPublicationInfo with computed state and labels
 */
export function computeSeriesPublicationState(
  parts: any[],
  now: Date = getToday(),
): SeriesPublicationInfo {
  if (!parts || parts.length === 0) {
    return {
      totalParts: 0,
      publicNowParts: 0,
      scheduledParts: 0,
      draftParts: 0,
      restrictedParts: 0,
      firstPublicDate: null,
      nextScheduledDate: null,
      seriesVisibility: "HIDDEN",
      seriesStatusLabel: "Hidden",
    };
  }

  let publicNowCount = 0;
  let scheduledCount = 0;
  let draftCount = 0;
  let restrictedCount = 0;
  let firstPublicDate: string | null = null;
  let nextScheduledDate: string | null = null;

  for (const part of parts) {
    const classification = classifyPublication(part, now);
    switch (classification) {
      case "PUBLIC_NOW":
        publicNowCount++;
        const pd = safeStr(part.date || part.eventDate || part.startDate);
        if (pd && (!firstPublicDate || pd < firstPublicDate)) firstPublicDate = pd;
        break;
      case "SCHEDULED":
        scheduledCount++;
        const sd = safeStr(part.date || part.eventDate || part.startDate);
        if (sd && (!nextScheduledDate || sd < nextScheduledDate)) nextScheduledDate = sd;
        break;
      case "DRAFT":
        draftCount++;
        break;
      case "RESTRICTED":
        restrictedCount++;
        break;
    }
  }

  // Compute series visibility
  let seriesVisibility: SeriesPublicationState;
  let seriesStatusLabel: string;

  if (publicNowCount === parts.length) {
    seriesVisibility = "COMPLETE";
    seriesStatusLabel = "Complete";
  } else if (publicNowCount > 0) {
    seriesVisibility = "IN_PROGRESS";
    seriesStatusLabel = "In progress";
  } else if (scheduledCount > 0 && scheduledCount + restrictedCount === parts.length) {
    seriesVisibility = "SCHEDULED";
    seriesStatusLabel = "Scheduled";
  } else if (draftCount === parts.length) {
    seriesVisibility = "DRAFT";
    seriesStatusLabel = "Draft";
  } else if (publicNowCount === 0 && scheduledCount === 0 && draftCount === 0 && restrictedCount === 0) {
    seriesVisibility = "HIDDEN";
    seriesStatusLabel = "Hidden";
  } else {
    seriesVisibility = "MIXED_REVIEW";
    seriesStatusLabel = "Review needed";
  }

  return {
    totalParts: parts.length,
    publicNowParts: publicNowCount,
    scheduledParts: scheduledCount,
    draftParts: draftCount,
    restrictedParts: restrictedCount,
    firstPublicDate,
    nextScheduledDate,
    seriesVisibility,
    seriesStatusLabel,
  };
}

/**
 * Check if a series should be publicly visible.
 * A series is public only if at least one part is PUBLIC_NOW,
 * unless it has an explicitly approved public teaser/index mode.
 */
export function isSeriesPublic(seriesInfo: SeriesPublicationInfo): boolean {
  return seriesInfo.publicNowParts > 0;
}
