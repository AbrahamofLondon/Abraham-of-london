// lib/utils.ts

// -----------------------------------------------------------------------------
// Classname helper (used across components – incl. InteractiveElements)
// -----------------------------------------------------------------------------
export function cn(
  ...values: Array<string | number | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

// -----------------------------------------------------------------------------
// Safe string conversion for TypeScript compatibility
// -----------------------------------------------------------------------------

/**
 * Safely convert any string-like value to a string, handling null/undefined.
 * Useful for HTML attributes that require strings but props allow null.
 */
export function safeString(value: string | null | undefined): string {
  return value ?? "";
}

// -----------------------------------------------------------------------------
// Environment URL helpers
// -----------------------------------------------------------------------------

export const ENV_KEYS = {
  ALOMARADA_URL: "NEXT_PUBLIC_ALOMARADA_URL",
  ENDURELUXE_URL: "NEXT_PUBLIC_ENDURELUXE_URL",
  INNOVATEHUB_URL: "NEXT_PUBLIC_INNOVATEHUB_URL",
  INNOVATEHUB_ALT_URL: "NEXT_PUBLIC_INNOVATEHUB_ALT_URL",
} as const;

/**
 * Pick the first defined environment URL from a list of env keys.
 * Falls back to the provided default if none are set.
 */
export function pickEnvUrl(keys: readonly string[], fallback: string): string {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return fallback;
}

// -----------------------------------------------------------------------------
// Safe URL join (fixes the previous `normalizedBase` bug)
// -----------------------------------------------------------------------------

/**
 * Safely join a base URL and a path segment.
 * - Handles trailing/leading slashes
 * - Attempts URL constructor first, then falls back to string join
 */
export function safeJoinUrl(base: string, path?: string | null): string {
  const trimmedBase = (base || "").trim();
  if (!path || !path.trim()) return trimmedBase;

  const trimmedPath = path.trim();

  try {
    const joined = new URL(trimmedPath, trimmedBase);
    return joined.toString();
  } catch {
    const baseClean = trimmedBase.replace(/\/+$/, "");
    const pathClean = trimmedPath.replace(/^\/+/, "");
    return `${baseClean}/${pathClean}`;
  }
}

// -----------------------------------------------------------------------------
// Cover image resolver (used for Events, etc.)
// -----------------------------------------------------------------------------

type HasCoverFields = {
  coverImage?: string | null;
  heroImage?: string | null;
  image?: string | null;
  bannerImage?: string | null;
  thumbnail?: string | null;
};

/**
 * Resolve a "best guess" cover image from various potential fields.
 */
export function resolveCoverImage(input: HasCoverFields): string | null {
  const candidates = [
    input.coverImage,
    input.heroImage,
    input.image,
    input.bannerImage,
    input.thumbnail,
  ];

  const chosen = candidates.find(
    (val) => typeof val === "string" && val.trim().length > 0
  );

  return chosen ?? null;
}