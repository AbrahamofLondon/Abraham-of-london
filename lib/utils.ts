// lib/utils.ts

// ...

/**
 * Resolve a cover image from various possible fields and normalise the path.
 * Supports:
 * - coverImage
 * - heroImage
 * - image
 * - cover / banner (fallbacks from older content)
 */
export function resolveCoverImage(
  input:
    | {
        coverImage?: string | null;
        heroImage?: string | null;
        image?: string | null;
        cover?: string | null;
        banner?: string | null;
      }
    | null
    | undefined,
): string | null {
  if (!input) return null;

  const candidates = [
    input.coverImage,
    input.heroImage,
    input.image,
    input.cover,
    input.banner,
  ];

  const value = candidates.find(
    (v): v is string => typeof v === "string" && v.trim().length > 0,
  );

  if (!value) return null;

  const trimmed = value.trim();

  // Absolute / remote URLs – leave as is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Strip any leading "public/"
  const cleaned = trimmed.replace(/^public\//i, "");

  // Ensure a single leading slash for local assets
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}