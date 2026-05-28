/**
 * lib/content/publication-eligibility.ts
 *
 * Shared publication classifier for all MDX content.
 *
 * Single source of truth for determining whether a document or series
 * is PUBLIC_READABLE_NOW, SCHEDULED_VISIBLE, SCHEDULED_HIDDEN, DRAFT, etc.
 *
 * All MDX route/audit scripts and series resolvers must use this classifier.
 */

// ─── Today's date for publication eligibility ────────────────────────────────
export function getToday(): Date {
  if (process.env.MDX_PUBLICATION_TODAY) {
    const override = new Date(process.env.MDX_PUBLICATION_TODAY);
    if (Number.isFinite(override.getTime())) return override;
  }
  return new Date();
}

// ─── Types ───────────────────────────────────────────────────────────────────

/** Classification for a single document */
export type PublicationClass =
  | "PUBLIC_READABLE_NOW"  // Published, not draft, not future-dated, public tier
  | "SCHEDULED"            // Future-dated or publicationStatus=scheduled
  | "DRAFT"                // draft=true or status=draft
  | "RESTRICTED"           // Non-public tier (member, verified, restricted)
  | "INTERNAL"             // Internal document type (outbound, dispatch)
  | "UNKNOWN";             // Cannot determine

/** Classification for a series */
export type SeriesPublicationState =
  | "COMPLETE"             // All intended parts are PUBLIC_READABLE_NOW
  | "IN_PROGRESS"          // Some parts PUBLIC_READABLE_NOW, some not
  | "SCHEDULED_VISIBLE"    // Zero readable parts, future parts exist, explicit preview permission
  | "SCHEDULED_HIDDEN"     // Zero readable parts, future parts exist, no preview permission
  | "DRAFT_INTERNAL"       // All draft/internal
  | "MIXED_REVIEW";        // Contradictory metadata

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

/**
 * Check if a document has explicit public preview/scheduled-visible permission.
 * Uses frontmatter field: seriesVisibility, publicPreview, or teaser.
 */
function hasPublicPreviewPermission(doc: any): boolean {
  const sv = safeStr(doc.seriesVisibility || doc.publicPreview || doc.teaser || "").toLowerCase();
  return sv === "scheduled" || sv === "visible" || sv === "true" || sv === "teaser";
}

// ─── Main classifier ─────────────────────────────────────────────────────────

/**
 * Classify a single document's publication state.
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

  // Check future date FIRST — future-dated content is SCHEDULED even if draft:true
  // (draft:true on future content is a safety mechanism, not the primary classification)
  const dateStr = safeStr(doc.date || doc.eventDate || doc.startDate || doc.scheduledDate || doc.releaseDate);
  if (dateStr) {
    const d = parseDate(dateStr);
    if (d && d > now) {
      const routePath = safeStr(doc.routePath || doc.hrefSafe || doc.href || "");
      if (AUTHORISED_OVERRIDES.has(routePath)) {
        return "PUBLIC_READABLE_NOW";
      }
      return "SCHEDULED";
    }
  }

  // Check explicit draft/published fields
  const draft = safeBool(doc.draft, false);
  const published = safeBool(doc.published, true);
  const status = (safeStr(doc.status || doc.publicationStatus)).toLowerCase();

  if (draft) return "DRAFT";
  if (published === false) return "DRAFT";
  if (status === "draft") return "DRAFT";

  // Check access tier
  const tier = safeStr(doc.accessTierSafe || doc.accessTier || doc.accessLevel || doc.tier || doc.classification || "public").toLowerCase();
  if (!["public", "open", "free", "unclassified"].includes(tier)) {
    return "RESTRICTED";
  }

  if (status === "scheduled" || status === "limited") return "SCHEDULED";

  return "PUBLIC_READABLE_NOW";
}

export function isPublicNow(doc: any, now: Date = getToday()): boolean {
  return classifyPublication(doc, now) === "PUBLIC_READABLE_NOW";
}

export function isScheduled(doc: any, now: Date = getToday()): boolean {
  return classifyPublication(doc, now) === "SCHEDULED";
}

// ─── Series-level classifier ─────────────────────────────────────────────────

/**
 * Compute series publication state from its parts.
 *
 * Rules:
 *   COMPLETE:          all intended parts are PUBLIC_READABLE_NOW
 *   IN_PROGRESS:       some parts PUBLIC_READABLE_NOW, some not
 *   SCHEDULED_VISIBLE: zero readable parts, future parts exist, explicit preview permission
 *   SCHEDULED_HIDDEN:  zero readable parts, future parts exist, no preview permission
 *   DRAFT_INTERNAL:    all draft
 *   MIXED_REVIEW:      contradictory metadata
 */
export function computeSeriesPublicationState(
  parts: any[],
  now: Date = getToday(),
): SeriesPublicationInfo {
  if (!parts || parts.length === 0) {
    return {
      totalParts: 0, publicNowParts: 0, scheduledParts: 0, draftParts: 0, restrictedParts: 0,
      firstPublicDate: null, nextScheduledDate: null,
      seriesVisibility: "DRAFT_INTERNAL", seriesStatusLabel: "Draft",
    };
  }

  let publicNowCount = 0, scheduledCount = 0, draftCount = 0, restrictedCount = 0;
  let firstPublicDate: string | null = null, nextScheduledDate: string | null = null;
  let hasPreviewPermission = false;

  for (const part of parts) {
    const classification = classifyPublication(part, now);
    switch (classification) {
      case "PUBLIC_READABLE_NOW":
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
    // Check if any part has preview permission
    if (hasPublicPreviewPermission(part)) hasPreviewPermission = true;
  }

  // Also check the first part for series-level visibility field
  const firstDoc = parts[0];
  if (firstDoc && hasPublicPreviewPermission(firstDoc)) hasPreviewPermission = true;

  let seriesVisibility: SeriesPublicationState;
  let seriesStatusLabel: string;

  if (publicNowCount === parts.length) {
    seriesVisibility = "COMPLETE";
    seriesStatusLabel = "Complete";
  } else if (publicNowCount > 0) {
    seriesVisibility = "IN_PROGRESS";
    seriesStatusLabel = "In progress";
  } else if (scheduledCount > 0 && scheduledCount + restrictedCount === parts.length) {
    if (hasPreviewPermission) {
      seriesVisibility = "SCHEDULED_VISIBLE";
      seriesStatusLabel = "Scheduled";
    } else {
      seriesVisibility = "SCHEDULED_HIDDEN";
      seriesStatusLabel = "Scheduled";
    }
  } else if (draftCount === parts.length) {
    seriesVisibility = "DRAFT_INTERNAL";
    seriesStatusLabel = "Draft";
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
 * Visible if: COMPLETE, IN_PROGRESS, or SCHEDULED_VISIBLE.
 */
export function isSeriesPublic(seriesInfo: SeriesPublicationInfo): boolean {
  return seriesInfo.seriesVisibility === "COMPLETE" ||
         seriesInfo.seriesVisibility === "IN_PROGRESS" ||
         seriesInfo.seriesVisibility === "SCHEDULED_VISIBLE";
}

/**
 * Check if a series part should be publicly readable.
 */
export function isSeriesPartReadable(seriesInfo: SeriesPublicationInfo): boolean {
  return seriesInfo.publicNowParts > 0;
}