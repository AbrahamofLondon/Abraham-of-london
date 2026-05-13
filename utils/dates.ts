/**
 * utils/dates.ts
 *
 * Date and time utilities for the integration layer and UI.
 * All inline date arithmetic across integrations, token management,
 * enterprise ingestion, and settings UI routes through here.
 */

// How long between full external API syncs for behavioral data providers.
// Prevents rate-limit hammering when signals endpoints are called frequently.
export const MIN_SYNC_INTERVAL_MINUTES = 15;

// ── ISO timestamps ────────────────────────────────────────────────────────────

/** Current time as an ISO 8601 string. Replaces new Date().toISOString(). */
export function nowISO(): string {
  return new Date().toISOString();
}

// ── Date arithmetic ───────────────────────────────────────────────────────────

/**
 * Returns a Date that is `seconds` from now.
 * Used for OAuth token expiry: fromNowSeconds(expiresIn).
 */
export function fromNowSeconds(seconds: number): Date {
  return new Date(Date.now() + seconds * 1_000);
}

/**
 * Returns an ISO string for `days` days ago from now.
 * Used for calendar sync lookback windows: daysAgoISO(30).
 */
export function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

// ── Expiry and staleness ──────────────────────────────────────────────────────

/**
 * Returns true if `date` is in the past.
 * Used for token expiry checks.
 */
export function isExpired(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getTime() < Date.now();
}

/**
 * Returns true if `date` is older than `minutes` minutes, or absent.
 * Used for sync staleness: skip external API call if synced recently.
 *
 * isStaleMinutes(lastSyncAt, 15) → true means "needs re-sync"
 */
export function isStaleMinutes(
  date: Date | string | null | undefined,
  minutes: number,
): boolean {
  if (!date) return true;
  const d = typeof date === "string" ? new Date(date) : date;
  return Date.now() - d.getTime() > minutes * 60_000;
}

// ── Enterprise data ───────────────────────────────────────────────────────────

/**
 * Normalises a raw observedAt value from CSV or manual import.
 * Returns a valid ISO string, or undefined if the value is absent,
 * unparseable, more than 1 day in the future, or older than 10 years.
 */
export function parseObservedAt(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return undefined;
  const ts = d.getTime();
  const now = Date.now();
  if (ts > now + 86_400_000) return undefined;            // implausibly future
  if (ts < now - 10 * 365 * 86_400_000) return undefined; // implausibly old
  return d.toISOString();
}

// ── UI display ────────────────────────────────────────────────────────────────

/**
 * Returns a human-readable relative time string.
 * "Just now" / "4m ago" / "2h ago" / "3d ago" / "Never"
 * Used in the Settings > Integrations page for lastSyncAt display.
 */
export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "Never";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/**
 * Returns a full UK-locale date and time string.
 * "13 May 2026, 14:30"
 * Used for audit displays and token expiry in admin views.
 */
export function formatDateTimeGB(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
